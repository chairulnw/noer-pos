import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { detectAttachment } from "@/lib/record-schema";
import { storeFile } from "@/lib/uploads";
import type { ExaminationInput, ExaminationType } from "@/lib/examination-schema";

const SELECT = {
  id: true,
  type: true,
  name: true,
  performedAt: true,
  findings: true,
  notes: true,
  recordId: true,
  patient: { select: { id: true, name: true, species: true, rmNo: true, allergyNote: true, aggressive: true, owner: { select: { name: true } } } },
  createdBy: { select: { name: true } },
  attachments: { select: { id: true, fileName: true, mime: true, size: true, createdAt: true }, orderBy: { createdAt: "asc" } },
} satisfies Prisma.ExaminationSelect;

export type ExaminationRow = Prisma.ExaminationGetPayload<{ select: typeof SELECT }>;

const day = (ymd: string) => new Date(`${ymd}T00:00:00Z`);

export async function listExaminations(type: ExaminationType, { q, from, to }: { q?: string; from?: string; to?: string }, skip = 0, take = 50, orderBy?: Prisma.ExaminationOrderByWithRelationInput | Prisma.ExaminationOrderByWithRelationInput[]) {
  const term = q?.trim();
  const where: Prisma.ExaminationWhereInput = {
    type,
    deletedAt: null,
    patient: { deletedAt: null, owner: { deletedAt: null } },
    ...((from || to) && { performedAt: { ...(from && { gte: day(from) }), ...(to && { lte: day(to) }) } }),
    ...(term && {
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { findings: { contains: term, mode: "insensitive" } },
        { patient: { name: { contains: term, mode: "insensitive" } } },
        { patient: { owner: { name: { contains: term, mode: "insensitive" } } } },
      ],
    }),
  };
  const [rows, total] = await Promise.all([
    prisma.examination.findMany({ where, select: SELECT, orderBy: orderBy ?? [{ performedAt: "desc" }, { createdAt: "desc" }], skip, take }),
    prisma.examination.count({ where }),
  ]);
  return { rows, total };
}

export const getExamination = (id: string) => prisma.examination.findFirst({ where: { id, deletedAt: null }, select: SELECT });

export const listPatientExaminations = (patientId: string) =>
  prisma.examination.findMany({ where: { patientId, deletedAt: null }, select: SELECT, orderBy: [{ performedAt: "desc" }, { createdAt: "desc" }], take: 20 });

export const listRecordExaminations = (recordId: string) =>
  prisma.examination.findMany({ where: { recordId, deletedAt: null }, select: SELECT, orderBy: { performedAt: "desc" } });

export async function listRecordOptions(patientId: string) {
  const rows = await prisma.medicalRecord.findMany({
    where: { visit: { patientId, status: { not: "BATAL" } } },
    select: { id: true, diagnosis: true, visit: { select: { visitDate: true } } },
    orderBy: { visit: { visitDate: "desc" } },
    take: 10,
  });
  return rows.map((r) => ({ id: r.id, visitDate: r.visit.visitDate, diagnosis: r.diagnosis }));
}

async function checkLinks(patientId: string, recordId: string) {
  const patient = await prisma.patient.findFirst({ where: { id: patientId, deletedAt: null, owner: { deletedAt: null } }, select: { id: true } });
  if (!patient) return "Pasien tidak ditemukan.";
  if (recordId) {
    const record = await prisma.medicalRecord.findFirst({ where: { id: recordId, visit: { patientId } }, select: { id: true } });
    if (!record) return "Rekam medis tidak sesuai dengan pasien.";
  }
  return null;
}

const toData = (input: ExaminationInput) => ({ name: input.name, performedAt: day(input.performedAt), findings: input.findings || null, notes: input.notes || null, recordId: input.recordId || null });

export async function createExamination(userId: string, type: ExaminationType, patientId: string, input: ExaminationInput) {
  const problem = await checkLinks(patientId, input.recordId);
  if (problem) return { error: problem };
  return prisma.$transaction(async (tx) => {
    const row = await tx.examination.create({ data: { ...toData(input), type, patientId, createdById: userId }, select: { id: true } });
    await logAudit(tx, { userId, action: "examination.create", entity: "examination", entityId: row.id, after: { type, name: input.name, patientId } });
    return { id: row.id };
  });
}

export async function updateExamination(userId: string, id: string, input: ExaminationInput) {
  const before = await prisma.examination.findFirst({ where: { id, deletedAt: null }, select: { patientId: true, name: true, performedAt: true, findings: true, notes: true, recordId: true } });
  if (!before) return { error: "Data tidak ditemukan." };
  const problem = await checkLinks(before.patientId, input.recordId);
  if (problem) return { error: problem };
  await prisma.$transaction(async (tx) => {
    await tx.examination.update({ where: { id }, data: toData(input) });
    await logAudit(tx, {
      userId,
      action: "examination.update",
      entity: "examination",
      entityId: id,
      before: { name: before.name, performedAt: before.performedAt.toISOString().slice(0, 10), findings: before.findings, notes: before.notes, recordId: before.recordId },
      after: { name: input.name, performedAt: input.performedAt, findings: input.findings || null, notes: input.notes || null, recordId: input.recordId || null },
    });
  });
  return { id };
}

export async function deleteExamination(userId: string, id: string) {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.examination.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
    if (count === 1) await logAudit(tx, { userId, action: "examination.delete", entity: "examination", entityId: id });
    return count === 1;
  });
}

export async function addExaminationFile(userId: string, examinationId: string, file: File) {
  const exam = await prisma.examination.findFirst({ where: { id: examinationId, deletedAt: null }, select: { id: true } });
  if (!exam) return { error: "Data tidak ditemukan." };

  const data = Buffer.from(await file.arrayBuffer());
  const kind = detectAttachment(data.subarray(0, 8), data.length);
  if ("error" in kind) return { error: kind.error };

  const filePath = await storeFile(data, kind.ext);
  await prisma.$transaction(async (tx) => {
    const row = await tx.attachment.create({ data: { examinationId, filePath, fileName: file.name.slice(0, 150), mime: kind.mime, size: data.length }, select: { id: true } });
    await logAudit(tx, { userId, action: "examination.attach", entity: "examination", entityId: examinationId, after: { attachmentId: row.id, fileName: file.name.slice(0, 150) } });
  });
  return {};
}
