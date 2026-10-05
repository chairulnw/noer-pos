"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCapability } from "@/lib/require-role";
import { getSettings, saveSettings } from "@/lib/settings";
import { IMAGE_LIMITS, imageToDataUrl, settingsSchema } from "@/lib/settings-schema";
import { flash } from "@/components/flash";

export type SettingsState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");

export async function updateSettings(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const user = await requireCapability("manage_users_settings");
  const current = await getSettings();

  const images = { logo: current.logo, qris: current.qris };
  const errors: Record<string, string[]> = {};
  for (const key of ["logo", "qris"] as const) {
    const file = formData.get(`${key}File`);
    if (!(file instanceof File) || file.size === 0) continue;
    const result = await imageToDataUrl(file, IMAGE_LIMITS[key]);
    if (result.error !== undefined) errors[key] = [result.error];
    else images[key] = result.dataUrl;
  }

  const parsed = settingsSchema.safeParse({
    clinicName: text(formData, "clinicName"),
    address: text(formData, "address"),
    phone: text(formData, "phone"),
    npwp: text(formData, "npwp"),
    receiptFooter: text(formData, "receiptFooter"),
    taxEnabled: formData.get("taxEnabled") === "on",
    taxRate: Number(text(formData, "taxRate")),
    taxMode: text(formData, "taxMode"),
    paperWidth: formData.has("paperWidth") ? Number(text(formData, "paperWidth")) : current.paperWidth,
    expiryWarningDays: Number(text(formData, "expiryWarningDays")),
    quickSubjective: text(formData, "quickSubjective"),
    quickObjective: text(formData, "quickObjective"),
    quickAssessment: text(formData, "quickAssessment"),
    quickPlan: text(formData, "quickPlan"),
    ...images,
  });

  if (!parsed.success) {
    return { message: "Periksa kembali isian yang ditandai.", errors: { ...z.flattenError(parsed.error).fieldErrors, ...errors } };
  }
  if (Object.keys(errors).length > 0) return { message: "Periksa kembali isian yang ditandai.", errors };

  const changes = await saveSettings(user.id, parsed.data);
  revalidatePath("/", "layout");
  if (changes.length) await flash("Pengaturan disimpan");
  return { ok: true, message: changes.length ? "Pengaturan disimpan." : "Tidak ada perubahan." };
}
