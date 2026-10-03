import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { todayJakarta } from "@/lib/date";
import type { Prisma } from "@/generated/prisma/client";
import type { OpnameRowInput } from "@/lib/opname-schema";
import { opnameDiff } from "@/lib/stock";

type Tx = Prisma.TransactionClient;
class Rejected extends Error {}

export async function createOpname(userId: string, note: string) {
  const existing = await prisma.stockOpname.findFirst({ where: { status: "DRAFT" }, select: { id: true } });
  if (existing) return { id: existing.id, resumed: true };

  const batches = await prisma.stockBatch.findMany({ where: { qtyOnHand: { gt: 0 } }, select: { id: true, qtyOnHand: true } });
  if (batches.length === 0) return { error: "Belum ada stok yang bisa di-opname." };

  const opname = await prisma.stockOpname.create({
    data: {
      opnameDate: todayJakarta(),
      userId,
      note: note || null,
      items: { create: batches.map((b) => ({ batchId: b.id, systemQty: b.qtyOnHand, countedQty: b.qtyOnHand, diff: 0 })) },
    },
    select: { id: true },
  });
  return { id: opname.id, resumed: false };
}

export const listOpnames = () =>
  prisma.stockOpname.findMany({
    select: { id: true, opnameDate: true, status: true, note: true, user: { select: { name: true } }, _count: { select: { items: true } }, items: { where: { diff: { not: 0 } }, select: { id: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

export const getOpname = (id: string) =>
  prisma.stockOpname.findUnique({
    where: { id },
    select: {
      id: true, opnameDate: true, status: true, note: true, user: { select: { name: true } },
      items: {
        select: {
          id: true, systemQty: true, countedQty: true, diff: true, reason: true,
          batch: { select: { batchNo: true, expiryDate: true, item: { select: { name: true, baseUnit: true } } } },
        },
        orderBy: [{ batch: { item: { name: "asc" } } }, { batch: { expiryDate: { sort: "asc", nulls: "last" } } }],
      },
    },
  });

async function applyCounts(tx: Tx, opnameId: string, rows: OpnameRowInput[]) {
  const opname = await tx.stockOpname.findUnique({ where: { id: opnameId }, select: { status: true } });
  if (!opname) throw new Rejected("Sesi opname tidak ditemukan.");
  if (opname.status !== "DRAFT") throw new Rejected("Opname sudah final dan tidak bisa diubah.");

  for (const row of rows) {
    const item = await tx.opnameItem.findFirst({ where: { id: row.id, opnameId }, select: { countedQty: true, batchId: true } });
    if (!item) continue;

    const changed = Number(item.countedQty) !== row.counted;
    if (changed) {
      const batch = await tx.stockBatch.findUniqueOrThrow({ where: { id: item.batchId }, select: { qtyOnHand: true } });
      await tx.opnameItem.update({
        where: { id: row.id },
        data: { systemQty: batch.qtyOnHand, countedQty: row.counted, diff: opnameDiff(Number(batch.qtyOnHand), row.counted), reason: row.reason || null },
      });
    } else {
      await tx.opnameItem.update({ where: { id: row.id }, data: { reason: row.reason || null } });
    }
  }
}

export async function saveOpname(opnameId: string, rows: OpnameRowInput[]) {
  try {
    await prisma.$transaction((tx) => applyCounts(tx, opnameId, rows));
    return {};
  } catch (error) {
    if (error instanceof Rejected) return { error: error.message };
    throw error;
  }
}

export async function finalizeOpname(userId: string, opnameId: string, rows: OpnameRowInput[]) {
  try {
    return await prisma.$transaction(
      async (tx) => {
        await applyCounts(tx, opnameId, rows);

        const { count } = await tx.stockOpname.updateMany({ where: { id: opnameId, status: "DRAFT" }, data: { status: "FINAL" } });
        if (count === 0) throw new Rejected("Opname sudah final dan tidak bisa diubah.");

        const items = await tx.opnameItem.findMany({
          where: { opnameId, diff: { not: 0 } },
          select: { id: true, batchId: true, diff: true, reason: true, batch: { select: { batchNo: true, item: { select: { name: true } } } } },
        });
        const missing = items.filter((i) => !i.reason);
        if (missing.length > 0) {
          throw new Rejected(`Alasan wajib diisi untuk setiap selisih: ${missing.map((m) => `${m.batch.item.name} (${m.batch.batchNo})`).join(", ")}.`);
        }

        const summary: { item: string; batch: string; diff: number; reason: string }[] = [];
        for (const item of items) {
          const diff = Number(item.diff);
          const { count: updated } = await tx.stockBatch.updateMany({
            where: { id: item.batchId, ...(diff < 0 && { qtyOnHand: { gte: -diff } }) },
            data: { qtyOnHand: { increment: diff } },
          });
          if (updated === 0) throw new Rejected(`Stok ${item.batch.item.name} (${item.batch.batchNo}) berubah dan tidak cukup untuk penyesuaian ${diff}. Hitung ulang batch ini.`);
          await tx.stockMovement.create({
            data: { batchId: item.batchId, type: "ADJUST", qty: diff, refType: "opname", refId: opnameId, note: item.reason, userId },
          });
          summary.push({ item: item.batch.item.name, batch: item.batch.batchNo, diff, reason: item.reason! });
        }
        await logAudit(tx, { userId, action: "stock.opname", entity: "stock_opname", entityId: opnameId, after: { adjustments: summary } });
        return { adjusted: summary.length };
      },
      { timeout: 30_000 },
    );
  } catch (error) {
    if (error instanceof Rejected) return { error: error.message };
    throw error;
  }
}
