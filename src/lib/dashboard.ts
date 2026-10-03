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

const patientSelect = { id: true, name: true, species: true, rmNo: true, allergyNote: true, aggressive: true } as const;

export const getDoctorQueue = (doctorId: string) =>
  prisma.visit.findMany({
    where: { visitDate: todayJakarta(), status: "DILAYANI", doctorId },
    select: { id: true, complaint: true, createdAt: true, patient: { select: patientSelect } },
    orderBy: { createdAt: "asc" },
  });

export async function getCashierQueue() {
  const [waiting, drafts, closed] = await Promise.all([
    prisma.visit.findMany({
      where: { status: "MENUNGGU_BAYAR" },
      select: {
        id: true,
        createdAt: true,
        patient: { select: { name: true, rmNo: true, owner: { select: { name: true } } } },
        invoices: { where: { status: { not: "VOID" } }, select: { id: true, grandTotal: true }, take: 1 },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.invoice.findMany({
      where: { visitId: null, admissionId: null, status: "DRAFT" },
      select: { id: true, invoiceNo: true, customerName: true, grandTotal: true },
      orderBy: { createdAt: "asc" },
      take: 10,
    }),
    prisma.cashClosing.findUnique({ where: { closingDate: todayJakarta() }, select: { id: true } }),
  ]);
  return { waiting, drafts, cashClosed: Boolean(closed) };
}
