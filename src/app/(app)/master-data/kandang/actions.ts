"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { roomSchema, saveRoom } from "@/lib/rooms";
import { requireCapability } from "@/lib/require-role";
import { flash } from "@/components/flash";

export type RoomFormState = {
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

export async function saveRoomAction(id: string | null, _prev: RoomFormState, formData: FormData): Promise<RoomFormState> {
  const user = await requireCapability("manage_rooms");

  const parsed = roomSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    type: String(formData.get("type") ?? ""),
    active: formData.get("active") === "on",
    capacity: Number(formData.get("capacity") || 0),
    dailyRate: Number(formData.get("dailyRate") || 0),
    suitableFor: String(formData.get("suitableFor") ?? ""),
  });
  if (!parsed.success) {
    return { message: "Periksa kembali isian yang ditandai.", errors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await saveRoom(user.id, id, parsed.data);
  if (result.error) return { message: result.error };

  revalidatePath("/master-data/kandang");
  await flash("Kandang tersimpan");
  redirect("/master-data/kandang");
}
