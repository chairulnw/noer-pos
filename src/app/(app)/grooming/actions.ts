"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { flash } from "@/components/flash";
import { groomingSchema, type GroomingStatus } from "@/lib/grooming-schema";
import { changeGroomingStatus, createGrooming } from "@/lib/groomings";
import { requireCapability } from "@/lib/require-role";

export type GroomingFormState = { message?: string; errors?: Record<string, string[] | undefined> };

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");

export async function createGroomingAction(patientId: string, _prev: GroomingFormState, formData: FormData): Promise<GroomingFormState> {
  const user = await requireCapability("create_visit");
  const parsed = groomingSchema.safeParse({ groomingDate: text(formData, "groomingDate"), serviceItemId: text(formData, "serviceItemId"), notes: text(formData, "notes") });
  if (!parsed.success) return { message: "Periksa kembali isian yang ditandai.", errors: z.flattenError(parsed.error).fieldErrors };
  const result = await createGrooming(user.id, patientId, parsed.data);
  if ("error" in result) return { message: result.error };
  revalidatePath("/grooming");
  await flash("Grooming dicatat");
  redirect(`/grooming/${result.id}`);
}

export async function changeGroomingStatusAction(id: string, to: GroomingStatus): Promise<GroomingFormState> {
  const user = await requireCapability("create_visit");
  const result = await changeGroomingStatus(user.id, id, to);
  if ("error" in result) return { message: result.error };
  revalidatePath("/grooming");
  revalidatePath(`/grooming/${id}`);
  revalidatePath("/kasir");
  await flash(to === "SELESAI" ? "Grooming selesai, tagihan dibuat" : to === "BATAL" ? "Grooming dibatalkan" : "Grooming dimulai");
  return {};
}
