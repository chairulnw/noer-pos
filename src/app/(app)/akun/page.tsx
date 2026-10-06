import { requireUser } from "@/lib/require-role";
import { PasswordForm } from "./password-form";

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[20px] font-semibold leading-11">Akun saya</h1>
        <p className="text-sm text-muted-foreground">{user.name}</p>
      </header>
      <PasswordForm />
    </div>
  );
}
