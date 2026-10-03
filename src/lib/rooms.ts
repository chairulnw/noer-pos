import { z } from "zod";
import { prisma } from "@/lib/db";

export const roomSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(50, "Maksimal 50 karakter"),
  type: z.enum(["RAWAT_INAP", "HOTEL"], { error: "Pilih jenis kandang" }),
  active: z.boolean(),
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

  if (id === null) await prisma.room.create({ data });
  else await prisma.room.update({ where: { id }, data });
  return {};
}
