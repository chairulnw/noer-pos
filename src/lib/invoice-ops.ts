import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { paymentStatus } from "@/lib/billing";
import { StockConflictError, deductForInvoiceItem } from "@/lib/inventory";
import { createDraftInvoiceFromRecord, nextInvoiceNoFor, recomputeInvoice, taxFromSettings } from "@/lib/invoices";
import type { Discount, PayInput, VoidInput } from "@/lib/invoice-schema";

type Tx = Prisma.TransactionClient;
type Fail = { error: string };

const NOT_FOUND = "Invoice tidak ditemukan.";
const LOCKED = "Invoice sudah final atau di-void dan tidak bisa diubah.";

class Rejected extends Error {}

async function lockStatus(tx: Tx, id: string) {
  const rows = await tx.$queryRaw<{ status: "DRAFT" | "FINAL" | "VOID" }[]>`SELECT status::text AS status FROM invoice WHERE id = ${id}::uuid FOR UPDATE`;
  return rows[0]?.status ?? null;
}

async function editDraft<T extends object>(invoiceId: string, fn: (tx: Tx) => Promise<T | Fail>) {
  const tax = await taxFromSettings();
  return prisma.$transaction(async (tx) => {
    const status = await lockStatus(tx, invoiceId);
    if (!status) return { error: NOT_FOUND };
    if (status !== "DRAFT") return { error: LOCKED };
    const result = await fn(tx);
    if (!("error" in result)) await recomputeInvoice(tx, invoiceId, tax);
    return result;
  });
}

export const addInvoiceItem = (invoiceId: string, itemId: string, qty: number) =>
  editDraft(invoiceId, async (tx) => {
    const item = await tx.item.findFirst({ where: { id: itemId, active: true, deletedAt: null }, select: { id: true, name: true, sellPrice: true, buyPrice: true } });
    if (!item) return { error: "Item tidak ditemukan atau nonaktif." };

    const existing = await tx.invoiceItem.findFirst({ where: { invoiceId, itemId }, select: { id: true } });
    if (existing) {
      await tx.invoiceItem.update({ where: { id: existing.id }, data: { qty: { increment: qty } } });
      return {};
    }
    const last = await tx.invoiceItem.aggregate({ where: { invoiceId }, _max: { position: true } });
    await tx.invoiceItem.create({
      data: { invoiceId, itemId, nameSnapshot: item.name, qty, unitPriceSnapshot: item.sellPrice, unitCostSnapshot: item.buyPrice, position: (last._max.position ?? -1) + 1, lineTotal: 0 },
    });
    return {};
  });

export const updateInvoiceItem = (userId: string, invoiceId: string, lineId: string, qty: number, discount: Discount) =>
  editDraft(invoiceId, async (tx) => {
    const line = await tx.invoiceItem.findFirst({ where: { id: lineId, invoiceId }, select: { nameSnapshot: true, discountType: true, discountValue: true } });
    if (!line) return { error: "Item invoice tidak ditemukan." };

    await tx.invoiceItem.update({ where: { id: lineId }, data: { qty, discountType: discount.type, discountValue: discount.value } });
    if (line.discountType !== discount.type || line.discountValue !== discount.value) {
      await logAudit(tx, {
        userId,
        action: "invoice.discount_item",
        entity: "invoice",
        entityId: invoiceId,
        before: { item: line.nameSnapshot, type: line.discountType, value: line.discountValue },
        after: { item: line.nameSnapshot, type: discount.type, value: discount.value },
      });
    }
    return {};
  });

export const removeInvoiceItem = (invoiceId: string, lineId: string) =>
  editDraft(invoiceId, async (tx) => {
    const { count } = await tx.invoiceItem.deleteMany({ where: { id: lineId, invoiceId } });
    return count === 1 ? {} : { error: "Item invoice tidak ditemukan." };
  });

export const setInvoiceDiscount = (userId: string, invoiceId: string, discount: Discount) =>
  editDraft(invoiceId, async (tx) => {
    const before = await tx.invoice.findUniqueOrThrow({ where: { id: invoiceId }, select: { discountType: true, discountValue: true } });
    await tx.invoice.update({ where: { id: invoiceId }, data: { discountType: discount.type, discountValue: discount.value } });
    if (before.discountType !== discount.type || before.discountValue !== discount.value) {
      await logAudit(tx, {
        userId,
        action: "invoice.discount",
        entity: "invoice",
        entityId: invoiceId,
        before: { type: before.discountType, value: before.discountValue },
        after: { type: discount.type, value: discount.value },
      });
    }
    return {};
  });

export async function createRetailInvoice(userId: string, customerName: string) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const invoice = await tx.invoice.create({
          data: { invoiceNo: await nextInvoiceNoFor(tx), createdById: userId, customerName: customerName || null },
          select: { id: true },
        });
        return invoice.id;
      });
    } catch (error) {
      const clash = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
      if (!clash || attempt >= 3) throw error;
    }
  }
}

export async function payInvoice(userId: string, invoiceId: string, pay: PayInput): Promise<Fail | { ok: true; change: number }> {
  const tax = await taxFromSettings();
  try {
    return await prisma.$transaction(
      async (tx) => {
        const status = await lockStatus(tx, invoiceId);
        if (!status) return { error: NOT_FOUND };
        if (status === "VOID") return { error: "Invoice sudah di-void." };

        if (status === "DRAFT") {
          await recomputeInvoice(tx, invoiceId, tax);
          await finalizeDraft(tx, userId, invoiceId);
        }

        const invoice = await tx.invoice.findUniqueOrThrow({
          where: { id: invoiceId },
          select: { invoiceNo: true, grandTotal: true, visitId: true, payments: { where: { voided: false }, select: { amount: true } } },
        });
        const paid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
        const remaining = invoice.grandTotal - paid;

        if (status === "FINAL" && remaining <= 0) return { error: "Invoice sudah lunas." };

        let change = 0;
        if (remaining > 0) {
          if (pay.method === "TUNAI") {
            if (pay.cashReceived === null || pay.cashReceived < remaining) throw new Rejected("Uang diterima kurang dari total tagihan.");
            change = pay.cashReceived - remaining;
          }
          const payment = await tx.payment.create({
            data: {
              invoiceId,
              kind: paid > 0 ? "PELUNASAN" : "LUNAS",
              method: pay.method,
              amount: remaining,
              cashReceived: pay.cashReceived,
              reference: pay.reference || null,
              receivedById: userId,
            },
            select: { id: true },
          });
          await logAudit(tx, { userId, action: "payment.create", entity: "invoice", entityId: invoiceId, after: { paymentId: payment.id, method: pay.method, amount: remaining } });
        }

        if (paymentStatus(paid + Math.max(remaining, 0), invoice.grandTotal) === "LUNAS" && invoice.visitId) {
          await tx.visit.updateMany({ where: { id: invoice.visitId, status: { in: ["DILAYANI", "MENUNGGU_BAYAR"] } }, data: { status: "SELESAI" } });
        }
        return { ok: true as const, change };
      },
      { timeout: 20_000 },
    );
  } catch (error) {
    if (error instanceof Rejected) return { error: error.message };
    if (error instanceof StockConflictError) return { error: "Stok berubah saat diproses. Coba lagi." };
    throw error;
  }
}

async function finalizeDraft(tx: Tx, userId: string, invoiceId: string) {
  const invoice = await tx.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    select: { invoiceNo: true, grandTotal: true, items: { select: { id: true, itemId: true, nameSnapshot: true, qty: true, item: { select: { type: true } } }, orderBy: { position: "asc" } } },
  });
  if (invoice.items.length === 0) throw new Rejected("Invoice belum berisi item.");

  const problems: string[] = [];
  for (const line of invoice.items) {
    if (line.item.type !== "PRODUCT") continue;
    const result = await deductForInvoiceItem(tx, { userId, invoiceItemId: line.id, itemId: line.itemId, qty: Number(line.qty), invoiceNo: invoice.invoiceNo });
    if (result.error) {
      problems.push(`${line.nameSnapshot}: stok tidak cukup (tersedia ${result.available.toLocaleString("id-ID")}, dibutuhkan ${Number(line.qty).toLocaleString("id-ID")})`);
    } else {
      await tx.invoiceItem.update({ where: { id: line.id }, data: { unitCostSnapshot: result.unitCost } });
    }
  }
  if (problems.length > 0) throw new Rejected(`Stok tidak mencukupi. ${problems.join("; ")}.`);

  await tx.invoice.update({ where: { id: invoiceId }, data: { status: "FINAL", finalizedAt: new Date() } });
  await logAudit(tx, { userId, action: "invoice.finalize", entity: "invoice", entityId: invoiceId, after: { invoiceNo: invoice.invoiceNo, grandTotal: invoice.grandTotal } });
}


export async function voidInvoice(userId: string, invoiceId: string, input: VoidInput): Promise<Fail | { ok: true; restocked: number }> {
  return prisma.$transaction(async (tx) => {
    const status = await lockStatus(tx, invoiceId);
    if (!status) return { error: NOT_FOUND };
    if (status === "VOID") return { error: "Invoice sudah di-void." };

    const invoice = await tx.invoice.findUniqueOrThrow({
      where: { id: invoiceId },
      select: { invoiceNo: true, grandTotal: true, visitId: true, items: { select: { id: true, nameSnapshot: true } } },
    });

    const restock: { item: string; qty: number }[] = [];
    if (status === "FINAL") {
      const lines = new Map(invoice.items.map((i) => [i.id, i.nameSnapshot]));
      for (const lineId of new Set(input.restockLineIds)) {
        if (!lines.has(lineId)) continue;
        const outs = await tx.stockMovement.findMany({ where: { invoiceItemId: lineId, type: "OUT" }, select: { batchId: true, qty: true } });
        let total = 0;
        for (const out of outs) {
          const back = -Number(out.qty);
          await tx.stockBatch.update({ where: { id: out.batchId }, data: { qtyOnHand: { increment: back } } });
          await tx.stockMovement.create({
            data: { batchId: out.batchId, type: "VOID_RETURN", qty: back, refType: "invoice_void", refId: lineId, invoiceItemId: lineId, note: invoice.invoiceNo, userId },
          });
          total += back;
        }
        if (total > 0) restock.push({ item: lines.get(lineId)!, qty: total });
      }
    }

    await tx.invoice.update({ where: { id: invoiceId }, data: { status: "VOID", voidReason: input.reason, voidedById: userId } });
    await tx.payment.updateMany({ where: { invoiceId }, data: { voided: true } });
    if (invoice.visitId) {
      await tx.visit.updateMany({ where: { id: invoice.visitId, status: "SELESAI" }, data: { status: "MENUNGGU_BAYAR" } });
    }
    await logAudit(tx, {
      userId,
      action: "invoice.void",
      entity: "invoice",
      entityId: invoiceId,
      before: { status, invoiceNo: invoice.invoiceNo, grandTotal: invoice.grandTotal },
      after: { status: "VOID", reason: input.reason, restocked: restock },
    });
    return { ok: true as const, restocked: restock.length };
  });
}

export async function createReplacementInvoice(userId: string, voidedInvoiceId: string): Promise<Fail | { id: string }> {
  const tax = await taxFromSettings();
  const source = await prisma.invoice.findUnique({
    where: { id: voidedInvoiceId },
    select: { status: true, visit: { select: { medicalRecord: { select: { id: true } } } } },
  });
  if (!source || source.status !== "VOID") return { error: "Invoice asal harus berstatus void." };
  const recordId = source.visit?.medicalRecord?.id;
  if (!recordId) return { error: "Invoice pengganti hanya untuk invoice kunjungan. Untuk retail, buat invoice retail baru." };

  for (let attempt = 1; ; attempt++) {
    try {
      const id = await prisma.$transaction((tx) => createDraftInvoiceFromRecord(tx, userId, recordId, tax));
      return id ? { id } : { error: "Kunjungan ini sudah punya invoice aktif." };
    } catch (error) {
      const clash = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
      if (!clash || attempt >= 3) throw error;
    }
  }
}
