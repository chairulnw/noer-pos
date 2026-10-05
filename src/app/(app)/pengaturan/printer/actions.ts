"use server";

import { revalidatePath } from "next/cache";
import { flash } from "@/components/flash";
import { requireCapability } from "@/lib/require-role";
import { getSettings, saveSettings } from "@/lib/settings";

export type PrinterState = { message?: string };

export async function savePrinterAction(_prev: PrinterState, formData: FormData): Promise<PrinterState> {
  const user = await requireCapability("manage_users_settings");
  const width = Number(formData.get("paperWidth"));
  if (width !== 58 && width !== 80) return { message: "Pilih ukuran kertas 58 mm atau 80 mm." };

  const current = await getSettings();
  await saveSettings(user.id, { ...current, paperWidth: width });
  revalidatePath("/", "layout");
  await flash("Pengaturan printer disimpan");
  return { message: "Tersimpan." };
}
