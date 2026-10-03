import { prisma } from "@/lib/db";
import { todayJakarta } from "@/lib/date";

const JAKARTA_OFFSET_MS = 7 * 3_600_000;

export async function getDashboardSummary(withRevenue: boolean) {
  const day = todayJakarta();
  const start = new Date(day.getTime() - JAKARTA_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 3_600_000);

  const [visits, admissions, revenue] = await Promise.all([
    prisma.visit.count({ where: { visitDate: day, status: { not: "BATAL" } } }),
    prisma.admission.groupBy({ by: ["type"], where: { status: "AKTIF" }, _count: true }),
    withRevenue
      ? prisma.invoice.aggregate({ where: { status: "FINAL", finalizedAt: { gte: start, lt: end } }, _sum: { grandTotal: true, taxTotal: true }, _count: true })
      : null,
  ]);

  const count = (type: string) => admissions.find((a) => a.type === type)?._count ?? 0;
  return {
    visits,
    rawatInap: count("RAWAT_INAP"),
    hotel: count("HOTEL"),
    revenue: revenue && { total: (revenue._sum.grandTotal ?? 0) - (revenue._sum.taxTotal ?? 0), invoices: revenue._count },
  };
}
