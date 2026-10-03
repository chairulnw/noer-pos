import Image from "next/image";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { getLogo } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

async function login(formData: FormData) {
  "use server";
  try {
    await signIn("credentials", {
      username: formData.get("username"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      redirect(`/login?error=${encodeURIComponent(err.message || "Username atau password salah")}`);
    }
    throw err;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, logo] = await Promise.all([searchParams, getLogo()]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-100 flex-col items-center gap-6">
        <Image src={logo} alt="NOER Petshop & Vet Clinic" width={143} height={64} unoptimized className="h-16 w-auto" />
        <form action={login} className="flex w-full flex-col gap-5 rounded-xl border bg-card p-8">
          <div className="space-y-1">
            <h1 className="text-[22px] font-semibold leading-11">Masuk</h1>
            <p className="text-sm text-muted-foreground">Gunakan akun yang diberikan Admin klinik.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" autoComplete="username" required autoFocus className="h-12" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required className="h-12" />
          </div>
          {error && <p className="-mt-2 text-[13px] text-destructive">{error}</p>}
          <Button type="submit" className="h-12 text-base">
            Masuk
          </Button>
        </form>
        <p className="text-center text-[13px] text-muted-foreground">Lupa password? Hubungi Admin klinik.</p>
      </div>
    </div>
  );
}
