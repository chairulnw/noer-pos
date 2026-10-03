import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth";
import type { Role } from "@/lib/permissions";
import { SidebarNav } from "@/components/sidebar-nav";
import { SidebarSearch } from "@/components/sidebar-search";

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Owner / Admin",
  DOKTER: "Dokter",
  KASIR: "Kasir",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export function AppSidebar({ user, logo }: { user: { name?: string | null; role: Role }; logo: string }) {
  const name = user.name ?? "";

  return (
    <aside className="flex flex-col border-b border-sidebar-border bg-sidebar px-3 py-5 md:sticky md:top-0 md:h-screen md:w-[72px] md:shrink-0 md:border-r md:border-b-0 lg:w-60">
      <div className="px-2.5 pb-4 md:max-lg:hidden">
        <Image src={logo} alt="NOER Petshop & Vet Clinic" width={80} height={36} unoptimized priority style={{ width: "auto" }} className="h-9" />
      </div>
      <SidebarSearch />
      <div className="min-h-0 md:flex-1 md:overflow-y-auto">
        <SidebarNav role={user.role} />
      </div>
      <div className="mt-3 flex items-center gap-2.5 border-t border-sidebar-border px-2 pt-4 md:max-lg:flex-col">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-[13px] font-semibold text-accent-foreground">
          {initials(name)}
        </div>
        <Link href="/akun" title="Akun saya" className="min-w-0 flex-1 rounded-lg py-1 hover:bg-muted md:max-lg:hidden">
          <div className="truncate text-sm font-medium">{name}</div>
          <div className="text-[12.5px] text-muted-foreground">{ROLE_LABEL[user.role]}</div>
        </Link>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            aria-label="Keluar"
            className="flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          >
            <LogOut className="size-[18px]" />
          </button>
        </form>
      </div>
    </aside>
  );
}
