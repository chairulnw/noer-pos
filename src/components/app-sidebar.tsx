import Image from "next/image";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth";
import type { Role } from "@/lib/permissions";
import { SidebarNav } from "@/components/sidebar-nav";

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
    <aside className="flex flex-col gap-1 border-b border-sidebar-border bg-sidebar px-3 py-5 md:min-h-screen md:w-60 md:shrink-0 md:border-r md:border-b-0">
      <div className="px-2.5 pb-5">
        <Image src={logo} alt="NOER Petshop & Vet Clinic" width={80} height={36} unoptimized className="h-9 w-auto" />
      </div>
      <SidebarNav role={user.role} />
      <div className="mt-auto flex items-center gap-2.5 border-t border-sidebar-border px-2 pt-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-[13px] font-semibold text-accent-foreground">
          {initials(name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{name}</div>
          <div className="text-[12.5px] text-muted-foreground">{ROLE_LABEL[user.role]}</div>
        </div>
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
