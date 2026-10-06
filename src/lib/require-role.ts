import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can, type Capability } from "@/lib/permissions";

// auth() mengecek sesi ke DB; layout dan page memanggilnya di request yang sama
export const requireUser = cache(async () => {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
});

export async function requireCapability(capability: Capability) {
  const user = await requireUser();
  if (!can(user.role, capability)) redirect("/forbidden");
  return user;
}
