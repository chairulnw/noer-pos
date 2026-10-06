import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";

export const roomSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(50, "Maksimal 50 karakter"),
  type: z.enum(["RAWAT_INAP", "HOTEL"], { error: "Pilih jenis kandang" }),
  active: z.boolean(),
  capacity: z.number({ error: "Kapasitas wajib diisi" }).int("Harus bilangan bulat").min(1, "Minimal 1").max(50, "Maksimal 50"),
  dailyRate: z.number({ error: "Tarif tidak valid" }).int("Harus bilangan bulat").min(0, "Tidak boleh negatif").max(100_000_000, "Terlalu besar"),
  suitableFor: z.string().trim().max(80, "Maksimal 80 karakter"),
});

export type RoomInput = z.infer<typeof roomSchema>;

export const listRooms = () => prisma.room.findMany({ include: { defaultRate: { select: { sellPrice: true } } }, orderBy: [{ type: "asc" }, { name: "asc" }] });

export const getRoom = (id: string) => prisma.room.findUnique({ where: { id }, include: { defaultRate: { select: { sellPrice: true } } } });

export async function saveRoom(userId: string, id: string | null, data: RoomInput) {
  const duplicate = await prisma.room.findFirst({
    where: { name: { equals: data.name, mode: "insensitive" }, ...(id && { NOT: { id } }) },
    select: { id: true },
  });
  if (duplicate) return { error: "Nama kandang sudah dipakai." };

  return prisma.$transaction(async (tx) => {
    const current = id ? await tx.room.findUnique({ where: { id }, select: { defaultRateId: true, defaultRate: { select: { sellPrice: true } } } }) : null;
    if (id && !current) return { error: "Kandang tidak ditemukan." };
    if (id && data.capacity < (await tx.admission.count({ where: { roomId: id, status: "AKTIF" } }))) return { error: "Kapasitas lebih kecil dari jumlah hewan yang sedang menginap." };

    let defaultRateId = current?.defaultRateId ?? null;
    if (data.dailyRate > 0) {
      if (defaultRateId) {
        if (current?.defaultRate?.sellPrice !== data.dailyRate) {
          await tx.item.update({ where: { id: defaultRateId }, data: { sellPrice: data.dailyRate } });
          await logAudit(tx, { userId, action: "item.update", entity: "item", entityId: defaultRateId, before: { sellPrice: current?.defaultRate?.sellPrice }, after: { sellPrice: data.dailyRate, via: "kandang" } });
        }
      } else {
        const item = await tx.item.create({
          data: { type: "SERVICE", category: data.type === "HOTEL" ? "hotel" : "rawat inap", name: `Kandang ${data.name}`, sellPrice: data.dailyRate, buyPrice: 0, baseUnit: "hari", billingUnit: "PER_DAY" },
          select: { id: true },
        });
        defaultRateId = item.id;
        await logAudit(tx, { userId, action: "item.create", entity: "item", entityId: item.id, after: { name: `Kandang ${data.name}`, sellPrice: data.dailyRate, via: "kandang" } });
      }
    }

    const row = { name: data.name, type: data.type, active: data.active, capacity: data.capacity, defaultRateId, suitableFor: data.suitableFor || null };
    if (id === null) await tx.room.create({ data: row });
    else await tx.room.update({ where: { id }, data: row });
    return {};
  });
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
      capacity: true,
      suitableFor: true,
      defaultRate: { select: { name: true, sellPrice: true } },
      admissions: { where: { status: "AKTIF" }, select: { id: true, patient: { select: { name: true, species: true } } } },
    },
    orderBy: { name: "asc" },
  });

export async function markRoomClean(id: string) {
  const { count } = await prisma.room.updateMany({ where: { id, needsCleaning: true }, data: { needsCleaning: false } });
  return count === 1;
}
