"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { saveItem } from "@/lib/items";
import { capabilityFor, itemSchema } from "@/lib/item-schema";
import { can } from "@/lib/permissions";
import { requireUser } from "@/lib/require-role";
import { flash } from "@/components/flash";

export type FormState = {
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");
const num = (formData: FormData, key: string) => {
  const value = text(formData, key).trim().replace(",", ".");
  return value === "" ? null : Number(value);
};

export async function saveItemAction(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const type = text(formData, "type");

  const parsed = itemSchema.safeParse({
    type,
    category: text(formData, "category"),
    name: text(formData, "name"),
    sku: text(formData, "sku"),
    barcode: text(formData, "barcode"),
    sellPrice: num(formData, "sellPrice"),
    buyPrice: type === "SERVICE" ? 0 : num(formData, "buyPrice"),
    baseUnit: text(formData, "baseUnit"),
    purchaseUnit: text(formData, "purchaseUnit"),
    conversionFactor: num(formData, "conversionFactor") ?? 1,
    lowStockThreshold: num(formData, "lowStockThreshold"),
    trackExpiry: formData.get("trackExpiry") === "on",
    billingUnit: formData.get("perDay") === "on" ? "PER_DAY" : "PER_ITEM",
    vaccineIntervalDays: num(formData, "vaccineIntervalDays"),
    active: formData.get("active") === "on",
  });

  if (!parsed.success) {
    return { message: "Periksa kembali isian yang ditandai.", errors: z.flattenError(parsed.error).fieldErrors };
  }
  if (!can(user.role, capabilityFor(parsed.data.type))) redirect("/forbidden");

  const result = await saveItem(user.id, id, parsed.data);
  if (result.error) return { message: result.error };

  revalidatePath("/master-data/item");
  await flash("Item tersimpan");
  redirect("/master-data/item");
}
