import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { BreedInput, SpeciesInput } from "@/lib/animal-schema";

export async function listActiveAnimalOptions() {
  const [species, breeds] = await Promise.all([
    prisma.animalSpecies.findMany({ where: { active: true }, select: { name: true }, orderBy: { name: "asc" } }),
    prisma.animalBreed.findMany({ where: { active: true, species: { active: true } }, select: { name: true, species: { select: { name: true } } }, orderBy: { name: "asc" } }),
  ]);
  return { species: species.map((s) => s.name), breeds: breeds.map((b) => ({ species: b.species.name, name: b.name })) };
}

export const listAllSpecies = () => prisma.animalSpecies.findMany({ select: { id: true, name: true, active: true }, orderBy: { name: "asc" } });

export async function pageSpecies(q: string | undefined, skip: number, take: number) {
  const where: Prisma.AnimalSpeciesWhereInput = q?.trim() ? { name: { contains: q.trim(), mode: "insensitive" } } : {};
  const [rows, total] = await Promise.all([
    prisma.animalSpecies.findMany({ where, select: { id: true, name: true, active: true, createdAt: true, _count: { select: { breeds: true } } }, orderBy: { name: "asc" }, skip, take }),
    prisma.animalSpecies.count({ where }),
  ]);
  return { rows, total };
}

export async function pageBreeds({ q, speciesId }: { q?: string; speciesId?: string }, skip: number, take: number) {
  const where: Prisma.AnimalBreedWhereInput = { ...(speciesId && { speciesId }), ...(q?.trim() && { name: { contains: q.trim(), mode: "insensitive" } }) };
  const [rows, total] = await Promise.all([
    prisma.animalBreed.findMany({ where, select: { id: true, name: true, active: true, createdAt: true, species: { select: { id: true, name: true } } }, orderBy: [{ species: { name: "asc" } }, { name: "asc" }], skip, take }),
    prisma.animalBreed.count({ where }),
  ]);
  return { rows, total };
}

export const getSpecies = (id: string) => prisma.animalSpecies.findUnique({ where: { id }, select: { id: true, name: true, active: true } });
export const getBreed = (id: string) => prisma.animalBreed.findUnique({ where: { id }, select: { id: true, name: true, active: true, speciesId: true } });

const TAKEN = "Nama sudah dipakai.";

type Saved = { error: string } | { id: string };

export async function saveSpecies(id: string | null, input: SpeciesInput): Promise<Saved> {
  return prisma.$transaction(async (tx) => {
    const clash = await tx.animalSpecies.findFirst({ where: { name: { equals: input.name, mode: "insensitive" }, ...(id && { NOT: { id } }) }, select: { id: true } });
    if (clash) return { error: TAKEN };
    if (!id) return { id: (await tx.animalSpecies.create({ data: input, select: { id: true } })).id };

    const before = await tx.animalSpecies.findUnique({ where: { id }, select: { name: true } });
    if (!before) return { error: "Data tidak ditemukan." };
    await tx.animalSpecies.update({ where: { id }, data: input });
    if (before.name !== input.name) await tx.patient.updateMany({ where: { species: before.name }, data: { species: input.name } });
    return { id };
  });
}

export async function saveBreed(id: string | null, input: BreedInput): Promise<Saved> {
  return prisma.$transaction(async (tx) => {
    const species = await tx.animalSpecies.findUnique({ where: { id: input.speciesId }, select: { name: true } });
    if (!species) return { error: "Jenis hewan tidak ditemukan." };
    const clash = await tx.animalBreed.findFirst({ where: { speciesId: input.speciesId, name: { equals: input.name, mode: "insensitive" }, ...(id && { NOT: { id } }) }, select: { id: true } });
    if (clash) return { error: TAKEN };
    if (!id) return { id: (await tx.animalBreed.create({ data: input, select: { id: true } })).id };

    const before = await tx.animalBreed.findUnique({ where: { id }, select: { name: true, species: { select: { name: true } } } });
    if (!before) return { error: "Data tidak ditemukan." };
    if (before.species.name !== species.name) return { error: "Jenis hewan sebuah ras tidak bisa dipindah. Buat ras baru di jenis yang benar." };
    await tx.animalBreed.update({ where: { id }, data: input });
    if (before.name !== input.name) await tx.patient.updateMany({ where: { species: species.name, breed: before.name }, data: { breed: input.name } });
    return { id };
  });
}
