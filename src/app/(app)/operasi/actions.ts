"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { flash } from "@/components/flash";
import { addSurgeryAddendum, changeSurgeryStatus, createSurgery, updateSurgery } from "@/lib/surgeries";
import { addendumSchema, surgerySchema, type SurgeryStatus } from "@/lib/surgery-schema";
import { requireCapability } from "@/lib/require-role";

export type SurgeryFormState = { message?: string; ok?: boolean; nonce?: number; errors?: Record<string, string[] | undefined> };

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");
const fields = (formData: FormData) => ({ procedure: text(formData, "procedure"), anesthesia: text(formData, "anesthesia"), surgeryDate: text(formData, "surgeryDate"), doctorId: text(formData, "doctorId"), serviceItemId: text(formData, "serviceItemId"), preNotes: text(formData, "preNotes") });

export async function createSurgeryAction(patientId: string, _prev: SurgeryFormState, formData: FormData): Promise<SurgeryFormState> {
  const user = await requireCapability("edit_medical_record");
  const parsed = surgerySchema.safeParse(fields(formData));
  if (!parsed.success) return { message: "Periksa kembali isian yang ditandai.", errors: z.flattenError(parsed.error).fieldErrors };
  const result = await createSurgery(user.id, patientId, parsed.data);
  if ("error" in result) return { message: result.error };
  revalidatePath("/operasi");
  await flash("Jadwal operasi dicatat");
  redirect(`/operasi/${result.id}`);
}

export async function updateSurgeryAction(id: string, _prev: SurgeryFormState, formData: FormData): Promise<SurgeryFormState> {
  const user = await requireCapability("edit_medical_record");
  const parsed = surgerySchema.safeParse(fields(formData));
  if (!parsed.success) return { message: "Periksa kembali isian yang ditandai.", errors: z.flattenError(parsed.error).fieldErrors };
  const result = await updateSurgery(user.id, id, parsed.data);
  if ("error" in result) return { message: result.error };
  revalidatePath("/operasi");
  await flash("Perubahan disimpan");
  redirect(`/operasi/${id}`);
}

export async function changeStatusAction(id: string, to: SurgeryStatus, _prev: SurgeryFormState, formData: FormData): Promise<SurgeryFormState> {
  const user = await requireCapability("edit_medical_record");
  const result = await changeSurgeryStatus(user.id, id, to, text(formData, "postNotes"));
  if ("error" in result && result.error) return { message: result.error };
  revalidatePath("/operasi");
  revalidatePath(`/operasi/${id}`);
  revalidatePath("/kasir");
  await flash(to === "SELESAI" ? "Operasi selesai, tagihan dibuat" : to === "BATAL" ? "Operasi dibatalkan" : "Operasi dimulai");
  return { ok: true, nonce: Date.now() };
}

export async function addAddendumAction(id: string, _prev: SurgeryFormState, formData: FormData): Promise<SurgeryFormState> {
  const user = await requireCapability("edit_medical_record");
  const parsed = addendumSchema.safeParse({ note: text(formData, "note") });
  if (!parsed.success) return { message: parsed.error.issues[0]?.message, errors: z.flattenError(parsed.error).fieldErrors };
  const result = await addSurgeryAddendum(user.id, id, parsed.data.note);
  if ("error" in result && result.error) return { message: result.error };
  revalidatePath(`/operasi/${id}`);
  await flash("Addendum ditambahkan");
  return { ok: true, nonce: Date.now() };
}
