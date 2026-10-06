"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { flash } from "@/components/flash";
import { requireCapability } from "@/lib/require-role";
import { revokeSessions } from "@/lib/sessions";

export async function revokeSessionAction(sessionId: string) {
  const admin = await requireCapability("manage_users_settings");
  if (!z.guid().safeParse(sessionId).success) return;
  await revokeSessions(admin.id, { id: sessionId });
  revalidatePath("/pengguna/sesi");
  await flash("Sesi dikeluarkan");
}

export async function revokeUserSessionsAction(userId: string) {
  const admin = await requireCapability("manage_users_settings");
  if (!z.guid().safeParse(userId).success) return;
  const count = await revokeSessions(admin.id, { userId });
  revalidatePath("/pengguna/sesi");
  await flash(`${count} sesi dikeluarkan`);
}
