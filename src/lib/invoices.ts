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

export async function nextInvoiceNoFor(tx: Tx) {
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
  if (await tx.invoice.findFirst({ where: { visitId: visit.id, status: { not: "VOID" } }, select: { id: true } })) return false;

  const invoice = await tx.invoice.create({
    data: {
      invoiceNo: await nextInvoiceNoFor(tx),
      visitId: visit.id,
      ownerId: visit.patient.ownerId,
      createdById: userId,
      items: {
        create: record.prescriptionItems.map(({ qty, item }, position) => ({
          position,
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
  return invoice.id;
}

export async function listInvoices(filter: { q?: string; status?: "DRAFT" | "VOID"; includePaid?: boolean } = {}, skip = 0, take = 50) {
  const where: Prisma.InvoiceWhereInput = {
    ...(filter.status ? { status: filter.status } : !filter.includePaid && { status: { not: "FINAL" as const } }),
    ...(filter.q && {
      OR: [
        { invoiceNo: { contains: filter.q, mode: "insensitive" } },
        { customerName: { contains: filter.q, mode: "insensitive" } },
        { visit: { patient: { name: { contains: filter.q, mode: "insensitive" } } } },
        { admission: { patient: { name: { contains: filter.q, mode: "insensitive" } } } },
        { owner: { name: { contains: filter.q, mode: "insensitive" } } },
      ],
    }),
  };
  const [rows, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      select: {
        id: true,
        invoiceNo: true,
        status: true,
        grandTotal: true,
        customerName: true,
        payments: { where: { voided: false }, select: { amount: true } },
        createdAt: true,
        owner: { select: { name: true } },
        visit: { select: { patient: { select: { name: true, allergyNote: true, aggressive: true } } } },
        admission: { select: { patient: { select: { name: true, allergyNote: true, aggressive: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.invoice.count({ where }),
  ]);
  return { rows, total };
}

export const getInvoice = (id: string) =>
  prisma.invoice.findUnique({
    where: { id },
    include: {
      items: {
        select: { id: true, itemId: true, nameSnapshot: true, qty: true, unitPriceSnapshot: true, discountType: true, discountValue: true, lineTotal: true, item: { select: { type: true } } },
        orderBy: [{ position: "asc" }, { id: "asc" }],
      },
      payments: { select: { id: true, kind: true, method: true, amount: true, cashReceived: true, reference: true, paidAt: true, voided: true, receivedBy: { select: { name: true } } }, orderBy: { paidAt: "asc" } },
      owner: { select: { id: true, name: true, whatsapp: true, walletBalance: true } },
      createdBy: { select: { name: true } },
      admission: { select: { id: true, type: true, room: { select: { name: true } }, patient: { select: { id: true, name: true, rmNo: true, species: true, allergyNote: true, aggressive: true } } } },
      visit: {
        select: {
          id: true,
          createdAt: true,
          doctor: { select: { name: true } },
          patient: { select: { id: true, name: true, rmNo: true, species: true, allergyNote: true, aggressive: true } },
        },
      },
    },
  });

export const listSellableItems = () =>
  prisma.item.findMany({
    where: { active: true, deletedAt: null },
    select: { id: true, name: true, type: true, category: true, sellPrice: true, baseUnit: true, sku: true, barcode: true },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

export const listRetailDrafts = () =>
  prisma.invoice.findMany({
    where: { visitId: null, admissionId: null, status: "DRAFT" },
    select: { id: true, invoiceNo: true, customerName: true, grandTotal: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

export async function listPaidInvoices(q: string | undefined, skip = 0, take = 50) {
  const where: Prisma.InvoiceWhereInput = {
    status: "FINAL",
    ...(q && {
      OR: [
        { invoiceNo: { contains: q, mode: "insensitive" } },
        { customerName: { contains: q, mode: "insensitive" } },
        { owner: { name: { contains: q, mode: "insensitive" } } },
        { visit: { patient: { name: { contains: q, mode: "insensitive" } } } },
        { admission: { patient: { name: { contains: q, mode: "insensitive" } } } },
      ],
    }),
  };
  const [rows, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      select: {
        id: true,
        invoiceNo: true,
        grandTotal: true,
        finalizedAt: true,
        createdAt: true,
        customerName: true,
        owner: { select: { name: true } },
        visit: { select: { patient: { select: { name: true } } } },
        admission: { select: { patient: { select: { name: true } } } },
        payments: { where: { voided: false }, select: { method: true }, orderBy: { paidAt: "asc" } },
      },
      orderBy: { finalizedAt: "desc" },
      skip,
      take,
    }),
    prisma.invoice.count({ where }),
  ]);
  return { rows, total };
}

export const activeInvoiceForVisit = (visitId: string) =>
  prisma.invoice.findFirst({ where: { visitId, status: { not: "VOID" } }, select: { id: true } });

export const listOpenDrafts = () =>
  prisma.invoice.findMany({
    where: { status: "DRAFT" },
    select: {
      id: true,
      invoiceNo: true,
      customerName: true,
      grandTotal: true,
      createdAt: true,
      visit: { select: { patient: { select: { name: true } } } },
      admission: { select: { patient: { select: { name: true } } } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  });
