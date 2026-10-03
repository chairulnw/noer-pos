"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Database, LayoutDashboard, PawPrint, SlidersHorizontal, type LucideIcon } from "lucide-react";
import { can, type Capability, type Role } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const NAV: { href: string; label: string; icon: LucideIcon; capability?: Capability }[] = [
  { href: "/", label: "Beranda", icon: LayoutDashboard },
  { href: "/pasien", label: "Pasien & Owner", icon: PawPrint, capability: "manage_patients" },
  { href: "/master-data", label: "Master Data", icon: Database, capability: "manage_service_price" },
  { href: "/pengaturan", label: "Pengaturan", icon: SlidersHorizontal, capability: "manage_users_settings" },
];

export function SidebarNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV.filter((item) => !item.capability || can(role, item.capability));

  return (
    <nav aria-label="Menu utama" className="flex flex-col gap-0.5">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-lg px-3 text-[14.5px] font-medium text-sidebar-foreground hover:bg-muted",
              active && "bg-sidebar-accent font-semibold text-sidebar-accent-foreground hover:bg-sidebar-accent",
            )}
          >
            <Icon className={cn("size-[18px]", active ? "text-current" : "text-[#8A929B]")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
