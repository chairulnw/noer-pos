"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { flash } from "@/components/flash";
import { EXAM, examinationSchema, type ExaminationType } from "@/lib/examination-schema";
import { addExaminationFile, createExamination, deleteExamination, getExamination, updateExamination } from "@/lib/examinations";
import { requireCapability } from "@/lib/require-role";

export type ExamFormState = { message?: string; ok?: boolean; nonce?: number; errors?: Record<string, string[] | undefined> };

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");
const fields = (formData: FormData) => ({ name: text(formData, "name"), performedAt: text(formData, "performedAt"), findings: text(formData, "findings"), notes: text(formData, "notes"), recordId: text(formData, "recordId") });

export async function createExamAction(type: ExaminationType, patientId: string, _prev: ExamFormState, formData: FormData): Promise<ExamFormState> {
  const user = await requireCapability("edit_medical_record");
  const parsed = examinationSchema(type).safeParse(fields(formData));
  if (!parsed.success) return { message: "Periksa kembali isian yang ditandai.", errors: z.flattenError(parsed.error).fieldErrors };

  const result = await createExamination(user.id, type, patientId, parsed.data);
  if ("error" in result) return { message: result.error };
  revalidatePath(EXAM[type].path);
  await flash(`${EXAM[type].title} dicatat`);
  redirect(`${EXAM[type].path}/${result.id}`);
}

export async function updateExamAction(id: string, _prev: ExamFormState, formData: FormData): Promise<ExamFormState> {
  const user = await requireCapability("edit_medical_record");
  const current = await getExamination(id);
  if (!current) return { message: "Data tidak ditemukan." };
  const parsed = examinationSchema(current.type).safeParse(fields(formData));
  if (!parsed.success) return { message: "Periksa kembali isian yang ditandai.", errors: z.flattenError(parsed.error).fieldErrors };

  const result = await updateExamination(user.id, id, parsed.data);
  if ("error" in result) return { message: result.error };
  revalidatePath(EXAM[current.type].path);
  await flash("Perubahan disimpan");
  redirect(`${EXAM[current.type].path}/${id}`);
}

export async function deleteExamAction(id: string) {
  const user = await requireCapability("edit_medical_record");
  const current = await getExamination(id);
  if (!current) redirect("/");
  await deleteExamination(user.id, id);
  revalidatePath(EXAM[current.type].path);
  await flash("Data dihapus");
  redirect(EXAM[current.type].path);
}

export async function addExamFileAction(id: string, _prev: ExamFormState, formData: FormData): Promise<ExamFormState> {
  const user = await requireCapability("edit_medical_record");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { message: "Pilih file terlebih dahulu." };

  const result = await addExaminationFile(user.id, id, file);
  if (result.error) return { message: result.error };
  const current = await getExamination(id);
  if (current) revalidatePath(`${EXAM[current.type].path}/${id}`);
  await flash("Lampiran diunggah");
  return { ok: true, nonce: Date.now() };
}
