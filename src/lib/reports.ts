import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { DayRow } from "@/lib/report";

type Range = { start: Date; endExclusive: Date };

const DAY_JAKARTA = Prisma.sql`to_char((i.finalized_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD')`;

export async function getSalesByDay({ start, endExclusive }: Range): Promise<DayRow[]> {
  const where = Prisma.sql`i.status = 'FINAL' AND i.finalized_at >= ${start} AND i.finalized_at < ${endExclusive}`;
  const [sales, costs] = await Promise.all([
    prisma.$queryRaw<{ day: string; invoices: bigint; sales: bigint }[]>`
      SELECT ${DAY_JAKARTA} AS day, count(*) AS invoices, sum(i.grand_total - i.tax_total)::bigint AS sales
      FROM invoice i WHERE ${where} GROUP BY 1`,
    prisma.$queryRaw<{ day: string; cost: bigint }[]>`
      SELECT ${DAY_JAKARTA} AS day, sum(round(ii.qty * ii.unit_cost_snapshot))::bigint AS cost
      FROM invoice i JOIN invoice_item ii ON ii.invoice_id = i.id WHERE ${where} GROUP BY 1`,
  ]);
  const costByDay = new Map(costs.map((c) => [c.day, Number(c.cost)]));
  return sales
    .map((s) => ({ day: s.day, invoices: Number(s.invoices), sales: Number(s.sales), cost: costByDay.get(s.day) ?? 0 }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

export type TopItem = { itemId: string; name: string; qty: number; revenue: number; cost: number };

export async function getTopItems({ start, endExclusive }: Range, type: "PRODUCT" | "SERVICE", limit = 10): Promise<TopItem[]> {
  const rows = await prisma.$queryRaw<{ item_id: string; name: string; qty: string; revenue: bigint; cost: bigint }[]>`
    SELECT ii.item_id, max(ii.name_snapshot) AS name, sum(ii.qty)::text AS qty,
           sum(ii.line_total)::bigint AS revenue, sum(round(ii.qty * ii.unit_cost_snapshot))::bigint AS cost
    FROM invoice_item ii
    JOIN invoice i ON i.id = ii.invoice_id
    JOIN item it ON it.id = ii.item_id
    WHERE i.status = 'FINAL' AND i.finalized_at >= ${start} AND i.finalized_at < ${endExclusive} AND it.type = ${type}::"ItemType"
    GROUP BY ii.item_id ORDER BY revenue DESC LIMIT ${limit}`;
  return rows.map((r) => ({ itemId: r.item_id, name: r.name, qty: Number(r.qty), revenue: Number(r.revenue), cost: Number(r.cost) }));
}

export async function getVisitStats({ start, endExclusive }: Range) {
  const day = (d: Date) => new Date(d.getTime() + 7 * 3_600_000);
  const from = day(start);
  const to = day(endExclusive);
  const where = { visitDate: { gte: from, lt: to }, status: { not: "BATAL" as const } };
  const [perDay, perDoctor, admissions] = await Promise.all([
    prisma.visit.groupBy({ by: ["visitDate"], where, _count: true, orderBy: { visitDate: "asc" } }),
    prisma.visit.groupBy({ by: ["doctorId"], where, _count: true }),
    prisma.admission.groupBy({ by: ["type"], where: { checkIn: { gte: start, lt: endExclusive } }, _count: true }),
  ]);
  const doctors = await prisma.user.findMany({ where: { id: { in: perDoctor.map((d) => d.doctorId) } }, select: { id: true, name: true } });
  const nameOf = new Map(doctors.map((d) => [d.id, d.name]));
  return {
    perDay: perDay.map((d) => ({ day: d.visitDate.toISOString().slice(0, 10), count: d._count })),
    perDoctor: perDoctor.map((d) => ({ name: nameOf.get(d.doctorId) ?? "-", count: d._count })).sort((a, b) => b.count - a.count),
    admissions: Object.fromEntries(admissions.map((a) => [a.type, a._count])) as Partial<Record<"RAWAT_INAP" | "HOTEL", number>>,
  };
}

export async function getPaymentSplit({ start, endExclusive }: Range) {
  const rows = await prisma.payment.groupBy({ by: ["method"], where: { voided: false, paidAt: { gte: start, lt: endExclusive } }, _sum: { amount: true } });
  const by = Object.fromEntries(rows.map((r) => [r.method, r._sum.amount ?? 0])) as Partial<Record<"TUNAI" | "QRIS" | "TRANSFER" | "KARTU" | "WALLET", number>>;
  const cash = by.TUNAI ?? 0;
  const digital = (by.QRIS ?? 0) + (by.TRANSFER ?? 0) + (by.KARTU ?? 0);
  const wallet = by.WALLET ?? 0;
  return { cash, digital, wallet, total: cash + digital + wallet };
}
