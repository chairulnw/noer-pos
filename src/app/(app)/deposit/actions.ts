"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { flash } from "@/components/flash";
import { requireCapability } from "@/lib/require-role";
import { adjustWallet, topUp } from "@/lib/wallet";
import { adjustSchema, topUpSchema } from "@/lib/wallet-schema";

export type WalletFormState = { message?: string; errors?: Record<string, string[] | undefined> };

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");
const num = (formData: FormData, key: string) => {
  const raw = text(formData, key).trim();
  return raw === "" ? Number.NaN : Number(raw);
};

export async function topUpAction(_prev: WalletFormState, formData: FormData): Promise<WalletFormState> {
  const user = await requireCapability("manage_invoice_payment");
  const parsed = topUpSchema.safeParse({ ownerId: text(formData, "ownerId"), amount: num(formData, "amount"), method: text(formData, "method"), note: text(formData, "note") });
  if (!parsed.success) return { message: "Periksa kembali isian yang ditandai.", errors: z.flattenError(parsed.error).fieldErrors };

  const result = await topUp(user.id, parsed.data);
  if ("error" in result) return { message: result.error };
  revalidatePath("/deposit");
  revalidatePath("/pemilik");
  await flash("Top-up saldo dicatat");
  redirect(`/deposit?pemilik=${parsed.data.ownerId}`);
}

export async function adjustAction(_prev: WalletFormState, formData: FormData): Promise<WalletFormState> {
  const user = await requireCapability("correct_deposit");
  const parsed = adjustSchema.safeParse({ ownerId: text(formData, "ownerId"), delta: num(formData, "delta"), reason: text(formData, "reason") });
  if (!parsed.success) return { message: "Periksa kembali isian yang ditandai.", errors: z.flattenError(parsed.error).fieldErrors };

  const result = await adjustWallet(user.id, parsed.data);
  if ("error" in result) return { message: result.error };
  revalidatePath("/deposit");
  revalidatePath("/pemilik");
  await flash("Saldo dikoreksi");
  redirect(`/deposit?pemilik=${parsed.data.ownerId}`);
}
