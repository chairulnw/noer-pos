import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { createDraftInvoiceFromRecord, taxFromSettings } from "@/lib/invoices";
import { Prisma } from "@/generated/prisma/client";
import { todayJakarta } from "@/lib/date";
import { storeFile, readStoredFile } from "@/lib/uploads";
import {
  defaultNextDue,
  detectAttachment,
  isRecordEmpty,
  type RecordInput,
  type RecordItemInput,
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
      prescriptionItems: { include: { item: { select: { name: true, type: true, baseUnit: true } } }, orderBy: { id: "asc" } },
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

export async function saveRecord(recordId: string, input: RecordInput, items: RecordItemInput[]) {
  const { vitals, ...soap } = input;
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.medicalRecord.updateMany({
      where: { id: recordId, finalized: false },
      data: { ...soap, diagnosis: soap.diagnosis || null, vitals },
    });
    if (count === 0) return { error: LOCKED };

    const ids = [...new Set(items.map((i) => i.itemId))];
    const found = await tx.item.count({ where: { id: { in: ids }, active: true, deletedAt: null } });
    if (found !== ids.length) return { error: "Ada item yang tidak ditemukan atau sudah nonaktif." };
    await tx.prescriptionItem.deleteMany({ where: { recordId } });
    await tx.prescriptionItem.createMany({ data: items.map((i) => ({ recordId, itemId: i.itemId, qty: i.qty, instruction: i.instruction || null })) });

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

export async function finalizeRecord(userId: string, recordId: string, input: RecordInput, items: RecordItemInput[]) {
  if (isRecordEmpty(input)) return { error: "Isi minimal satu bagian (SOAP atau diagnosa) sebelum difinalkan." };

  const saved = await saveRecord(recordId, input, items);
  if (saved.error) return saved;

  const tax = await taxFromSettings();
  for (let attempt = 1; ; attempt++) {
    try {
      return await finalizeTransaction(userId, recordId, tax);
    } catch (error) {
      const clash = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
      if (!clash || attempt >= 3) throw error;
    }
  }
}

function finalizeTransaction(userId: string, recordId: string, tax: { rate: number; included: boolean }) {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.medicalRecord.updateMany({
      where: { id: recordId, finalized: false },
      data: { finalized: true, finalizedAt: new Date() },
    });
    if (count === 0) return { error: LOCKED };

    const record = await tx.medicalRecord.findUniqueOrThrow({ where: { id: recordId }, select: { visitId: true } });
    await tx.visit.updateMany({ where: { id: record.visitId, status: "DILAYANI" }, data: { status: "MENUNGGU_BAYAR" } });
    await createDraftInvoiceFromRecord(tx, userId, recordId, tax);
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
  // ponytail: DISTINCT ON memindai seluruh riwayat vaksin di DB (~ms per puluhan ribu baris), denormalisasi "vaksin terakhir" jika jadi lambat
  const latest = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM (
      SELECT DISTINCT ON (vi.patient_id, v.item_id) v.id, v.next_due
      FROM vaccination v
      JOIN medical_record r ON r.id = v.record_id
      JOIN visit vi ON vi.id = r.visit_id
      WHERE v.next_due IS NOT NULL
      ORDER BY vi.patient_id, v.item_id, v.given_at DESC
    ) t
    WHERE next_due <= ${until}::date`;
  if (latest.length === 0) return [];

  return prisma.vaccination.findMany({
    where: { id: { in: latest.map((r) => r.id) }, record: { visit: { patient: { deletedAt: null, owner: { deletedAt: null } } } } },
    orderBy: { nextDue: "asc" },
    select: {
      id: true,
      itemId: true,
      givenAt: true,
      nextDue: true,
      item: { select: { name: true } },
      record: { select: { visit: { select: { patient: { select: { id: true, name: true, species: true, owner: { select: { name: true, whatsapp: true } } } } } } } },
    },
  });
}

export const listDiagnoses = () => prisma.diagnosisMaster.findMany({ select: { name: true }, orderBy: { name: "asc" } });

export type RecordView = NonNullable<Awaited<ReturnType<typeof getRecordView>>>;

export const listCatalog = () =>
  prisma.item.findMany({
    where: { active: true, deletedAt: null },
    select: { id: true, name: true, type: true, category: true, baseUnit: true },
    orderBy: [{ type: "desc" }, { name: "asc" }],
  });

export type RecordListFilter = { q?: string; status?: "BELUM" | "DRAFT" | "FINAL"; doctorId?: string; from?: string; to?: string };

export async function listRecords({ q, status, doctorId, from, to }: RecordListFilter, skip = 0, take = 50, orderBy?: Prisma.VisitOrderByWithRelationInput | Prisma.VisitOrderByWithRelationInput[]) {
  const term = q?.trim();
  const day = (ymd: string) => new Date(`${ymd}T00:00:00Z`);
  const where: Prisma.VisitWhereInput = {
      status: { not: "BATAL" },
      ...(doctorId && { doctorId }),
      ...((from || to) && { visitDate: { ...(from && { gte: day(from) }), ...(to && { lte: day(to) }) } }),
      ...(status === "BELUM" && { medicalRecord: null }),
      ...(status === "DRAFT" && { medicalRecord: { is: { finalized: false } } }),
      ...(status === "FINAL" && { medicalRecord: { is: { finalized: true } } }),
      ...(term && {
        OR: [
          { patient: { name: { contains: term, mode: "insensitive" } } },
          { patient: { owner: { name: { contains: term, mode: "insensitive" } } } },
          { patient: { rmNo: { contains: term, mode: "insensitive" } } },
          { complaint: { contains: term, mode: "insensitive" } },
          { medicalRecord: { is: { diagnosis: { contains: term, mode: "insensitive" } } } },
        ],
      }),
  };
  const [rows, total] = await Promise.all([
    prisma.visit.findMany({
      where,
      select: {
        id: true,
        visitDate: true,
        complaint: true,
        patient: { select: { id: true, name: true, species: true, rmNo: true, allergyNote: true, aggressive: true, owner: { select: { name: true } } } },
        doctor: { select: { name: true } },
        medicalRecord: { select: { diagnosis: true, finalized: true } },
      },
      orderBy: orderBy ?? [{ visitDate: "desc" }, { createdAt: "desc" }],
      skip,
      take,
    }),
    prisma.visit.count({ where }),
  ]);
  return { rows, total };
}

export async function listVaccinations({ q, from, to }: { q?: string; from?: string; to?: string }, skip = 0, take = 50, orderBy?: Prisma.VaccinationOrderByWithRelationInput | Prisma.VaccinationOrderByWithRelationInput[]) {
  const term = q?.trim();
  const day = (ymd: string) => new Date(`${ymd}T00:00:00Z`);
  const where: Prisma.VaccinationWhereInput = {
    record: { visit: { patient: { deletedAt: null, owner: { deletedAt: null } } } },
    ...((from || to) && { givenAt: { ...(from && { gte: day(from) }), ...(to && { lte: day(to) }) } }),
    ...(term && {
      OR: [
        { item: { name: { contains: term, mode: "insensitive" } } },
        { batchNo: { contains: term, mode: "insensitive" } },
        { record: { visit: { patient: { name: { contains: term, mode: "insensitive" } } } } },
        { record: { visit: { patient: { owner: { name: { contains: term, mode: "insensitive" } } } } } },
      ],
    }),
  };
  const [rows, total] = await Promise.all([
    prisma.vaccination.findMany({
      where,
      select: {
        id: true,
        givenAt: true,
        nextDue: true,
        batchNo: true,
        item: { select: { name: true } },
        record: { select: { visit: { select: { id: true, patient: { select: { id: true, name: true, species: true, rmNo: true, owner: { select: { name: true } } } } } } } },
      },
      orderBy: orderBy ?? [{ givenAt: "desc" }, { id: "asc" }],
      skip,
      take,
    }),
    prisma.vaccination.count({ where }),
  ]);
  return { rows, total };
}
