import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { cashDifference, type CashClosingInput } from "@/lib/cash-schema";
import { todayJakarta } from "@/lib/date";

type Db = Prisma.TransactionClient | typeof prisma;

const DAY_MS = 86_400_000;

function dayWindow(day: Date) {
  const start = new Date(`${day.toISOString().slice(0, 10)}T00:00:00+07:00`);
  return { gte: start, lt: new Date(start.getTime() + DAY_MS) };
}

export async function getCashSales(db: Db, day: Date) {
  const where = { method: "TUNAI" as const, paidAt: dayWindow(day) };
  const [counted, voided, topUps] = await Promise.all([
    db.payment.aggregate({ where: { ...where, voided: false }, _sum: { amount: true } }),
    db.payment.aggregate({ where: { ...where, voided: true }, _sum: { amount: true } }),
    db.walletTransaction.aggregate({ where: { type: "TOPUP", method: "TUNAI", createdAt: dayWindow(day) }, _sum: { amount: true } }),
  ]);
  return { cashSales: (counted._sum.amount ?? 0) + (topUps._sum.amount ?? 0), voidedCash: voided._sum.amount ?? 0 };
}

export async function closeCash(userId: string, input: CashClosingInput) {
  const day = todayJakarta();
  try {
    return await prisma.$transaction(async (tx) => {
      if (await tx.cashClosing.findUnique({ where: { closingDate: day }, select: { id: true } })) return { error: "Kas hari ini sudah ditutup." } as const;

      const { cashSales } = await getCashSales(tx, day);
      const { difference } = cashDifference({ openingCash: input.openingCash, cashSales, countedCash: input.countedCash });
      if (difference !== 0 && !input.note) return { needsNote: true, difference } as const;

      const closing = await tx.cashClosing.create({
        data: { closingDate: day, openingCash: input.openingCash, cashSales, countedCash: input.countedCash, difference, note: input.note || null, closedById: userId },
        select: { id: true },
      });
      await logAudit(tx, {
        userId,
        action: "cash.close",
        entity: "cash_closing",
        entityId: closing.id,
        after: { openingCash: input.openingCash, cashSales, countedCash: input.countedCash, difference, note: input.note || null },
      });
      return { id: closing.id } as const;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "Kas hari ini sudah ditutup." } as const;
    throw error;
  }
}

export type ClosingView = {
  id: string;
  date: Date;
  openingCash: number;
  countedCash: number;
  difference: number;
  note: string | null;
  closedBy: string;
  createdAt: Date;
  cashSales?: number;
};

const SELECT = {
  id: true, closingDate: true, openingCash: true, cashSales: true, countedCash: true, difference: true, note: true, createdAt: true,
  closedBy: { select: { name: true } },
} satisfies Prisma.CashClosingSelect;

type Row = Prisma.CashClosingGetPayload<{ select: typeof SELECT }>;

const toView = (row: Row, withSystem: boolean): ClosingView => ({
  id: row.id,
  date: row.closingDate,
  openingCash: row.openingCash,
  countedCash: row.countedCash,
  difference: row.difference,
  note: row.note,
  closedBy: row.closedBy.name,
  createdAt: row.createdAt,
  ...(withSystem && { cashSales: row.cashSales }),
});

export async function getCashPage(withSystem: boolean) {
  const day = todayJakarta();
  const [today, history, last] = await Promise.all([
    prisma.cashClosing.findUnique({ where: { closingDate: day }, select: SELECT }),
    prisma.cashClosing.findMany({ select: SELECT, orderBy: { closingDate: "desc" }, take: 30 }),
    prisma.cashClosing.findFirst({ select: { countedCash: true }, orderBy: { closingDate: "desc" } }),
  ]);
  const late = withSystem && today ? (await getCashSales(prisma, day)).cashSales - today.cashSales : 0;
  return {
    today: today && toView(today, withSystem),
    history: history.map((row) => toView(row, withSystem)),
    suggestedOpening: last?.countedCash ?? 0,
    lateCash: late,
  };
}
