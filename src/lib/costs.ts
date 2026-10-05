import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import type { CostInput } from "@/lib/cost-schema";

const SELECT = { id: true, name: true, amount: true, category: true, costDate: true, notes: true, createdBy: { select: { name: true } } } satisfies Prisma.OperationalCostSelect;

const day = (ymd: string) => new Date(`${ymd}T00:00:00Z`);

export async function pageCosts({ q, from, to }: { q?: string; from?: string; to?: string }, skip: number, take: number) {
  const term = q?.trim();
  const where: Prisma.OperationalCostWhereInput = {
    deletedAt: null,
    ...((from || to) && { costDate: { ...(from && { gte: day(from) }), ...(to && { lte: day(to) }) } }),
    ...(term && { OR: [{ name: { contains: term, mode: "insensitive" } }, { category: { contains: term, mode: "insensitive" } }, { notes: { contains: term, mode: "insensitive" } }] }),
  };
  const [rows, total, sum] = await Promise.all([
    prisma.operationalCost.findMany({ where, select: SELECT, orderBy: [{ costDate: "desc" }, { createdAt: "desc" }], skip, take }),
    prisma.operationalCost.count({ where }),
    prisma.operationalCost.aggregate({ where, _sum: { amount: true } }),
  ]);
  return { rows, total, sum: sum._sum.amount ?? 0 };
}

export const getCost = (id: string) => prisma.operationalCost.findFirst({ where: { id, deletedAt: null }, select: SELECT });

export async function createCost(userId: string, input: CostInput) {
  return prisma.$transaction(async (tx) => {
    const row = await tx.operationalCost.create({ data: { name: input.name, amount: input.amount, category: input.category, costDate: day(input.costDate), notes: input.notes || null, createdById: userId }, select: { id: true } });
    await logAudit(tx, { userId, action: "cost.create", entity: "operational_cost", entityId: row.id, after: { name: input.name, amount: input.amount, category: input.category, costDate: input.costDate } });
    return { id: row.id };
  });
}

export async function updateCost(userId: string, id: string, input: CostInput) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.operationalCost.findFirst({ where: { id, deletedAt: null }, select: { name: true, amount: true, category: true, costDate: true, notes: true } });
    if (!before) return { error: "Data biaya tidak ditemukan." };
    await tx.operationalCost.update({ where: { id }, data: { name: input.name, amount: input.amount, category: input.category, costDate: day(input.costDate), notes: input.notes || null } });
    await logAudit(tx, {
      userId,
      action: "cost.update",
      entity: "operational_cost",
      entityId: id,
      before: { ...before, costDate: before.costDate.toISOString().slice(0, 10) },
      after: { name: input.name, amount: input.amount, category: input.category, costDate: input.costDate, notes: input.notes || null },
    });
    return { id };
  });
}

export async function deleteCost(userId: string, id: string) {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.operationalCost.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
    if (count === 1) await logAudit(tx, { userId, action: "cost.delete", entity: "operational_cost", entityId: id });
    return count === 1;
  });
}

export async function getCostsByDay(fromYmd: string, toYmd: string) {
  const rows = await prisma.operationalCost.groupBy({ by: ["costDate"], where: { deletedAt: null, costDate: { gte: day(fromYmd), lte: day(toYmd) } }, _sum: { amount: true } });
  return Object.fromEntries(rows.map((r) => [r.costDate.toISOString().slice(0, 10), r._sum.amount ?? 0])) as Record<string, number>;
}

export async function getCostsByCategory(fromYmd: string, toYmd: string) {
  const rows = await prisma.operationalCost.groupBy({ by: ["category"], where: { deletedAt: null, costDate: { gte: day(fromYmd), lte: day(toYmd) } }, _sum: { amount: true }, _count: true });
  return rows.map((r) => ({ category: r.category, total: r._sum.amount ?? 0, count: r._count })).sort((a, b) => b.total - a.total);
}

export async function earliestCostDate() {
  const row = await prisma.operationalCost.findFirst({ where: { deletedAt: null }, select: { costDate: true }, orderBy: { costDate: "asc" } });
  return row?.costDate.toISOString().slice(0, 10) ?? null;
}
