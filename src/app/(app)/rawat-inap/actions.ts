"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { checkInSchema } from "@/lib/admission-schema";
import { createAdmission } from "@/lib/admissions";
import { requireCapability } from "@/lib/require-role";

export type AdmissionFormState = { message?: string; errors?: Record<string, string[] | undefined> };

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
