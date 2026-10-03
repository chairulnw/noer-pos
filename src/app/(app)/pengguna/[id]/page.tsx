import { notFound } from "next/navigation";
import { z } from "zod";
import { requireCapability } from "@/lib/require-role";
import { getUser } from "@/lib/users";
import { EditUserForm } from "../user-form";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireCapability("manage_users_settings");
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const user = await getUser(id);
  if (!user) notFound();
  return <EditUserForm user={user} isSelf={user.id === admin.id} />;
}
