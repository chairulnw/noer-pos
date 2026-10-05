"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { flash } from "@/components/flash";
import { breedSchema, speciesSchema } from "@/lib/animal-schema";
import { saveBreed, saveSpecies } from "@/lib/animals";
import { requireCapability } from "@/lib/require-role";

export type MasterFormState = { message?: string; errors?: Record<string, string[] | undefined> };

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");

export async function saveSpeciesAction(id: string | null, _prev: MasterFormState, formData: FormData): Promise<MasterFormState> {
  await requireCapability("manage_users_settings");
  const parsed = speciesSchema.safeParse({ name: text(formData, "name"), active: formData.get("active") === "on" });
  if (!parsed.success) return { message: "Periksa kembali isian yang ditandai.", errors: z.flattenError(parsed.error).fieldErrors };
  const result = await saveSpecies(id, parsed.data);
  if ("error" in result) return { message: result.error, errors: { name: [result.error] } };
  revalidatePath("/master/jenis-hewan");
  revalidatePath("/master/ras-hewan");
  revalidatePath("/pasien");
  await flash("Jenis hewan disimpan");
  redirect("/master/jenis-hewan");
}

export async function saveBreedAction(id: string | null, _prev: MasterFormState, formData: FormData): Promise<MasterFormState> {
  await requireCapability("manage_users_settings");
  const parsed = breedSchema.safeParse({ speciesId: text(formData, "speciesId"), name: text(formData, "name"), active: formData.get("active") === "on" });
  if (!parsed.success) return { message: "Periksa kembali isian yang ditandai.", errors: z.flattenError(parsed.error).fieldErrors };
  const result = await saveBreed(id, parsed.data);
  if ("error" in result) return { message: result.error, errors: { name: [result.error] } };
  revalidatePath("/master/ras-hewan");
  revalidatePath("/pasien");
  await flash("Ras hewan disimpan");
  redirect("/master/ras-hewan");
}
