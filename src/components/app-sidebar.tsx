import Image from "next/image";
import Link from "next/link";
import { Bell, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth";
import type { Role } from "@/lib/permissions";
import { unreadCount } from "@/lib/notifications";
import { SidebarNav } from "@/components/sidebar-nav";
import { SidebarShell } from "@/components/sidebar-shell";
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

export async function AppSidebar({ user, logo }: { user: { id: string; name?: string | null; role: Role }; logo: string }) {
  const name = user.name ?? "";
  const unread = await unreadCount(user.id, user.role);

  return (
    <SidebarShell
      bell={
        <Link href="/notifikasi" aria-label={unread > 0 ? `Notifikasi, ${unread} belum dibaca` : "Notifikasi"} title="Notifikasi" className="relative flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
          <Bell className="size-[18px]" />
          {unread > 0 && <span className="absolute top-1.5 right-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-4 font-semibold text-white">{unread > 99 ? "99+" : unread}</span>}
        </Link>
      }
      logo={<Image src={logo} alt="NOER Petshop & Vet Clinic" width={80} height={36} unoptimized priority style={{ width: "auto" }} className="h-9" />}>
      <SidebarSearch />
      <div className="min-h-0 md:flex-1 md:overflow-y-auto">
        <SidebarNav role={user.role} />
      </div>
      <div className="mt-3 flex items-center gap-2.5 border-t border-sidebar-border px-2 pt-4 md:group-data-[collapsed=true]/side:flex-col">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-[12.5px] font-semibold text-accent-foreground">
          {initials(name)}
        </div>
        <div className="min-w-0 flex-1 py-1 md:group-data-[collapsed=true]/side:hidden">
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
    </SidebarShell>
  );
}
