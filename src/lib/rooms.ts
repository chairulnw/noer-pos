import { z } from "zod";
import { prisma } from "@/lib/db";

export const roomSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(50, "Maksimal 50 karakter"),
  type: z.enum(["RAWAT_INAP", "HOTEL"], { error: "Pilih jenis kandang" }),
  active: z.boolean(),
  defaultRateId: z.union([z.guid(), z.literal("")]),
  suitableFor: z.string().trim().max(80, "Maksimal 80 karakter"),
});

export type RoomInput = z.infer<typeof roomSchema>;

export const listRooms = () => prisma.room.findMany({ orderBy: [{ type: "asc" }, { name: "asc" }] });

export const getRoom = (id: string) => prisma.room.findUnique({ where: { id } });

export async function saveRoom(id: string | null, data: RoomInput) {
  const duplicate = await prisma.room.findFirst({
    where: { name: { equals: data.name, mode: "insensitive" }, ...(id && { NOT: { id } }) },
    select: { id: true },
  });
  if (duplicate) return { error: "Nama kandang sudah dipakai." };

  const rate = data.defaultRateId ? await prisma.item.findFirst({ where: { id: data.defaultRateId, type: "SERVICE", billingUnit: "PER_DAY", active: true, deletedAt: null }, select: { id: true } }) : null;
  if (data.defaultRateId && !rate) return { error: "Tarif harian tidak valid." };

  const row = { name: data.name, type: data.type, active: data.active, defaultRateId: rate?.id ?? null, suitableFor: data.suitableFor || null };
  if (id === null) await prisma.room.create({ data: row });
  else await prisma.room.update({ where: { id }, data: row });
  return {};
}

export const listDailyRates = () =>
  prisma.item.findMany({ where: { type: "SERVICE", billingUnit: "PER_DAY", active: true, deletedAt: null, category: { in: ["rawat inap", "hotel"] } }, select: { id: true, name: true, sellPrice: true }, orderBy: { name: "asc" } });

export const listHotelBoard = () =>
  prisma.room.findMany({
    where: { type: "HOTEL", active: true },
    select: {
      id: true,
      name: true,
      needsCleaning: true,
      suitableFor: true,
      defaultRate: { select: { name: true, sellPrice: true } },
      admissions: { where: { status: "AKTIF" }, select: { id: true, patient: { select: { name: true, species: true } } }, take: 1 },
    },
    orderBy: { name: "asc" },
  });

export async function markRoomClean(id: string) {
  const { count } = await prisma.room.updateMany({ where: { id, needsCleaning: true }, data: { needsCleaning: false } });
  return count === 1;
}
