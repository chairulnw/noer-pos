"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCapability } from "@/lib/require-role";
import { addAddendum, addAttachment, addVaccination, finalizeRecord, removeVaccination, saveRecord } from "@/lib/records";
import { addendumSchema, recordItemsSchema, recordSchema, vaccinationSchema } from "@/lib/record-schema";

export type RecordFormState = { message?: string; ok?: boolean; nonce?: number; errors?: Record<string, string[] | undefined> };

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");
const num = (formData: FormData, key: string) => {
  const value = text(formData, key).trim().replace(",", ".");
  return value === "" ? null : Number(value);
};
const invalid = (error: z.ZodError): RecordFormState => ({
  message: "Periksa kembali isian yang ditandai.",
  errors: z.flattenError(error).fieldErrors,
});

export async function saveRecordAction(
  visitId: string,
  recordId: string,
  _prev: RecordFormState,
  formData: FormData,
): Promise<RecordFormState> {
  const user = await requireCapability("edit_medical_record");

  const parsed = recordSchema.safeParse({
    subjective: text(formData, "subjective"),
    objective: text(formData, "objective"),
    assessment: text(formData, "assessment"),
    plan: text(formData, "plan"),
    diagnosis: text(formData, "diagnosis"),
    vitals: {
      temp: num(formData, "temp"),
      hr: num(formData, "hr"),
      rr: num(formData, "rr"),
      weight: num(formData, "weight"),
      bcs: num(formData, "bcs"),
      crt: num(formData, "crt"),
    },
  });
  const itemIds = formData.getAll("itemId").map(String);
  const qtys = formData.getAll("qty").map((q) => Number(String(q).replace(",", ".")));
  const instructions = formData.getAll("instruction").map(String);
  const items = recordItemsSchema.safeParse(itemIds.map((itemId, i) => ({ itemId, qty: qtys[i], instruction: instructions[i] ?? "" })));
  if (!items.success) {
    return { message: items.error.issues[0]?.message ?? "Item tidak valid.", errors: { items: [items.error.issues[0]?.message ?? "Item tidak valid"] } };
  }

  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    const vitalErrors = Object.fromEntries(
      parsed.error.issues.filter((i) => i.path[0] === "vitals").map((i) => [String(i.path[1]), [i.message]]),
    );
    return { message: "Periksa kembali isian yang ditandai.", errors: { ...flat.fieldErrors, ...vitalErrors } };
  }

  revalidatePath(`/rekam-medis/${visitId}`);
  if (formData.get("intent") === "finalize") {
    const result = await finalizeRecord(user.id, recordId, parsed.data, items.data);
    return result.error ? { message: result.error } : { ok: true, message: "Rekam medis difinalkan." };
  }

  const result = await saveRecord(recordId, parsed.data, items.data);
  return result.error ? { message: result.error } : { ok: true, message: "Draft tersimpan." };
}

export async function addVaccinationAction(visitId: string, recordId: string, _prev: RecordFormState, formData: FormData): Promise<RecordFormState> {
  await requireCapability("edit_medical_record");
  const parsed = vaccinationSchema.safeParse({
    itemId: text(formData, "itemId"),
    batchNo: text(formData, "batchNo"),
    givenAt: text(formData, "givenAt"),
    nextDue: text(formData, "nextDue"),
  });
  if (!parsed.success) return invalid(parsed.error);

  const result = await addVaccination(recordId, parsed.data);
  if (result.error) return { message: result.error };
  revalidatePath(`/rekam-medis/${visitId}`);
  return { ok: true, nonce: Date.now() };
}

export async function removeVaccinationAction(visitId: string, id: string) {
  await requireCapability("edit_medical_record");
  await removeVaccination(id);
  revalidatePath(`/rekam-medis/${visitId}`);
}

export async function addAddendumAction(visitId: string, recordId: string, _prev: RecordFormState, formData: FormData): Promise<RecordFormState> {
  const user = await requireCapability("edit_medical_record");
  const parsed = addendumSchema.safeParse({ note: text(formData, "note") });
  if (!parsed.success) return invalid(parsed.error);

  const result = await addAddendum(user.id, recordId, parsed.data.note);
  if (result.error) return { message: result.error };
  revalidatePath(`/rekam-medis/${visitId}`);
  return { ok: true, nonce: Date.now() };
}

export async function addAttachmentAction(visitId: string, recordId: string, _prev: RecordFormState, formData: FormData): Promise<RecordFormState> {
  await requireCapability("edit_medical_record");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { message: "Pilih file terlebih dahulu." };

  const result = await addAttachment(recordId, file);
  if (result.error) return { message: result.error };
  revalidatePath(`/rekam-medis/${visitId}`);
  return { ok: true, nonce: Date.now() };
}
