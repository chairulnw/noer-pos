"use server";

import { revalidatePath } from "next/cache";
import { flash } from "@/components/flash";
import { markAllRead } from "@/lib/notifications";
import { requireUser } from "@/lib/require-role";

export async function markAllReadAction() {
  const user = await requireUser();
  await markAllRead(user.id, user.role);
  revalidatePath("/", "layout");
  await flash("Semua notifikasi ditandai dibaca");
}
