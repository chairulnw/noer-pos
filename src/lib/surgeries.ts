import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { createOwnerDraftTx } from "@/lib/invoice-ops";
import { canTransition, completeSchema, isEditable, type SurgeryInput, type SurgeryStatus } from "@/lib/surgery-schema";

const SELECT = {
  id: true,
  procedure: true,
  anesthesia: true,
  surgeryDate: true,
  status: true,
  preNotes: true,
  postNotes: true,
  finishedAt: true,
  serviceItemId: true,
  invoice: { select: { id: true, invoiceNo: true, status: true } },
  patient: { select: { id: true, name: true, species: true, rmNo: true, allergyNote: true, aggressive: true, owner: { select: { id: true, name: true } } } },
  doctor: { select: { id: true, name: true } },
  serviceItem: { select: { name: true } },
  addenda: { select: { id: true, note: true, createdAt: true, user: { select: { name: true } } }, orderBy: { createdAt: "asc" as const } },
} satisfies Prisma.SurgerySelect;

export type SurgeryRow = Prisma.SurgeryGetPayload<{ select: typeof SELECT }>;

const day = (ymd: string) => new Date(`${ymd}T00:00:00Z`);

export async function pageSurgeries({ q, status, from, to }: { q?: string; status?: SurgeryStatus; from?: string; to?: string }, skip: number, take: number) {
  const term = q?.trim();
  const where: Prisma.SurgeryWhereInput = {
    ...(status && { status }),
    ...((from || to) && { surgeryDate: { ...(from && { gte: day(from) }), ...(to && { lte: day(to) }) } }),
    ...(term && { OR: [{ procedure: { contains: term, mode: "insensitive" } }, { anesthesia: { contains: term, mode: "insensitive" } }, { patient: { name: { contains: term, mode: "insensitive" } } }, { patient: { owner: { name: { contains: term, mode: "insensitive" } } } }] }),
  };
  const [rows, total] = await Promise.all([
    prisma.surgery.findMany({ where, select: SELECT, orderBy: [{ surgeryDate: "desc" }, { createdAt: "desc" }], skip, take }),
    prisma.surgery.count({ where }),
  ]);
  return { rows, total };
}

export const getSurgery = (id: string) => prisma.surgery.findUnique({ where: { id }, select: SELECT });

export const listPatientSurgeries = (patientId: string) => prisma.surgery.findMany({ where: { patientId }, select: SELECT, orderBy: { surgeryDate: "desc" }, take: 20 });

export const listOperationServices = () => prisma.item.findMany({ where: { type: "SERVICE", category: "operasi", active: true, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } });

async function validate(patientId: string, input: SurgeryInput) {
  const [patient, doctor, service] = await Promise.all([
    prisma.patient.findFirst({ where: { id: patientId, deletedAt: null, owner: { deletedAt: null } }, select: { id: true } }),
    prisma.user.findFirst({ where: { id: input.doctorId, role: "DOKTER", active: true }, select: { id: true } }),
    input.serviceItemId ? prisma.item.findFirst({ where: { id: input.serviceItemId, type: "SERVICE", active: true, deletedAt: null }, select: { id: true } }) : null,
  ]);
  if (!patient) return "Pasien tidak ditemukan.";
  if (!doctor) return "Dokter tidak valid.";
  if (input.serviceItemId && !service) return "Layanan operasi tidak valid.";
  return null;
}

const toData = (input: SurgeryInput) => ({ procedure: input.procedure, anesthesia: input.anesthesia || null, surgeryDate: day(input.surgeryDate), doctorId: input.doctorId, serviceItemId: input.serviceItemId || null, preNotes: input.preNotes || null });

export async function createSurgery(userId: string, patientId: string, input: SurgeryInput) {
  const problem = await validate(patientId, input);
  if (problem) return { error: problem };
  return prisma.$transaction(async (tx) => {
    const row = await tx.surgery.create({ data: { ...toData(input), patientId, createdById: userId }, select: { id: true } });
    await logAudit(tx, { userId, action: "surgery.create", entity: "surgery", entityId: row.id, after: { procedure: input.procedure, surgeryDate: input.surgeryDate, patientId } });
    return { id: row.id };
  });
}

export async function updateSurgery(userId: string, id: string, input: SurgeryInput) {
  const current = await prisma.surgery.findUnique({ where: { id }, select: { patientId: true, status: true, procedure: true, surgeryDate: true, anesthesia: true, preNotes: true, doctorId: true } });
  if (!current) return { error: "Data operasi tidak ditemukan." };
  if (!isEditable(current.status)) return { error: "Operasi yang sudah selesai atau batal tidak bisa diubah. Gunakan addendum." };
  const problem = await validate(current.patientId, input);
  if (problem) return { error: problem };
  const { count } = await prisma.surgery.updateMany({ where: { id, status: { in: ["DIJADWALKAN", "BERJALAN"] } }, data: toData(input) });
  if (count !== 1) return { error: "Status operasi sudah berubah." };
  await prisma.$transaction((tx) => logAudit(tx, { userId, action: "surgery.update", entity: "surgery", entityId: id, before: { procedure: current.procedure, surgeryDate: current.surgeryDate.toISOString().slice(0, 10), anesthesia: current.anesthesia, preNotes: current.preNotes }, after: { procedure: input.procedure, surgeryDate: input.surgeryDate, anesthesia: input.anesthesia || null, preNotes: input.preNotes || null } }));
  return { id };
}

export async function changeSurgeryStatus(userId: string, id: string, to: SurgeryStatus, postNotes: string) {
  return prisma.$transaction(async (tx) => {
    const surgery = await tx.surgery.findUnique({ where: { id }, select: { status: true, procedure: true, serviceItemId: true, invoiceId: true, patient: { select: { name: true, ownerId: true } } } });
    if (!surgery) return { error: "Data operasi tidak ditemukan." };
    if (!canTransition(surgery.status, to)) return { error: "Perubahan status ini tidak diizinkan." };

    let invoiceId = surgery.invoiceId;
    let notes = "";
    if (to === "SELESAI") {
      const parsed = completeSchema.safeParse({ postNotes });
      if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Catatan pasca-operasi wajib diisi." };
      notes = parsed.data.postNotes;
      invoiceId ??= await createOwnerDraftTx(tx, userId, { ownerId: surgery.patient.ownerId, label: `Operasi: ${surgery.patient.name} - ${surgery.procedure}`.slice(0, 100), itemId: surgery.serviceItemId });
    }
    const { count } = await tx.surgery.updateMany({ where: { id, status: surgery.status }, data: { status: to, ...(to === "SELESAI" && { postNotes: notes, finishedAt: new Date(), invoiceId }) } });
    if (count !== 1) return { error: "Status operasi sudah berubah." };
    await logAudit(tx, { userId, action: `surgery.${to === "SELESAI" ? "complete" : to === "BATAL" ? "cancel" : "start"}`, entity: "surgery", entityId: id, before: { status: surgery.status }, after: { status: to, invoiceId } });
    return { ok: true, invoiceId };
  });
}

export async function addSurgeryAddendum(userId: string, id: string, note: string) {
  return prisma.$transaction(async (tx) => {
    const surgery = await tx.surgery.findUnique({ where: { id }, select: { status: true } });
    if (!surgery) return { error: "Data operasi tidak ditemukan." };
    if (surgery.status !== "SELESAI") return { error: "Addendum hanya untuk operasi yang sudah selesai." };
    const row = await tx.surgeryAddendum.create({ data: { surgeryId: id, note, userId }, select: { id: true } });
    await logAudit(tx, { userId, action: "surgery.addendum", entity: "surgery", entityId: id, after: { addendumId: row.id } });
    return { ok: true };
  });
}
