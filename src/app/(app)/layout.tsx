import { cookies } from "next/headers";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/toaster";
import { getLogo } from "@/lib/settings";
import { requireUser } from "@/lib/require-role";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, logo] = await Promise.all([requireUser(), getLogo()]);
  const flash = (await cookies()).get("flash")?.value ?? null;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AppSidebar user={user} logo={logo} />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-7">{children}</main>
      <Toaster flash={flash} />
    </div>
  );
}
