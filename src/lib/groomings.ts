import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { canTransition, type GroomingInput, type GroomingStatus } from "@/lib/grooming-schema";
import { createOwnerDraftTx } from "@/lib/invoice-ops";

const SELECT = {
  id: true,
  groomingDate: true,
  status: true,
  notes: true,
  finishedAt: true,
  serviceItemId: true,
  serviceItem: { select: { name: true } },
  invoice: { select: { id: true, invoiceNo: true } },
  patient: { select: { id: true, name: true, species: true, rmNo: true, allergyNote: true, aggressive: true, owner: { select: { id: true, name: true } } } },
} satisfies Prisma.GroomingSelect;

const day = (ymd: string) => new Date(`${ymd}T00:00:00Z`);

export async function pageGroomings({ q, status }: { q?: string; status?: GroomingStatus }, skip: number, take: number, orderBy?: Prisma.GroomingOrderByWithRelationInput | Prisma.GroomingOrderByWithRelationInput[]) {
  const term = q?.trim();
  const where: Prisma.GroomingWhereInput = {
    ...(status && { status }),
    ...(term && { OR: [{ patient: { name: { contains: term, mode: "insensitive" } } }, { patient: { owner: { name: { contains: term, mode: "insensitive" } } } }, { serviceItem: { name: { contains: term, mode: "insensitive" } } }] }),
  };
  const [rows, total] = await Promise.all([
    prisma.grooming.findMany({ where, select: SELECT, orderBy: orderBy ?? [{ groomingDate: "desc" }, { createdAt: "desc" }], skip, take }),
    prisma.grooming.count({ where }),
  ]);
  return { rows, total };
}

export const getGrooming = (id: string) => prisma.grooming.findUnique({ where: { id }, select: SELECT });

export const listGroomingServices = () => prisma.item.findMany({ where: { type: "SERVICE", category: "grooming", active: true, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } });

async function validate(patientId: string, serviceItemId: string) {
  const [patient, service] = await Promise.all([
    prisma.patient.findFirst({ where: { id: patientId, deletedAt: null, owner: { deletedAt: null } }, select: { id: true } }),
    prisma.item.findFirst({ where: { id: serviceItemId, type: "SERVICE", active: true, deletedAt: null }, select: { id: true } }),
  ]);
  if (!patient) return "Pasien tidak ditemukan.";
  if (!service) return "Layanan grooming tidak valid.";
  return null;
}

export async function createGrooming(userId: string, patientId: string, input: GroomingInput) {
  const problem = await validate(patientId, input.serviceItemId);
  if (problem) return { error: problem };
  return prisma.$transaction(async (tx) => {
    const row = await tx.grooming.create({ data: { patientId, serviceItemId: input.serviceItemId, groomingDate: day(input.groomingDate), notes: input.notes || null, createdById: userId }, select: { id: true } });
    await logAudit(tx, { userId, action: "grooming.create", entity: "grooming", entityId: row.id, after: { patientId, groomingDate: input.groomingDate } });
    return { id: row.id };
  });
}

export async function changeGroomingStatus(userId: string, id: string, to: GroomingStatus) {
  return prisma.$transaction(async (tx) => {
    const g = await tx.grooming.findUnique({ where: { id }, select: { status: true, serviceItemId: true, invoiceId: true, patient: { select: { name: true, ownerId: true } } } });
    if (!g) return { error: "Data grooming tidak ditemukan." };
    if (!canTransition(g.status, to)) return { error: "Perubahan status ini tidak diizinkan." };
    let invoiceId = g.invoiceId;
    if (to === "SELESAI") invoiceId ??= await createOwnerDraftTx(tx, userId, { ownerId: g.patient.ownerId, label: `Grooming: ${g.patient.name}`, itemId: g.serviceItemId });
    const { count } = await tx.grooming.updateMany({ where: { id, status: g.status }, data: { status: to, ...(to === "SELESAI" && { finishedAt: new Date(), invoiceId }) } });
    if (count !== 1) return { error: "Status grooming sudah berubah." };
    await logAudit(tx, { userId, action: `grooming.${to.toLowerCase()}`, entity: "grooming", entityId: id, before: { status: g.status }, after: { status: to, invoiceId } });
    return { ok: true };
  });
}

