"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { checkInSchema, logSchema } from "@/lib/admission-schema";
import { addAdmissionLog, createAdmission } from "@/lib/admissions";
import { requireCapability } from "@/lib/require-role";

export type AdmissionFormState = { message?: string; nonce?: number; errors?: Record<string, string[] | undefined> };

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");

export async function checkInAction(_prev: AdmissionFormState, formData: FormData): Promise<AdmissionFormState> {
  const user = await requireCapability("manage_admission");

  const parsed = checkInSchema.safeParse({
    patientId: text(formData, "patientId"),
    type: text(formData, "type"),
    roomId: text(formData, "roomId"),
    rateItemId: text(formData, "rateItemId"),
    checkIn: text(formData, "checkIn"),
    visitId: text(formData, "visitId"),
    notes: text(formData, "notes"),
  });
  if (!parsed.success) {
    return { message: "Periksa kembali isian yang ditandai.", errors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await createAdmission(user.id, parsed.data);
  if ("error" in result) return { message: result.error };

  revalidatePath("/rawat-inap");
  redirect("/rawat-inap");
}

export async function addLogAction(admissionId: string, _prev: AdmissionFormState, formData: FormData): Promise<AdmissionFormState> {
  const user = await requireCapability("monitor_admission");
  const temp = text(formData, "temp").trim().replace(",", ".");

  const parsed = logSchema.safeParse({
    loggedAt: text(formData, "loggedAt"),
    temp: temp === "" ? null : Number(temp),
    intake: text(formData, "intake"),
    note: text(formData, "note"),
  });
  if (!parsed.success) {
    return { message: "Periksa kembali isian yang ditandai.", errors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await addAdmissionLog(user.id, admissionId, parsed.data);
  if (result.error) return { message: result.error };

  revalidatePath(`/rawat-inap/${admissionId}`);
  return { nonce: Date.now() };
}
