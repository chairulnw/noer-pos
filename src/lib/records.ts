import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { todayJakarta } from "@/lib/date";
import { storeFile, readStoredFile } from "@/lib/uploads";
import {
  defaultNextDue,
  detectAttachment,
  isRecordEmpty,
  type RecordInput,
  type VaccinationInput,
} from "@/lib/record-schema";

const LOCKED = "Rekam medis sudah final dan tidak bisa diubah. Gunakan addendum.";

export async function getRecordView(visitId: string) {
  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
    select: {
      id: true,
      status: true,
      complaint: true,
      createdAt: true,
      doctor: { select: { name: true } },
      patient: {
        select: {
          id: true, name: true, rmNo: true, species: true, breed: true, sex: true, neutered: true, birthDate: true,
          lastWeightKg: true, allergyNote: true, aggressive: true, behaviorNote: true,
          owner: { select: { name: true } },
        },
      },
    },
  });
  if (!visit) return null;

  const record = await prisma.medicalRecord.findUnique({
    where: { visitId },
    include: {
      addenda: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
      attachments: { orderBy: { createdAt: "asc" } },
      vaccinations: { include: { item: { select: { name: true } } }, orderBy: { givenAt: "asc" } },
    },
  });
  return { visit, record };
}

export async function ensureRecord(visitId: string) {
  const visit = await prisma.visit.findUnique({ where: { id: visitId }, select: { status: true } });
  if (!visit || visit.status === "BATAL") return false;
  await prisma.medicalRecord.upsert({ where: { visitId }, create: { visitId }, update: {} });
  return true;
}

export async function saveRecord(recordId: string, input: RecordInput) {
  const { vitals, ...soap } = input;
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.medicalRecord.updateMany({
      where: { id: recordId, finalized: false },
      data: { ...soap, diagnosis: soap.diagnosis || null, vitals },
    });
    if (count === 0) return { error: LOCKED };

    if (vitals.weight !== null) {
      const record = await tx.medicalRecord.findUniqueOrThrow({ where: { id: recordId }, select: { visit: { select: { patientId: true } } } });
      await tx.patient.update({ where: { id: record.visit.patientId }, data: { lastWeightKg: Math.round(vitals.weight * 100) / 100 } });
    }
    if (soap.diagnosis) {
      const known = await tx.diagnosisMaster.findFirst({ where: { name: { equals: soap.diagnosis, mode: "insensitive" } }, select: { id: true } });
      if (!known) await tx.diagnosisMaster.create({ data: { name: soap.diagnosis } });
    }
    return {};
  });
}

export async function finalizeRecord(userId: string, recordId: string, input: RecordInput) {
  if (isRecordEmpty(input)) return { error: "Isi minimal satu bagian (SOAP atau diagnosa) sebelum difinalkan." };

  const saved = await saveRecord(recordId, input);
  if (saved.error) return saved;

  return prisma.$transaction(async (tx) => {
    const { count } = await tx.medicalRecord.updateMany({
      where: { id: recordId, finalized: false },
      data: { finalized: true, finalizedAt: new Date() },
    });
    if (count === 0) return { error: LOCKED };

    const record = await tx.medicalRecord.findUniqueOrThrow({ where: { id: recordId }, select: { visitId: true } });
    await tx.visit.updateMany({ where: { id: record.visitId, status: "DILAYANI" }, data: { status: "MENUNGGU_BAYAR" } });
    await logAudit(tx, { userId, action: "medical_record.finalize", entity: "medical_record", entityId: recordId });
    return { visitId: record.visitId };
  });
}

export async function addAddendum(userId: string, recordId: string, note: string) {
  return prisma.$transaction(async (tx) => {
    const record = await tx.medicalRecord.findUnique({ where: { id: recordId }, select: { finalized: true } });
    if (!record) return { error: "Rekam medis tidak ditemukan." };
    if (!record.finalized) return { error: "Addendum hanya untuk rekam medis yang sudah final." };

    const addendum = await tx.recordAddendum.create({ data: { recordId, userId, note }, select: { id: true } });
    await logAudit(tx, { userId, action: "medical_record.addendum", entity: "medical_record", entityId: recordId, after: { addendumId: addendum.id } });
    return {};
  });
}

export const listVaccines = () =>
  prisma.item.findMany({
    where: { type: "PRODUCT", category: "vaksin", active: true, deletedAt: null },
    select: { id: true, name: true, vaccineIntervalDays: true },
    orderBy: { name: "asc" },
  });

const toDate = (iso: string) => new Date(`${iso}T00:00:00Z`);

export async function addVaccination(recordId: string, input: VaccinationInput) {
  const [record, item] = await Promise.all([
    prisma.medicalRecord.findUnique({ where: { id: recordId }, select: { finalized: true } }),
    prisma.item.findFirst({ where: { id: input.itemId, category: "vaksin", deletedAt: null }, select: { vaccineIntervalDays: true } }),
  ]);
  if (!record) return { error: "Rekam medis tidak ditemukan." };
  if (record.finalized) return { error: LOCKED };
  if (!item) return { error: "Vaksin tidak ditemukan." };

  const givenAt = toDate(input.givenAt);
  if (givenAt > todayJakarta()) return { error: "Tanggal pemberian tidak boleh di masa depan." };

  await prisma.vaccination.create({
    data: {
      recordId,
      itemId: input.itemId,
      batchNo: input.batchNo || null,
      givenAt,
      nextDue: input.nextDue ? toDate(input.nextDue) : defaultNextDue(givenAt, item.vaccineIntervalDays),
    },
  });
  return {};
}

export async function removeVaccination(id: string) {
  const { count } = await prisma.vaccination.deleteMany({ where: { id, record: { finalized: false } } });
  return count === 1;
}

export async function addAttachment(recordId: string, file: File) {
  const record = await prisma.medicalRecord.findUnique({ where: { id: recordId }, select: { id: true } });
  if (!record) return { error: "Rekam medis tidak ditemukan." };

  const data = Buffer.from(await file.arrayBuffer());
  const kind = detectAttachment(data.subarray(0, 8), data.length);
  if ("error" in kind) return { error: kind.error };

  const filePath = await storeFile(data, kind.ext);
  await prisma.attachment.create({
    data: { recordId, filePath, fileName: file.name.slice(0, 150), mime: kind.mime, size: data.length },
  });
  return {};
}

export async function getAttachmentFile(id: string) {
  const row = await prisma.attachment.findUnique({ where: { id } });
  return row && { row, data: await readStoredFile(row.filePath) };
}

export async function listDueVaccinations(days: number) {
  const until = new Date(todayJakarta().getTime() + days * 86_400_000);
  const rows = await prisma.vaccination.findMany({
    where: { nextDue: { not: null }, record: { visit: { patient: { deletedAt: null, owner: { deletedAt: null } } } } },
    select: {
      id: true,
      itemId: true,
      givenAt: true,
      nextDue: true,
      item: { select: { name: true } },
      record: { select: { visit: { select: { patient: { select: { id: true, name: true, species: true, owner: { select: { name: true, whatsapp: true } } } } } } } },
    },
  });

  const latest = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    const key = `${row.record.visit.patient.id}:${row.itemId}`;
    const current = latest.get(key);
    if (!current || row.givenAt > current.givenAt) latest.set(key, row);
  }
  return [...latest.values()]
    .filter((row) => row.nextDue! <= until)
    .sort((a, b) => a.nextDue!.getTime() - b.nextDue!.getTime());
}

export const listDiagnoses = () => prisma.diagnosisMaster.findMany({ select: { name: true }, orderBy: { name: "asc" } });

export type RecordView = NonNullable<Awaited<ReturnType<typeof getRecordView>>>;
