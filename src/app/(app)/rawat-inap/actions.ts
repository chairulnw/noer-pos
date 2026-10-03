"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { checkInSchema, checkOutSchema, logSchema } from "@/lib/admission-schema";
import { addAdmissionLog, checkOutAdmission, createAdmission } from "@/lib/admissions";
import { can } from "@/lib/permissions";
import { requireCapability } from "@/lib/require-role";
import { flash } from "@/components/flash";

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
  await flash("Check-in dicatat");
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
  await flash("Monitoring dicatat");
  return { nonce: Date.now() };
}

export async function checkOutAction(admissionId: string, _prev: AdmissionFormState, formData: FormData): Promise<AdmissionFormState> {
  const user = await requireCapability("manage_admission");
  const parsed = checkOutSchema.safeParse({ checkOut: text(formData, "checkOut") });
  if (!parsed.success) return { message: parsed.error.issues[0]?.message ?? "Waktu keluar tidak valid." };

  const result = await checkOutAdmission(user.id, admissionId, parsed.data.checkOut);
  if ("error" in result) return { message: result.error };

  revalidatePath("/rawat-inap");
  revalidatePath("/invoice");
  await flash("Check-out selesai");
  redirect(can(user.role, "manage_invoice_payment") ? `/invoice/${result.invoiceId}` : "/rawat-inap");
}
