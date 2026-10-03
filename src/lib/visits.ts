import { z } from "zod";
import { prisma } from "@/lib/db";
import { todayJakarta } from "@/lib/date";

export const visitSchema = z.object({
  doctorId: z.guid({ error: "Pilih dokter" }),
  complaint: z.string().trim().min(1, "Keluhan wajib diisi").max(500, "Maksimal 500 karakter"),
});

export type VisitInput = z.infer<typeof visitSchema>;

export const listDoctors = () =>
  prisma.user.findMany({
    where: { role: "DOKTER", active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

export const listTodayVisits = (doctorId?: string) =>
  prisma.visit.findMany({
    where: { visitDate: todayJakarta(), ...(doctorId && { doctorId }) },
    select: {
      id: true,
      status: true,
      complaint: true,
      createdAt: true,
      patient: { select: { id: true, name: true, species: true, rmNo: true, allergyNote: true, aggressive: true } },
      doctor: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

export async function createVisit(userId: string, patientId: string, input: VisitInput) {
  const [patient, doctor] = await Promise.all([
    prisma.patient.findFirst({ where: { id: patientId, deletedAt: null, owner: { deletedAt: null } }, select: { id: true } }),
    prisma.user.findFirst({ where: { id: input.doctorId, role: "DOKTER", active: true }, select: { id: true } }),
  ]);
  if (!patient) return { error: "Pasien tidak ditemukan." };
  if (!doctor) return { error: "Dokter tidak valid." };

  await prisma.visit.create({
    data: { patientId, doctorId: doctor.id, createdById: userId, visitDate: todayJakarta(), complaint: input.complaint },
  });
  return {};
}

export async function cancelVisit(id: string) {
  const { count } = await prisma.visit.updateMany({ where: { id, status: "DILAYANI" }, data: { status: "BATAL" } });
  return count === 1;
}
