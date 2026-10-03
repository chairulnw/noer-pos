import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { todayJakarta } from "@/lib/date";
import { invoiceTotals, lineTotals, nextInvoiceNo, type Discount } from "@/lib/billing";
import { getSettings } from "@/lib/settings";

type Tx = Prisma.TransactionClient;

export const taxFromSettings = async () => {
  const settings = await getSettings();
  return { rate: settings.taxEnabled ? settings.taxRate : 0, included: settings.taxMode === "INCLUDE" };
};

async function createInvoiceNo(tx: Tx) {
  const datePart = todayJakarta().toISOString().slice(0, 10).replaceAll("-", "");
  const last = await tx.invoice.findFirst({
    where: { invoiceNo: { startsWith: `INV-${datePart}-` } },
    orderBy: { invoiceNo: "desc" },
    select: { invoiceNo: true },
  });
  return nextInvoiceNo(datePart, last?.invoiceNo ?? null);
}

export const lineView = (item: { qty: Prisma.Decimal; unitPriceSnapshot: number; discountType: "PERCENT" | "AMOUNT" | null; discountValue: number }) =>
  lineTotals({ qty: Number(item.qty), unitPrice: item.unitPriceSnapshot, discount: { type: item.discountType, value: item.discountValue } });

export async function recomputeInvoice(tx: Tx, invoiceId: string, tax: { rate: number; included: boolean }) {
  const invoice = await tx.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    select: { discountType: true, discountValue: true, items: { select: { id: true, qty: true, unitPriceSnapshot: true, discountType: true, discountValue: true } } },
  });

  for (const item of invoice.items) {
    await tx.invoiceItem.update({ where: { id: item.id }, data: { lineTotal: lineView(item).total } });
  }

  const totals = invoiceTotals(
    invoice.items.map((item) => ({ qty: Number(item.qty), unitPrice: item.unitPriceSnapshot, discount: { type: item.discountType, value: item.discountValue } })),
    { type: invoice.discountType, value: invoice.discountValue } satisfies Discount,
    tax,
  );
  await tx.invoice.update({
    where: { id: invoiceId },
    data: { ...totals, taxRate: tax.rate, taxIncluded: tax.included },
  });
}

export async function createDraftInvoiceFromRecord(tx: Tx, userId: string, recordId: string, tax: { rate: number; included: boolean }) {
  const record = await tx.medicalRecord.findUniqueOrThrow({
    where: { id: recordId },
    select: {
      visit: { select: { id: true, patient: { select: { ownerId: true } } } },
      prescriptionItems: { select: { qty: true, item: { select: { id: true, name: true, sellPrice: true, buyPrice: true } } } },
    },
  });
  const { visit } = record;
  if (await tx.invoice.findUnique({ where: { visitId: visit.id }, select: { id: true } })) return;

  const invoice = await tx.invoice.create({
    data: {
      invoiceNo: await createInvoiceNo(tx),
      visitId: visit.id,
      ownerId: visit.patient.ownerId,
      createdById: userId,
      items: {
        create: record.prescriptionItems.map(({ qty, item }) => ({
          itemId: item.id,
          nameSnapshot: item.name,
          qty,
          unitPriceSnapshot: item.sellPrice,
          unitCostSnapshot: item.buyPrice,
          lineTotal: 0,
        })),
      },
    },
    select: { id: true },
  });
  await recomputeInvoice(tx, invoice.id, tax);
}

export const listInvoices = (filter: { q?: string; status?: "DRAFT" | "FINAL" | "VOID" } = {}) =>
  prisma.invoice.findMany({
    where: {
      ...(filter.status && { status: filter.status }),
      ...(filter.q && {
        OR: [
          { invoiceNo: { contains: filter.q, mode: "insensitive" } },
          { customerName: { contains: filter.q, mode: "insensitive" } },
          { visit: { patient: { name: { contains: filter.q, mode: "insensitive" } } } },
          { owner: { name: { contains: filter.q, mode: "insensitive" } } },
        ],
      }),
    },
    select: {
      id: true,
      invoiceNo: true,
      status: true,
      grandTotal: true,
      customerName: true,
      createdAt: true,
      owner: { select: { name: true } },
      visit: { select: { patient: { select: { name: true, allergyNote: true, aggressive: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

export const getInvoice = (id: string) =>
  prisma.invoice.findUnique({
    where: { id },
    include: {
      items: {
        select: { id: true, nameSnapshot: true, qty: true, unitPriceSnapshot: true, discountType: true, discountValue: true, lineTotal: true },
        orderBy: { id: "asc" },
      },
      owner: { select: { name: true, whatsapp: true } },
      createdBy: { select: { name: true } },
      visit: {
        select: {
          createdAt: true,
          doctor: { select: { name: true } },
          patient: { select: { id: true, name: true, rmNo: true, allergyNote: true, aggressive: true } },
        },
      },
    },
  });
