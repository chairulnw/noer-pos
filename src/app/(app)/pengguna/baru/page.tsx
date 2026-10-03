import { requireCapability } from "@/lib/require-role";
import { CreateUserForm } from "../user-form";

export default async function NewUserPage() {
  await requireCapability("manage_users_settings");
  return <CreateUserForm />;
}
