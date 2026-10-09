import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";

export const roomSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(50, "Maksimal 50 karakter"),
  type: z.enum(["RAWAT_INAP", "HOTEL"], { error: "Pilih jenis kandang" }),
  active: z.boolean(),
  capacity: z.number({ error: "Kapasitas wajib diisi" }).int("Harus bilangan bulat").min(1, "Minimal 1").max(50, "Maksimal 50"),
  dailyRate: z.number({ error: "Tarif tidak valid" }).int("Harus bilangan bulat").min(0, "Tidak boleh negatif").max(100_000_000, "Terlalu besar"),
  suitableFor: z.string().trim().max(80, "Maksimal 80 karakter"),
  dimensions: z.string().trim().max(80, "Maksimal 80 karakter"),
});

export type RoomInput = z.infer<typeof roomSchema>;

const rate = (d: { sellPrice: Prisma.Decimal } | null) => (d ? { sellPrice: Number(d.sellPrice) } : null);

export const listRooms = async () =>
  (await prisma.room.findMany({ where: { deletedAt: null }, include: { defaultRate: { select: { sellPrice: true } } }, orderBy: [{ type: "asc" }, { name: "asc" }] })).map((r) => ({ ...r, defaultRate: rate(r.defaultRate) }));

export const getRoom = async (id: string) => {
  const room = await prisma.room.findUnique({ where: { id }, include: { defaultRate: { select: { sellPrice: true } } } });
  return room && { ...room, defaultRate: rate(room.defaultRate) };
};

export async function saveRoom(userId: string, id: string | null, data: RoomInput) {
  const duplicate = await prisma.room.findFirst({
    where: { deletedAt: null, name: { equals: data.name, mode: "insensitive" }, ...(id && { NOT: { id } }) },
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
        if (Number(current?.defaultRate?.sellPrice) !== data.dailyRate) {
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

    const row = { name: data.name, type: data.type, active: data.active, capacity: data.capacity, defaultRateId, suitableFor: data.suitableFor || null, dimensions: data.dimensions || null };
    if (id === null) await tx.room.create({ data: row });
    else await tx.room.update({ where: { id }, data: row });
    return {};
  });
}

export async function setRoomCleaning(id: string, needsCleaning: boolean) {
  const active = await prisma.admission.count({ where: { roomId: id, status: "AKTIF" } });
  if (needsCleaning && active > 0) return { error: "Kandang masih terisi." };
  const { count } = await prisma.room.updateMany({ where: { id, deletedAt: null, needsCleaning: !needsCleaning }, data: { needsCleaning } });
  return count === 1 ? {} : { error: "Status kandang sudah berubah." };
}

export async function deleteRoom(userId: string, id: string) {
  return prisma.$transaction(async (tx) => {
    const room = await tx.room.findFirst({ where: { id, deletedAt: null }, select: { name: true } });
    if (!room) return { error: "Kandang tidak ditemukan." };
    if ((await tx.admission.count({ where: { roomId: id, status: "AKTIF" } })) > 0) return { error: "Kandang masih terisi, tidak bisa dihapus." };
    await tx.room.update({ where: { id }, data: { deletedAt: new Date(), active: false } });
    await logAudit(tx, { userId, action: "room.delete", entity: "room", entityId: id, before: { name: room.name } });
    return {};
  });
}

export async function getHotelOverview() {
  const [rooms, stays, history] = await Promise.all([
    prisma.room.findMany({
      where: { type: "HOTEL", deletedAt: null, active: true },
      select: { id: true, name: true, capacity: true, needsCleaning: true, suitableFor: true, dimensions: true, defaultRate: { select: { sellPrice: true } }, admissions: { where: { status: "AKTIF" }, select: { id: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.admission.findMany({
      where: { type: "HOTEL", status: "AKTIF" },
      select: { id: true, checkIn: true, expectedCheckOut: true, patient: { select: { name: true, species: true, owner: { select: { name: true } } } }, room: { select: { name: true } }, rateItem: { select: { sellPrice: true } } },
      orderBy: { checkIn: "asc" },
    }),
    prisma.admission.findMany({
      where: { type: "HOTEL", status: "SELESAI" },
      select: { id: true, checkOut: true, patient: { select: { name: true, owner: { select: { name: true } } } }, room: { select: { name: true } }, invoices: { where: { status: { not: "VOID" } }, select: { id: true }, take: 1 } },
      orderBy: { checkOut: "desc" },
      take: 50,
    }),
  ]);
  return {
    rooms: rooms.map((r) => ({ ...r, defaultRate: rate(r.defaultRate) })),
    stays: stays.map((s) => ({ ...s, rateItem: { sellPrice: Number(s.rateItem.sellPrice) } })),
    history,
  };
}
