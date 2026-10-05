import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { todayJakarta } from "@/lib/date";
import { listPatientExaminations } from "@/lib/examinations";
import { nextRmNo, normalizePatient, type OwnerInput, type PatientInput } from "@/lib/patient-schema";

const LIST_SELECT = {
  id: true,
  rmNo: true,
  name: true,
  species: true,
  breed: true,
  allergyNote: true,
  aggressive: true,
  owner: { select: { id: true, name: true, whatsapp: true } },
} satisfies Prisma.PatientSelect;

export async function searchPatients(query: string) {
  const term = query.trim();
  const phone = term.replace(/\D/g, "").replace(/^0/, "");
  const ownerMatch: Prisma.OwnerWhereInput = {
    OR: [{ name: { contains: term, mode: "insensitive" } }, ...(phone.length >= 3 ? [{ whatsapp: { contains: phone } }] : [])],
  };

  const [patients, ownersWithoutPets] = await Promise.all([
    prisma.patient.findMany({
      where: {
        deletedAt: null,
        owner: { deletedAt: null },
        ...(term && {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { rmNo: { contains: term, mode: "insensitive" } },
            { microchip: { contains: term } },
            { owner: ownerMatch },
          ],
        }),
      },
      select: LIST_SELECT,
      orderBy: term ? { name: "asc" } : { createdAt: "desc" },
      take: 50,
    }),
    term
      ? prisma.owner.findMany({
          where: { deletedAt: null, patients: { none: { deletedAt: null } }, ...ownerMatch },
          select: { id: true, name: true, whatsapp: true },
          take: 20,
        })
      : [],
  ]);

  return { patients, ownersWithoutPets };
}

function ownerWhere(query: string): Prisma.OwnerWhereInput {
  const term = query.trim();
  const phone = term.replace(/\D/g, "").replace(/^0/, "");
  return {
    deletedAt: null,
    ...(term && {
      OR: [
        { name: { contains: term, mode: "insensitive" as const } },
        { address: { contains: term, mode: "insensitive" as const } },
        ...(phone.length >= 3 ? [{ whatsapp: { contains: phone } }] : []),
      ],
    }),
  };
}

const OWNER_LIST = { id: true, name: true, whatsapp: true, address: true, walletBalance: true, patients: { where: { deletedAt: null }, select: { name: true } } } satisfies Prisma.OwnerSelect;

const withPets = <T extends { patients: { name: string }[] }>({ patients, ...owner }: T) => ({ ...owner, pets: patients.map((p) => p.name) });

export async function listOwners(query: string) {
  const rows = await prisma.owner.findMany({ where: ownerWhere(query), select: OWNER_LIST, orderBy: query.trim() ? { name: "asc" } : { createdAt: "desc" }, take: 100 });
  return rows.map(withPets);
}

export async function pageOwners(query: string, skip: number, take: number) {
  const where = ownerWhere(query);
  const [rows, total] = await Promise.all([
    prisma.owner.findMany({ where, select: OWNER_LIST, orderBy: query.trim() ? { name: "asc" } : { createdAt: "desc" }, skip, take }),
    prisma.owner.count({ where }),
  ]);
  return { rows: rows.map(withPets), total };
}

export async function pagePatients(query: string, skip: number, take: number) {
  const term = query.trim();
  const phone = term.replace(/\D/g, "").replace(/^0/, "");
  const where: Prisma.PatientWhereInput = {
    deletedAt: null,
    owner: { deletedAt: null },
    ...(term && {
      OR: [
        { name: { contains: term, mode: "insensitive" as const } },
        { rmNo: { contains: term, mode: "insensitive" as const } },
        { microchip: { contains: term } },
        { owner: { OR: [{ name: { contains: term, mode: "insensitive" as const } }, ...(phone.length >= 3 ? [{ whatsapp: { contains: phone } }] : [])] } },
      ],
    }),
  };
  const [rows, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      select: { id: true, rmNo: true, name: true, species: true, breed: true, sex: true, lastWeightKg: true, allergyNote: true, aggressive: true, owner: { select: { id: true, name: true, whatsapp: true } } },
      orderBy: term ? { name: "asc" } : { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.patient.count({ where }),
  ]);
  return { rows: rows.map((r) => ({ ...r, lastWeightKg: r.lastWeightKg === null ? null : Number(r.lastWeightKg) })), total };
}

export async function getPatient(id: string) {
  const row = await prisma.patient.findFirst({
    where: { id, deletedAt: null, owner: { deletedAt: null } },
    include: { owner: { select: { id: true, name: true, whatsapp: true } } },
  });
  return row && { ...row, lastWeightKg: row.lastWeightKg === null ? null : Number(row.lastWeightKg) };
}

export const getOwner = (id: string) =>
  prisma.owner.findFirst({
    where: { id, deletedAt: null },
    include: {
      patients: { where: { deletedAt: null }, select: LIST_SELECT, orderBy: { name: "asc" } },
    },
  });

export async function saveOwner(id: string | null, data: OwnerInput, confirmDuplicate: boolean) {
  if (!confirmDuplicate) {
    const duplicate = await prisma.owner.findFirst({
      where: { whatsapp: data.whatsapp, deletedAt: null, ...(id && { NOT: { id } }) },
      select: { name: true },
    });
    if (duplicate) return { duplicate: duplicate.name };
  }

  if (id === null) return { id: (await prisma.owner.create({ data, select: { id: true } })).id };

  const { count } = await prisma.owner.updateMany({ where: { id, deletedAt: null }, data });
  return count === 1 ? { id } : { error: "Owner tidak ditemukan." };
}

export async function savePatient(ownerId: string, id: string | null, input: PatientInput) {
  const owner = await prisma.owner.findFirst({ where: { id: ownerId, deletedAt: null }, select: { id: true } });
  if (!owner) return { error: "Owner tidak ditemukan." };

  const data = normalizePatient(input);

  if (id !== null) {
    const { count } = await prisma.patient.updateMany({ where: { id, ownerId, deletedAt: null }, data });
    return count === 1 ? { id } : { error: "Pasien tidak ditemukan." };
  }

  // Dua pendaftaran bersamaan bisa menarik nomor yang sama; unique rm_no menolak yang kedua, ulangi.
  for (let attempt = 1; ; attempt++) {
    const year = todayJakarta().getUTCFullYear();
    const last = await prisma.patient.findFirst({
      where: { rmNo: { startsWith: `RM-${year}-` } },
      orderBy: { rmNo: "desc" },
      select: { rmNo: true },
    });
    try {
      const created = await prisma.patient.create({
        data: { ...data, ownerId, rmNo: nextRmNo(year, last?.rmNo ?? null) },
        select: { id: true },
      });
      return { id: created.id };
    } catch (error) {
      const taken = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
      if (!taken || attempt >= 3) throw error;
    }
  }
}

export async function deletePatient(id: string) {
  await prisma.patient.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
}

export async function deleteOwner(id: string) {
  const pets = await prisma.patient.count({ where: { ownerId: id, deletedAt: null } });
  if (pets > 0) return { error: "Owner masih punya hewan terdaftar. Hapus hewannya terlebih dahulu." };
  await prisma.owner.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
  return {};
}

export async function getPatientHistory(patientId: string) {
  const [visits, vaccinations, examinations] = await Promise.all([
    prisma.visit.findMany({
      where: { patientId, status: { not: "BATAL" } },
      select: {
        id: true,
        visitDate: true,
        complaint: true,
        doctor: { select: { name: true } },
        medicalRecord: { select: { diagnosis: true, finalized: true } },
      },
      orderBy: [{ visitDate: "desc" }, { createdAt: "desc" }],
      take: 30,
    }),
    prisma.vaccination.findMany({
      where: { record: { visit: { patientId } } },
      select: { id: true, givenAt: true, nextDue: true, batchNo: true, item: { select: { name: true } } },
      orderBy: { givenAt: "desc" },
      take: 30,
    }),
    listPatientExaminations(patientId),
  ]);
  return { visits, vaccinations, examinations };
}
