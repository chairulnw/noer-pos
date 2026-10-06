"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { flash } from "@/components/flash";
import { dateToJakartaLocal } from "@/lib/admission-calc";
import { hotelCheckInSchema } from "@/lib/admission-schema";
import { createAdmission } from "@/lib/admissions";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { requireCapability } from "@/lib/require-role";
import { deleteRoom, roomSchema, saveRoom, setRoomCleaning } from "@/lib/rooms";
import { searchPatients } from "@/lib/patients";

export type HotelFormState = { message?: string; nonce?: number; errors?: Record<string, string[] | undefined> };

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");

export async function checkInHotelAction(_prev: HotelFormState, formData: FormData): Promise<HotelFormState> {
  const user = await requireCapability("manage_admission");
  const parsed = hotelCheckInSchema.safeParse({
    patientId: text(formData, "patientId"),
    roomId: text(formData, "roomId"),
    checkInDate: text(formData, "checkInDate"),
    expectedCheckOut: text(formData, "expectedCheckOut"),
    feedingInstructions: text(formData, "feedingInstructions"),
    notes: text(formData, "notes"),
  });
  if (!parsed.success) return { message: "Periksa kembali isian yang ditandai.", errors: z.flattenError(parsed.error).fieldErrors };

  const room = await prisma.room.findFirst({ where: { id: parsed.data.roomId, type: "HOTEL", deletedAt: null }, select: { defaultRateId: true, name: true } });
  if (!room) return { message: "Slot kandang tidak ditemukan." };
  if (!room.defaultRateId) return { message: `${room.name} belum punya tarif per hari. Isi tarif di Master Kandang.` };

  const now = dateToJakartaLocal(new Date());
  const checkIn = parsed.data.checkInDate === now.slice(0, 10) ? now : `${parsed.data.checkInDate}T12:00`;
  const result = await createAdmission(user.id, {
    patientId: parsed.data.patientId,
    type: "HOTEL",
    roomId: parsed.data.roomId,
    rateItemId: room.defaultRateId,
    checkIn,
    visitId: "",
    notes: parsed.data.notes,
    expectedCheckOut: parsed.data.expectedCheckOut,
    feedingInstructions: parsed.data.feedingInstructions,
  });
  if ("error" in result) return { message: result.error };

  revalidatePath("/pet-hotel");
  await flash("Check-in dicatat");
  redirect("/pet-hotel");
}

export async function saveHotelRoomAction(_prev: HotelFormState, formData: FormData): Promise<HotelFormState> {
  const user = await requireCapability("manage_rooms");
  const parsed = roomSchema.safeParse({
    name: text(formData, "name"),
    type: "HOTEL",
    active: true,
    capacity: Number(formData.get("capacity") || 1),
    dailyRate: Number(formData.get("dailyRate") || 0),
    suitableFor: text(formData, "suitableFor"),
    dimensions: text(formData, "dimensions"),
  });
  if (!parsed.success) return { message: "Periksa kembali isian yang ditandai.", errors: z.flattenError(parsed.error).fieldErrors };
  const result = await saveRoom(user.id, null, parsed.data);
  if (result.error) return { message: result.error };
  revalidatePath("/pet-hotel");
  await flash("Slot kandang disimpan");
  return { nonce: Date.now() };
}

export async function setCleaningAction(roomId: string, needsCleaning: boolean) {
  await requireCapability("manage_admission");
  if (!z.guid().safeParse(roomId).success) return;
  await setRoomCleaning(roomId, needsCleaning);
  revalidatePath("/pet-hotel");
}

export async function deleteRoomAction(roomId: string): Promise<{ error?: string }> {
  const user = await requireCapability("manage_rooms");
  if (!z.guid().safeParse(roomId).success) return { error: "Kandang tidak valid." };
  const result = await deleteRoom(user.id, roomId);
  if (result.error) return result;
  revalidatePath("/pet-hotel");
  await flash("Kandang dihapus");
  return {};
}

export async function searchPatientOptionsAction(query: string) {
  const user = await requireCapability("manage_admission");
  if (!can(user.role, "manage_patients")) return [];
  const { patients } = await searchPatients(query.slice(0, 80));
  return patients.slice(0, 30).map((p) => ({ id: p.id, name: p.name, detail: `${p.species} · ${p.owner.name}` }));
}
