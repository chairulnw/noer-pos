"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { flash } from "@/components/flash";
import { appointmentSchema, jakartaYmd } from "@/lib/appointment-calc";
import { jakartaLocalToDate } from "@/lib/admission-calc";
import { cancelAppointment, createAppointment, startVisitFromAppointment, updateAppointment } from "@/lib/appointments";
import { can } from "@/lib/permissions";
import { requireCapability } from "@/lib/require-role";

export type AppointmentFormState = { message?: string; conflict?: string[]; errors?: Record<string, string[] | undefined> };

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");

function parse(formData: FormData) {
  return appointmentSchema.safeParse({ doctorId: text(formData, "doctorId"), scheduledAt: text(formData, "scheduledAt"), purpose: text(formData, "purpose"), notes: text(formData, "notes") });
}

async function finish(result: { error: string } | { conflict: string[] } | { id: string }, scheduledAt: string, message: string): Promise<AppointmentFormState> {
  if ("error" in result) return { message: result.error };
  if ("conflict" in result) return { conflict: result.conflict };
  revalidatePath("/janji-temu");
  await flash(message);
  redirect(`/janji-temu?tanggal=${jakartaYmd(jakartaLocalToDate(scheduledAt))}`);
}

export async function createAppointmentAction(patientId: string, _prev: AppointmentFormState, formData: FormData): Promise<AppointmentFormState> {
  const user = await requireCapability("create_visit");
  const parsed = parse(formData);
  if (!parsed.success) return { message: "Periksa kembali isian yang ditandai.", errors: z.flattenError(parsed.error).fieldErrors };
  const result = await createAppointment(user.id, patientId, parsed.data, formData.get("confirmConflict") === "1");
  return finish(result, parsed.data.scheduledAt, "Janji temu dicatat");
}

export async function updateAppointmentAction(id: string, _prev: AppointmentFormState, formData: FormData): Promise<AppointmentFormState> {
  await requireCapability("create_visit");
  const parsed = parse(formData);
  if (!parsed.success) return { message: "Periksa kembali isian yang ditandai.", errors: z.flattenError(parsed.error).fieldErrors };
  const result = await updateAppointment(id, parsed.data, formData.get("confirmConflict") === "1");
  return finish(result, parsed.data.scheduledAt, "Janji temu diubah");
}

export async function cancelAppointmentAction(id: string) {
  const user = await requireCapability("create_visit");
  await cancelAppointment(user.id, id);
  revalidatePath("/janji-temu");
  await flash("Janji temu dibatalkan");
}

export async function startVisitAction(id: string) {
  const user = await requireCapability("create_visit");
  const result = await startVisitFromAppointment(user.id, id);
  revalidatePath("/janji-temu");
  revalidatePath("/kunjungan");
  if (result.error !== undefined) {
    await flash(result.error);
    return;
  }
  await flash("Kunjungan dimulai dari janji temu");
  redirect(can(user.role, "view_medical_record") ? `/rekam-medis/${result.visitId}` : "/kunjungan");
}
