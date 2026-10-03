"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { addInvoiceItem, correctDeposit, createReplacementInvoice, createRetailInvoice, payInvoice, receiveDeposit, removeInvoiceItem, setInvoiceDiscount, updateInvoiceItem, voidInvoice } from "@/lib/invoice-ops";
import { correctDepositSchema, depositSchema, discountSchema, lineSchema, paySchema, voidSchema, type DepositInput, type Discount, type PayInput, type VoidInput } from "@/lib/invoice-schema";
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

export async function voidAction(invoiceId: string, input: VoidInput): Promise<ActionResult> {
  const user = await requireCapability("void_invoice");
  const parsed = voidSchema.safeParse(input);
  if (!parsed.success || !id.safeParse(invoiceId).success) return parsed.success ? { error: "Data tidak valid." } : invalid(parsed.error);
  const result = await voidInvoice(user.id, invoiceId, parsed.data);
  revalidatePath("/invoice");
  revalidatePath("/pembayaran");
  refresh(invoiceId);
  return "error" in result ? { error: result.error } : { ok: true };
}

export async function replacementAction(invoiceId: string) {
  const user = await requireCapability("manage_invoice_payment");
  if (!id.safeParse(invoiceId).success) redirect("/invoice");
  const result = await createReplacementInvoice(user.id, invoiceId);
  if ("error" in result) redirect(`/invoice/${invoiceId}?error=${encodeURIComponent(result.error)}`);
  revalidatePath("/invoice");
  redirect(`/invoice/${result.id}`);
}

export async function markReceiptPrintedAction(invoiceId: string) {
  await requireCapability("manage_invoice_payment");
  if (!id.safeParse(invoiceId).success) return;
  await prisma.invoice.updateMany({ where: { id: invoiceId, status: "FINAL" }, data: { receiptPrints: { increment: 1 } } });
  revalidatePath(`/invoice/${invoiceId}/struk`);
}

export async function depositAction(invoiceId: string, input: DepositInput): Promise<ActionResult> {
  const user = await requireCapability("manage_invoice_payment");
  const parsed = depositSchema.safeParse(input);
  if (!parsed.success || !id.safeParse(invoiceId).success) return parsed.success ? { error: "Data tidak valid." } : invalid(parsed.error);
  const { amount, method, cashReceived, reference } = parsed.data;
  const result = await receiveDeposit(user.id, invoiceId, amount, method, cashReceived, reference);
  revalidatePath("/invoice");
  revalidatePath("/pembayaran");
  refresh(invoiceId);
  return "error" in result ? { error: result.error } : { ok: true, change: result.change };
}

export async function correctDepositAction(invoiceId: string, amount: number, reason: string): Promise<ActionResult> {
  const user = await requireCapability("correct_deposit");
  const parsed = correctDepositSchema.safeParse({ amount, reason });
  if (!parsed.success || !id.safeParse(invoiceId).success) return parsed.success ? { error: "Data tidak valid." } : invalid(parsed.error);
  const result = await correctDeposit(user.id, invoiceId, parsed.data.amount, parsed.data.reason);
  revalidatePath("/pembayaran");
  refresh(invoiceId);
  return "error" in result ? { error: result.error } : { ok: true };
}
