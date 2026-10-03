"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { addInvoiceItem, createRetailInvoice, payInvoice, removeInvoiceItem, setInvoiceDiscount, updateInvoiceItem } from "@/lib/invoice-ops";
import { discountSchema, lineSchema, paySchema, type Discount, type PayInput } from "@/lib/invoice-schema";
import { requireCapability } from "@/lib/require-role";

export type ActionResult = { error?: string; ok?: boolean; change?: number };

const id = z.uuid();
const refresh = (invoiceId: string) => revalidatePath(`/invoice/${invoiceId}`);
const invalid = (error: z.ZodError): ActionResult => ({ error: error.issues[0]?.message ?? "Isian tidak valid." });

export async function addItemAction(invoiceId: string, itemId: string): Promise<ActionResult> {
  await requireCapability("manage_invoice_payment");
  if (!id.safeParse(invoiceId).success || !id.safeParse(itemId).success) return { error: "Data tidak valid." };
  const result = await addInvoiceItem(invoiceId, itemId, 1);
  refresh(invoiceId);
  return "error" in result ? { error: result.error } : { ok: true };
}

export async function updateItemAction(invoiceId: string, lineId: string, qty: number, discount: Discount): Promise<ActionResult> {
  const user = await requireCapability("apply_discount");
  const parsed = lineSchema.safeParse({ qty, discount });
  if (!parsed.success || !id.safeParse(invoiceId).success || !id.safeParse(lineId).success) return parsed.success ? { error: "Data tidak valid." } : invalid(parsed.error);
  const result = await updateInvoiceItem(user.id, invoiceId, lineId, parsed.data.qty, parsed.data.discount);
  refresh(invoiceId);
  return "error" in result ? { error: result.error } : { ok: true };
}

export async function removeItemAction(invoiceId: string, lineId: string): Promise<ActionResult> {
  await requireCapability("manage_invoice_payment");
  if (!id.safeParse(invoiceId).success || !id.safeParse(lineId).success) return { error: "Data tidak valid." };
  const result = await removeInvoiceItem(invoiceId, lineId);
  refresh(invoiceId);
  return "error" in result ? { error: result.error } : { ok: true };
}

export async function setDiscountAction(invoiceId: string, discount: Discount): Promise<ActionResult> {
  const user = await requireCapability("apply_discount");
  const parsed = discountSchema.safeParse(discount);
  if (!parsed.success || !id.safeParse(invoiceId).success) return parsed.success ? { error: "Data tidak valid." } : invalid(parsed.error);
  const result = await setInvoiceDiscount(user.id, invoiceId, parsed.data);
  refresh(invoiceId);
  return "error" in result ? { error: result.error } : { ok: true };
}

export async function payAction(invoiceId: string, pay: PayInput): Promise<ActionResult> {
  const user = await requireCapability("manage_invoice_payment");
  const parsed = paySchema.safeParse(pay);
  if (!parsed.success || !id.safeParse(invoiceId).success) return parsed.success ? { error: "Data tidak valid." } : invalid(parsed.error);
  const result = await payInvoice(user.id, invoiceId, parsed.data);
  revalidatePath("/invoice");
  refresh(invoiceId);
  return "error" in result ? { error: result.error } : { ok: true, change: result.change };
}

export async function createRetailAction(formData: FormData) {
  const user = await requireCapability("manage_invoice_payment");
  const name = String(formData.get("customerName") ?? "").trim().slice(0, 100);
  const invoiceId = await createRetailInvoice(user.id, name);
  revalidatePath("/invoice");
  redirect(`/invoice/${invoiceId}`);
}
