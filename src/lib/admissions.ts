import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { todayJakarta } from "@/lib/date";
import { jakartaLocalToDate } from "@/lib/admission-calc";
import { RATE_CATEGORY, type CheckInInput } from "@/lib/admission-schema";
import { nextInvoiceNoFor } from "@/lib/invoices";

export async function createAdmission(userId: string, input: CheckInInput) {
  const checkIn = jakartaLocalToDate(input.checkIn);
  if (Number.isNaN(checkIn.getTime())) return { error: "Waktu masuk tidak valid." };
  if (checkIn.getTime() > Date.now() + 3_600_000) return { error: "Waktu masuk tidak boleh di masa depan." };

  const [patient, room, rate, visit, busy] = await Promise.all([
    prisma.patient.findFirst({ where: { id: input.patientId, deletedAt: null, owner: { deletedAt: null } }, select: { ownerId: true } }),
    prisma.room.findFirst({ where: { id: input.roomId, active: true, type: input.type }, select: { id: true } }),
    prisma.item.findFirst({
      where: { id: input.rateItemId, type: "SERVICE", billingUnit: "PER_DAY", category: RATE_CATEGORY[input.type], active: true, deletedAt: null },
      select: { id: true },
    }),
    input.visitId
      ? prisma.visit.findFirst({ where: { id: input.visitId, patientId: input.patientId, status: { not: "BATAL" } }, select: { id: true } })
      : null,
    prisma.admission.findFirst({ where: { patientId: input.patientId, status: "AKTIF" }, select: { room: { select: { name: true } } } }),
  ]);
  if (!patient) return { error: "Pasien tidak ditemukan." };
  if (busy) return { error: `Pasien ini masih tercatat menginap di ${busy.room.name}.` };
  if (!room) return { error: "Kandang tidak ditemukan, nonaktif, atau tidak sesuai jenis." };
  if (!rate) return { error: "Tarif harian tidak valid untuk jenis ini." };
  if (input.visitId && !visit) return { error: "Kunjungan tidak valid." };

  for (let attempt = 1; ; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const admission = await tx.admission.create({
          data: {
            patientId: input.patientId, roomId: room.id, rateItemId: rate.id, visitId: visit?.id ?? null,
            type: input.type, checkIn, notes: input.notes || null,
          },
          select: { id: true },
        });
        const invoice = await tx.invoice.create({
          data: { invoiceNo: await nextInvoiceNoFor(tx), admissionId: admission.id, ownerId: patient.ownerId, createdById: userId },
          select: { id: true },
        });
        await logAudit(tx, { userId, action: "admission.check_in", entity: "admission", entityId: admission.id, after: { roomId: room.id, type: input.type, invoiceId: invoice.id } });
        return { id: admission.id };
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
      const taken = await prisma.admission.findFirst({ where: { roomId: room.id, status: "AKTIF" }, select: { id: true } });
      if (taken) return { error: "Kandang ini sudah terisi." };
      if (attempt >= 3) throw error;
    }
  }
}

export const listActiveAdmissions = () =>
  prisma.admission.findMany({
    where: { status: "AKTIF" },
    select: {
      id: true,
      type: true,
      checkIn: true,
      patient: { select: { id: true, name: true, species: true, allergyNote: true, aggressive: true } },
      room: { select: { name: true } },
      rateItem: { select: { name: true } },
      invoices: { where: { status: { not: "VOID" } }, select: { id: true, invoiceNo: true }, take: 1 },
    },
    orderBy: { checkIn: "asc" },
  });

export async function getCheckInOptions() {
  const [rooms, rates, occupied] = await Promise.all([
    prisma.room.findMany({ where: { active: true }, select: { id: true, name: true, type: true }, orderBy: [{ type: "asc" }, { name: "asc" }] }),
    prisma.item.findMany({
      where: { type: "SERVICE", billingUnit: "PER_DAY", active: true, deletedAt: null, category: { in: ["rawat inap", "hotel"] } },
      select: { id: true, name: true, category: true },
      orderBy: { name: "asc" },
    }),
    prisma.admission.findMany({ where: { status: "AKTIF" }, select: { roomId: true } }),
  ]);
  const busy = new Set(occupied.map((o) => o.roomId));
  return {
    rooms: rooms.filter((r) => !busy.has(r.id)),
    rates: rates.map((r) => ({ id: r.id, name: r.name, type: (r.category === "hotel" ? "HOTEL" : "RAWAT_INAP") as "HOTEL" | "RAWAT_INAP" })),
  };
}

export const listTodayVisitsOf = (patientId: string) =>
  prisma.visit.findMany({
    where: { patientId, visitDate: todayJakarta(), status: { not: "BATAL" } },
    select: { id: true, complaint: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

export const listPatientAdmissions = (patientId: string) =>
  prisma.admission.findMany({
    where: { patientId },
    select: { id: true, type: true, status: true, checkIn: true, checkOut: true, billedDays: true, room: { select: { name: true } } },
    orderBy: { checkIn: "desc" },
    take: 20,
  });
