"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createOpname, finalizeOpname, saveOpname } from "@/lib/opname";
import { opnameRowsSchema, type OpnameRowInput } from "@/lib/opname-schema";
import { requireCapability } from "@/lib/require-role";

export type OpnameResult = { error?: string; ok?: boolean };

export async function createOpnameAction(formData: FormData) {
  const user = await requireCapability("manage_stock");
  const note = String(formData.get("note") ?? "").trim().slice(0, 300);
  const result = await createOpname(user.id, note);
  if (result.error) redirect(`/inventaris/opname?error=${encodeURIComponent(result.error)}`);
  revalidatePath("/inventaris/opname");
  redirect(`/inventaris/opname/${result.id}`);
}

async function run(opnameId: string, rows: OpnameRowInput[], finalize: boolean): Promise<OpnameResult> {
  const user = await requireCapability("manage_stock");
  const parsed = opnameRowsSchema.safeParse(rows);
  if (!parsed.success || !z.uuid().safeParse(opnameId).success) return { error: parsed.success ? "Data tidak valid." : (parsed.error.issues[0]?.message ?? "Data tidak valid.") };

  const result = finalize ? await finalizeOpname(user.id, opnameId, parsed.data) : await saveOpname(opnameId, parsed.data);
  revalidatePath(`/inventaris/opname/${opnameId}`);
  revalidatePath("/inventaris");
  return "error" in result && result.error ? { error: result.error } : { ok: true };
}

export async function saveOpnameAction(opnameId: string, rows: OpnameRowInput[]) {
  return run(opnameId, rows, false);
}

export async function finalizeOpnameAction(opnameId: string, rows: OpnameRowInput[]) {
  return run(opnameId, rows, true);
}
