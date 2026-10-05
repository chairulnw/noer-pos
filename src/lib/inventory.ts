import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { todayJakarta } from "@/lib/date";
import { getSettings } from "@/lib/settings";
import { batchExpiryAlert, costPerBaseUnit, fefoAllocate, isExpired, isLowStock, stockStatus, toBaseQty, weightedCost } from "@/lib/stock";
import type { StockInInput } from "@/lib/stock-schema";

type Tx = Prisma.TransactionClient;

export class StockConflictError extends Error {}

export async function receiveStock(userId: string, input: StockInInput) {
  const item = await prisma.item.findFirst({
    where: { id: input.itemId, type: "PRODUCT", active: true, deletedAt: null },
    select: { trackExpiry: true, purchaseUnit: true, conversionFactor: true },
  });
  if (!item) return { error: "Produk tidak ditemukan atau nonaktif." };

  const today = todayJakarta();
  const expiry = item.trackExpiry && input.expiry ? new Date(`${input.expiry}T00:00:00Z`) : null;
  if (item.trackExpiry && !expiry) return { error: "Tanggal expired wajib diisi untuk produk ini." };
  if (expiry && isExpired(expiry, today)) return { error: "Batch ini sudah kedaluwarsa dan tidak bisa dimasukkan." };

  const factor = item.purchaseUnit ? Number(item.conversionFactor) : 1;
  const qty = toBaseQty(input.qty, factor);
  const cost = costPerBaseUnit(input.price, factor);

  const batchId = await prisma.$transaction(async (tx) => {
    const existing = await tx.stockBatch.findFirst({
      where: { itemId: input.itemId, batchNo: input.batchNo, expiryDate: expiry },
      select: { id: true, qtyOnHand: true, costPerBaseUnit: true },
    });

    const batch = existing
      ? await tx.stockBatch.update({
          where: { id: existing.id },
          data: { qtyOnHand: { increment: qty }, costPerBaseUnit: weightedCost(Number(existing.qtyOnHand), existing.costPerBaseUnit, qty, cost) },
          select: { id: true },
        })
      : await tx.stockBatch.create({
          data: { itemId: input.itemId, batchNo: input.batchNo, expiryDate: expiry, qtyOnHand: qty, costPerBaseUnit: cost },
          select: { id: true },
        });

    await tx.stockMovement.create({
      data: { batchId: batch.id, type: "IN", qty, refType: "stock_in", note: input.note || null, userId },
    });
    await logAudit(tx, {
      userId,
      action: "stock.in",
      entity: "stock_batch",
      entityId: batch.id,
      after: { itemId: input.itemId, batchNo: input.batchNo, expiry: input.expiry || null, qtyBase: qty, costPerBaseUnit: cost },
    });
    return batch.id;
  });
  return { batchId };
}

export async function listStockSummary(q?: string) {
  const [items, settings] = await Promise.all([
    prisma.item.findMany({
      where: {
        type: "PRODUCT",
        deletedAt: null,
        ...(q && { OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }, { barcode: { contains: q } }] }),
      },
      select: {
        id: true, name: true, category: true, baseUnit: true, active: true, lowStockThreshold: true,
        stockBatches: { select: { expiryDate: true, qtyOnHand: true } },
      },
      orderBy: { name: "asc" },
    }),
    getSettings(),
  ]);
  const today = todayJakarta();

  return items.map(({ stockBatches, lowStockThreshold, ...item }) => ({
    ...item,
    ...stockStatus(
      stockBatches.map((b) => ({ expiry: b.expiryDate, qty: Number(b.qtyOnHand) })),
      lowStockThreshold === null ? null : Number(lowStockThreshold),
      today,
      settings.expiryWarningDays,
    ),
  }));
}

export async function listStockInProducts() {
  return prisma.item.findMany({
    where: { type: "PRODUCT", active: true, deletedAt: null },
    select: { id: true, name: true, baseUnit: true, purchaseUnit: true, conversionFactor: true, trackExpiry: true },
    orderBy: { name: "asc" },
  });
}

export async function getStockCard(itemId: string) {
  const item = await prisma.item.findFirst({
    where: { id: itemId, type: "PRODUCT", deletedAt: null },
    select: { id: true, name: true, baseUnit: true, trackExpiry: true },
  });
  if (!item) return null;

  const [batches, movements] = await Promise.all([
    prisma.stockBatch.findMany({
      where: { itemId },
      select: { id: true, batchNo: true, expiryDate: true, qtyOnHand: true, costPerBaseUnit: true },
      orderBy: [{ expiryDate: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
    }),
    prisma.stockMovement.findMany({
      where: { batch: { itemId } },
      select: {
        id: true, type: true, qty: true, note: true, createdAt: true, refType: true,
        batch: { select: { batchNo: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);
  return { item, batches, movements };
}

export async function deductForInvoiceItem(tx: Tx, params: { userId: string; invoiceItemId: string; itemId: string; qty: number; invoiceNo: string }) {
  const rows = await tx.stockBatch.findMany({
    where: { itemId: params.itemId, qtyOnHand: { gt: 0 } },
    select: { id: true, expiryDate: true, qtyOnHand: true, costPerBaseUnit: true, createdAt: true },
  });
  const result = fefoAllocate(rows.map((r) => ({ id: r.id, expiry: r.expiryDate, qty: Number(r.qtyOnHand), createdAt: r.createdAt })), params.qty, todayJakarta());
  if (!result.ok) return { error: "INSUFFICIENT" as const, available: result.available };

  const costOf = new Map(rows.map((r) => [r.id, r.costPerBaseUnit]));
  let totalCost = 0;
  for (const { batchId, qty } of result.allocations) {
    const { count } = await tx.stockBatch.updateMany({ where: { id: batchId, qtyOnHand: { gte: qty } }, data: { qtyOnHand: { decrement: qty } } });
    if (count === 0) throw new StockConflictError();
    await tx.stockMovement.create({
      data: { batchId, type: "OUT", qty: -qty, refType: "invoice", refId: params.invoiceItemId, invoiceItemId: params.invoiceItemId, note: params.invoiceNo, userId: params.userId },
    });
    totalCost += qty * costOf.get(batchId)!;
  }
  return { unitCost: Math.round(totalCost / params.qty) };
}

export type StockSummaryRow = Awaited<ReturnType<typeof listStockSummary>>[number];

export async function getStockAlerts() {
  const [items, settings] = await Promise.all([
    prisma.item.findMany({
      where: { type: "PRODUCT", active: true, deletedAt: null },
      select: { id: true, name: true, baseUnit: true, lowStockThreshold: true, stockBatches: { select: { batchNo: true, expiryDate: true, qtyOnHand: true } } },
      orderBy: { name: "asc" },
    }),
    getSettings(),
  ]);
  const today = todayJakarta();

  const low: { id: string; name: string; unit: string; usable: number; threshold: number }[] = [];
  const expiring: { id: string; name: string; unit: string; batchNo: string; expiry: Date; qty: number; level: "EXPIRED" | "HAMPIR_EXPIRED" }[] = [];

  for (const item of items) {
    const batches = item.stockBatches.map((b) => ({ batchNo: b.batchNo, expiry: b.expiryDate, qty: Number(b.qtyOnHand) }));
    const { usable } = stockStatus(batches, null, today, settings.expiryWarningDays);
    const threshold = item.lowStockThreshold === null ? null : Number(item.lowStockThreshold);
    if (threshold !== null && isLowStock(usable, threshold)) low.push({ id: item.id, name: item.name, unit: item.baseUnit, usable, threshold });

    for (const b of batches) {
      const level = batchExpiryAlert(b.expiry, b.qty, today, settings.expiryWarningDays);
      if (level) expiring.push({ id: item.id, name: item.name, unit: item.baseUnit, batchNo: b.batchNo, expiry: b.expiry!, qty: b.qty, level });
    }
  }

  low.sort((a, b) => a.usable - b.usable);
  expiring.sort((a, b) => a.expiry.getTime() - b.expiry.getTime());
  return { low, expiring, warnDays: settings.expiryWarningDays };
}

export async function getUsableStock() {
  const today = todayJakarta();
  const rows = await prisma.stockBatch.groupBy({
    by: ["itemId"],
    where: { qtyOnHand: { gt: 0 }, OR: [{ expiryDate: null }, { expiryDate: { gte: today } }] },
    _sum: { qtyOnHand: true },
  });
  return Object.fromEntries(rows.map((r) => [r.itemId, Number(r._sum.qtyOnHand ?? 0)])) as Record<string, number>;
}

export async function pageStockMovements(q: string | undefined, skip: number, take: number) {
  const term = q?.trim();
  const where: Prisma.StockMovementWhereInput = term
    ? { OR: [{ batch: { item: { name: { contains: term, mode: "insensitive" } } } }, { batch: { batchNo: { contains: term, mode: "insensitive" } } }, { note: { contains: term, mode: "insensitive" } }] }
    : {};
  const [rows, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      select: {
        id: true, type: true, qty: true, note: true, createdAt: true,
        batch: { select: { batchNo: true, item: { select: { id: true, name: true, baseUnit: true } } } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.stockMovement.count({ where }),
  ]);
  return { rows, total };
}
