"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { cancelVisit, createVisit, visitSchema } from "@/lib/visits";
import { requireCapability } from "@/lib/require-role";

export type VisitFormState = { message?: string; errors?: Record<string, string[] | undefined> };

export async function createVisitAction(patientId: string, _prev: VisitFormState, formData: FormData): Promise<VisitFormState> {
  const user = await requireCapability("create_visit");

  const parsed = visitSchema.safeParse({
    doctorId: String(formData.get("doctorId") ?? ""),
    complaint: String(formData.get("complaint") ?? ""),
  });
  if (!parsed.success) {
    return { message: "Periksa kembali isian yang ditandai.", errors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await createVisit(user.id, patientId, parsed.data);
  if (result.error) return { message: result.error };

  revalidatePath("/kunjungan");
  redirect("/kunjungan");
}

export async function cancelVisitAction(id: string) {
  await requireCapability("create_visit");
  await cancelVisit(id);
  revalidatePath("/kunjungan");
}
