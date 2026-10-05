"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { flash } from "@/components/flash";
import { costSchema } from "@/lib/cost-schema";
import { createCost, deleteCost, updateCost } from "@/lib/costs";
import { requireCapability } from "@/lib/require-role";

export type CostFormState = { message?: string; errors?: Record<string, string[] | undefined> };

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");

function parse(formData: FormData) {
  const raw = text(formData, "amount").trim();
  return costSchema.safeParse({ name: text(formData, "name"), amount: raw === "" ? Number.NaN : Number(raw), category: text(formData, "category"), costDate: text(formData, "costDate"), notes: text(formData, "notes") });
}

export async function saveCostAction(id: string | null, _prev: CostFormState, formData: FormData): Promise<CostFormState> {
  const user = await requireCapability("view_revenue_reports");
  const parsed = parse(formData);
  if (!parsed.success) return { message: "Periksa kembali isian yang ditandai.", errors: z.flattenError(parsed.error).fieldErrors };

  const result = id ? await updateCost(user.id, id, parsed.data) : await createCost(user.id, parsed.data);
  if ("error" in result) return { message: result.error };
  revalidatePath("/biaya-operasional");
  revalidatePath("/laba-rugi");
  await flash(id ? "Biaya diubah" : "Biaya dicatat");
  redirect("/biaya-operasional");
}

export async function deleteCostAction(id: string) {
  const user = await requireCapability("view_revenue_reports");
  await deleteCost(user.id, id);
  revalidatePath("/biaya-operasional");
  revalidatePath("/laba-rugi");
  await flash("Biaya dihapus");
}
