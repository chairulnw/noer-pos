"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addInvoiceItem, createRetailInvoice, setInvoiceCustomer } from "@/lib/invoice-ops";
import { listOwners } from "@/lib/patients";
import { requireCapability } from "@/lib/require-role";

const id = z.guid();

export type PosResult = { error?: string; invoiceId?: string };

export async function posAddAction(invoiceId: string | null, itemId: string): Promise<PosResult> {
  const user = await requireCapability("manage_invoice_payment");
  if ((invoiceId !== null && !id.safeParse(invoiceId).success) || !id.safeParse(itemId).success) return { error: "Data tidak valid." };

  const target = invoiceId ?? (await createRetailInvoice(user.id, ""));
  const result = await addInvoiceItem(target, itemId, 1);
  revalidatePath("/kasir");
  revalidatePath("/invoice");
  return "error" in result ? { error: result.error, invoiceId: target } : { invoiceId: target };
}

export async function posCustomerAction(invoiceId: string, ownerId: string | null): Promise<PosResult> {
  await requireCapability("manage_invoice_payment");
  if (!id.safeParse(invoiceId).success || (ownerId !== null && !id.safeParse(ownerId).success)) return { error: "Data tidak valid." };
  const result = await setInvoiceCustomer(invoiceId, ownerId);
  revalidatePath("/kasir");
  return "error" in result ? { error: result.error } : {};
}

export async function searchOwnersAction(query: string) {
  await requireCapability("manage_invoice_payment");
  if (query.trim().length < 2) return [];
  return (await listOwners(query)).slice(0, 8).map((o) => ({ id: o.id, name: o.name, whatsapp: o.whatsapp, pets: o.pets }));
}
