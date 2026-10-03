"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { receiveStock } from "@/lib/inventory";
import { requireCapability } from "@/lib/require-role";
import { stockInSchema } from "@/lib/stock-schema";
import { flash } from "@/components/flash";

export type StockFormState = { message?: string; errors?: Record<string, string[] | undefined> };

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");
const num = (formData: FormData, key: string) => {
  const value = text(formData, key).trim().replace(",", ".");
  return value === "" ? null : Number(value);
};

export async function receiveStockAction(_prev: StockFormState, formData: FormData): Promise<StockFormState> {
  const user = await requireCapability("manage_stock");

  const parsed = stockInSchema.safeParse({
    itemId: text(formData, "itemId"),
    qty: num(formData, "qty"),
    batchNo: text(formData, "batchNo"),
    expiry: text(formData, "expiry"),
    price: num(formData, "price"),
    note: text(formData, "note"),
  });
  if (!parsed.success) {
    return { message: "Periksa kembali isian yang ditandai.", errors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await receiveStock(user.id, parsed.data);
  if (result.error) return { message: result.error };

  revalidatePath("/inventaris");
  await flash("Stok masuk dicatat");
  redirect(`/inventaris/${parsed.data.itemId}`);
}
