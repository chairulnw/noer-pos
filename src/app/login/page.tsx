import Image from "next/image";
import { redirect } from "next/navigation";
import { AuthError, CredentialsSignin } from "next-auth";
import { signIn } from "@/lib/auth";
import { getLogo } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MESSAGES: Record<string, string> = {
  rate: "Terlalu banyak percobaan gagal dari perangkat ini. Coba lagi dalam 15 menit.",
};

async function login(formData: FormData) {
  "use server";
  const username = String(formData.get("username") ?? "");
  try {
    await signIn("credentials", { username, password: formData.get("password"), redirectTo: "/" });
  } catch (err) {
    if (err instanceof AuthError) {
      const code = err instanceof CredentialsSignin ? err.code : "";
      redirect(`/login?error=${encodeURIComponent(MESSAGES[code] ?? "Username atau password salah")}&u=${encodeURIComponent(username)}`);
    }
    throw err;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; code?: string; u?: string }>;
}) {
  const [params, logo] = await Promise.all([searchParams, getLogo()]);
  const { u } = params;
  const error = params.error === "CredentialsSignin" ? (MESSAGES[params.code ?? ""] ?? "Username atau password salah") : params.error;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-100 flex-col items-center gap-6">
        <Image src={logo} alt="NOER Petshop & Vet Clinic" width={143} height={64} unoptimized priority style={{ width: "auto" }} className="h-16" />
        <form action={login} className="flex w-full flex-col gap-5 rounded-xl border bg-card p-8">
          <div className="space-y-1">
            <h1 className="text-[20px] font-semibold leading-11">Masuk</h1>
            <p className="text-sm text-muted-foreground">Gunakan akun yang diberikan Admin klinik.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" autoComplete="username" required autoFocus={!u} defaultValue={u} className="h-12" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required autoFocus={Boolean(u)} className="h-12" />
          </div>
          {error && <p className="-mt-2 text-[12.5px] text-destructive">{error}</p>}
          <Button type="submit" className="h-12 text-base">
            Masuk
          </Button>
        </form>
        <p className="text-center text-[12.5px] text-muted-foreground">Lupa password? Hubungi Admin klinik.</p>
      </div>
    </div>
  );
}
