"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { cashClosingSchema } from "@/lib/cash-schema";
import { closeCash } from "@/lib/cash";
import { requireCapability } from "@/lib/require-role";
import { flash } from "@/components/flash";

export type CashFormState = {
  ok?: boolean;
  message?: string;
  needsNote?: boolean;
  errors?: Record<string, string[] | undefined>;
};

const num = (formData: FormData, key: string) => {
  const raw = String(formData.get(key) ?? "").trim();
  return raw === "" ? Number.NaN : Number(raw);
};

export async function closeCashAction(_prev: CashFormState, formData: FormData): Promise<CashFormState> {
  const user = await requireCapability("close_cash");
  const parsed = cashClosingSchema.safeParse({
    openingCash: num(formData, "openingCash"),
    countedCash: num(formData, "countedCash"),
    note: String(formData.get("note") ?? ""),
  });
  if (!parsed.success) return { message: "Periksa kembali isian yang ditandai.", errors: z.flattenError(parsed.error).fieldErrors };

  const result = await closeCash(user.id, parsed.data);
  if ("error" in result) return { message: result.error };
  if (result.needsNote && result.difference !== undefined) {
    const direction = result.difference > 0 ? "lebih" : "kurang";
    return { needsNote: true, message: `Ada selisih ${direction} Rp ${Math.abs(result.difference).toLocaleString("id-ID")}. Hitung ulang uang fisik, atau isi catatan alasan lalu tutup kas lagi.`, errors: { note: ["Wajib diisi bila ada selisih."] } };
  }

  revalidatePath("/tutup-kas");
  await flash("Kas ditutup");
  return { ok: true };
}
