import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { jakartaLocalToDate } from "@/lib/admission-calc";
import { CONFLICT_MINUTES, dayWindow, type AppointmentInput } from "@/lib/appointment-calc";
import { todayJakarta } from "@/lib/date";

const SELECT = {
  id: true,
  scheduledAt: true,
  purpose: true,
  notes: true,
  status: true,
  visitId: true,
  patient: { select: { id: true, name: true, species: true, rmNo: true, allergyNote: true, aggressive: true, owner: { select: { name: true, whatsapp: true } } } },
  doctor: { select: { id: true, name: true } },
} satisfies Prisma.AppointmentSelect;

export type AppointmentRow = Prisma.AppointmentGetPayload<{ select: typeof SELECT }>;

export const listAppointmentsOn = (ymd: string, doctorId?: string) => {
  const { start, end } = dayWindow(ymd);
  return prisma.appointment.findMany({
    where: { scheduledAt: { gte: start, lt: end }, ...(doctorId && { doctorId }) },
    select: SELECT,
    orderBy: { scheduledAt: "asc" },
  });
};

export async function countAppointmentsByDay(fromYmd: string, toYmd: string, doctorId?: string) {
  const { start } = dayWindow(fromYmd);
  const { end } = dayWindow(toYmd);
  const rows = await prisma.$queryRaw<{ day: string; n: bigint }[]>`
    SELECT to_char((scheduled_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') AS day, count(*) AS n
    FROM appointment
    WHERE status <> 'BATAL' AND scheduled_at >= ${start} AND scheduled_at < ${end}
      ${doctorId ? Prisma.sql`AND doctor_id = ${doctorId}::uuid` : Prisma.empty}
    GROUP BY 1`;
  return Object.fromEntries(rows.map((r) => [r.day, Number(r.n)])) as Record<string, number>;
}

export function listAppointments({ q, status, doctorId }: { q?: string; status?: "TERJADWAL" | "SELESAI" | "BATAL"; doctorId?: string }) {
  const term = q?.trim();
  return prisma.appointment.findMany({
    where: {
      ...(status && { status }),
      ...(doctorId && { doctorId }),
      ...(term && { OR: [{ patient: { name: { contains: term, mode: "insensitive" } } }, { patient: { owner: { name: { contains: term, mode: "insensitive" } } } }, { purpose: { contains: term, mode: "insensitive" } }] }),
    },
    select: SELECT,
    orderBy: { scheduledAt: "desc" },
    take: 100,
  });
}

export const getAppointment = (id: string) => prisma.appointment.findUnique({ where: { id }, select: SELECT });

async function findConflicts(doctorId: string, at: Date, excludeId?: string) {
  const margin = CONFLICT_MINUTES * 60_000;
  return prisma.appointment.findMany({
    where: { doctorId, status: "TERJADWAL", scheduledAt: { gt: new Date(at.getTime() - margin), lt: new Date(at.getTime() + margin) }, ...(excludeId && { NOT: { id: excludeId } }) },
    select: { scheduledAt: true, patient: { select: { name: true } } },
  });
}

type Checked = { error: string } | { conflict: string[] } | { at: Date; doctorId: string };

async function validate(patientId: string, input: AppointmentInput, excludeId: string | undefined, confirm: boolean): Promise<Checked> {
  const at = jakartaLocalToDate(input.scheduledAt);
  if (Number.isNaN(at.getTime())) return { error: "Waktu tidak valid." };
  if (at < dayWindow(todayJakarta().toISOString().slice(0, 10)).start) return { error: "Waktu janji temu sudah lewat." };

  const [patient, doctor] = await Promise.all([
    prisma.patient.findFirst({ where: { id: patientId, deletedAt: null, owner: { deletedAt: null } }, select: { id: true } }),
    prisma.user.findFirst({ where: { id: input.doctorId, role: "DOKTER", active: true }, select: { id: true } }),
  ]);
  if (!patient) return { error: "Pasien tidak ditemukan." };
  if (!doctor) return { error: "Dokter tidak valid." };

  if (!confirm) {
    const clash = await findConflicts(doctor.id, at, excludeId);
    if (clash.length > 0) return { conflict: clash.map((c) => c.patient.name) };
  }
  return { at, doctorId: doctor.id };
}

export async function createAppointment(userId: string, patientId: string, input: AppointmentInput, confirm: boolean) {
  const checked = await validate(patientId, input, undefined, confirm);
  if (!("at" in checked)) return checked;
  const row = await prisma.appointment.create({
    data: { patientId, doctorId: checked.doctorId, scheduledAt: checked.at, purpose: input.purpose, notes: input.notes || null, createdById: userId },
    select: { id: true },
  });
  return { id: row.id };
}

export async function updateAppointment(id: string, input: AppointmentInput, confirm: boolean) {
  const current = await prisma.appointment.findUnique({ where: { id }, select: { patientId: true, status: true } });
  if (!current) return { error: "Janji temu tidak ditemukan." };
  if (current.status !== "TERJADWAL") return { error: "Hanya janji temu terjadwal yang bisa diubah." };

  const checked = await validate(current.patientId, input, id, confirm);
  if (!("at" in checked)) return checked;
  const { count } = await prisma.appointment.updateMany({
    where: { id, status: "TERJADWAL" },
    data: { doctorId: checked.doctorId, scheduledAt: checked.at, purpose: input.purpose, notes: input.notes || null },
  });
  return count === 1 ? { id } : ({ error: "Janji temu sudah berubah status." });
}

export async function cancelAppointment(userId: string, id: string) {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.appointment.updateMany({ where: { id, status: "TERJADWAL" }, data: { status: "BATAL" } });
    if (count === 1) await logAudit(tx, { userId, action: "appointment.cancel", entity: "appointment", entityId: id });
    return count === 1;
  });
}

export async function startVisitFromAppointment(userId: string, id: string) {
  return prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.findUnique({
      where: { id },
      select: { status: true, purpose: true, patientId: true, doctorId: true, patient: { select: { deletedAt: true, owner: { select: { deletedAt: true } } } }, doctor: { select: { active: true } } },
    });
    if (!appointment) return { error: "Janji temu tidak ditemukan." };
    if (appointment.status !== "TERJADWAL") return { error: "Janji temu ini sudah selesai atau dibatalkan." };
    if (appointment.patient.deletedAt || appointment.patient.owner.deletedAt) return { error: "Pasien tidak ditemukan." };
    if (!appointment.doctor.active) return { error: "Dokter sudah nonaktif. Ubah janji temu ke dokter lain." };

    const visit = await tx.visit.create({
      data: { patientId: appointment.patientId, doctorId: appointment.doctorId, createdById: userId, visitDate: todayJakarta(), complaint: appointment.purpose },
      select: { id: true },
    });
    const { count } = await tx.appointment.updateMany({ where: { id, status: "TERJADWAL" }, data: { status: "SELESAI", visitId: visit.id } });
    if (count !== 1) throw new Error("Janji temu berubah saat diproses.");
    return { visitId: visit.id };
  });
}
