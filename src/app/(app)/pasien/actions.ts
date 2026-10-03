"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { deleteOwner, deletePatient, saveOwner, savePatient } from "@/lib/patients";
import { ownerSchema, patientSchema } from "@/lib/patient-schema";
import { requireCapability } from "@/lib/require-role";
import { flash } from "@/components/flash";

export type PatientFormState = {
  message?: string;
  duplicate?: string;
  errors?: Record<string, string[] | undefined>;
};

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");
const num = (formData: FormData, key: string) => {
  const value = text(formData, key).trim().replace(",", ".");
  return value === "" ? null : Number(value);
};
const invalid = (error: z.ZodError): PatientFormState => ({
  message: "Periksa kembali isian yang ditandai.",
  errors: z.flattenError(error).fieldErrors,
});

export async function saveOwnerAction(id: string | null, _prev: PatientFormState, formData: FormData): Promise<PatientFormState> {
  await requireCapability("manage_patients");

  const parsed = ownerSchema.safeParse({
    name: text(formData, "name"),
    whatsapp: text(formData, "whatsapp"),
    address: text(formData, "address"),
    notes: text(formData, "notes"),
  });
  if (!parsed.success) return invalid(parsed.error);

  const result = await saveOwner(id, parsed.data, formData.get("confirmDuplicate") === "1");
  if (result.duplicate !== undefined) return { duplicate: result.duplicate };
  if (result.id === undefined) return { message: result.error };

  revalidatePath("/pasien");
  await flash("Owner tersimpan");
  redirect(`/pasien/owner/${result.id}`);
}

export async function savePatientAction(
  ownerId: string,
  id: string | null,
  _prev: PatientFormState,
  formData: FormData,
): Promise<PatientFormState> {
  await requireCapability("manage_patients");

  const parsed = patientSchema.safeParse({
    name: text(formData, "name"),
    species: text(formData, "species"),
    breed: text(formData, "breed"),
    sex: text(formData, "sex"),
    birthDate: text(formData, "birthDate"),
    ageYears: num(formData, "ageYears"),
    ageMonths: num(formData, "ageMonths"),
    microchip: text(formData, "microchip"),
    color: text(formData, "color"),
    neutered: formData.get("neutered") === "on",
    lastWeightKg: num(formData, "lastWeightKg"),
    allergyNote: text(formData, "allergyNote"),
    aggressive: formData.get("aggressive") === "on",
    behaviorNote: text(formData, "behaviorNote"),
  });
  if (!parsed.success) return invalid(parsed.error);

  const result = await savePatient(ownerId, id, parsed.data);
  if (result.id === undefined) return { message: result.error };

  revalidatePath("/pasien");
  await flash("Pasien tersimpan");
  redirect(`/pasien?id=${result.id}`);
}

export async function deletePatientAction(id: string) {
  await requireCapability("manage_patients");
  await deletePatient(id);
  revalidatePath("/pasien");
  await flash("Pasien dihapus");
  redirect("/pasien");
}

export async function deleteOwnerAction(id: string) {
  await requireCapability("manage_patients");
  const result = await deleteOwner(id);
  if (result.error) redirect(`/pasien/owner/${id}/ubah?error=${encodeURIComponent(result.error)}`);
  revalidatePath("/pasien");
  await flash("Owner dihapus");
  redirect("/pasien");
}
