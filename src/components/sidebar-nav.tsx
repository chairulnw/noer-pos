"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BedDouble, Wallet, Barcode, CalendarDays, Clock, CreditCard, Database, Package, Receipt, LayoutDashboard, PawPrint, ScrollText, SlidersHorizontal, Users, type LucideIcon } from "lucide-react";
import { can, type Capability, type Role } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon; capability?: Capability; roleLabel?: Partial<Record<Role, string>> };

const GROUPS: { title?: string; items: NavItem[] }[] = [
  { items: [{ href: "/", label: "Beranda", icon: LayoutDashboard }] },
  {
    title: "Pelayanan",
    items: [
      { href: "/kunjungan", label: "Kunjungan", icon: CalendarDays, capability: "create_visit", roleLabel: { DOKTER: "Pasien Hari Ini" } },
      { href: "/rawat-inap", label: "Rawat Inap & Hotel", icon: BedDouble, capability: "manage_admission" },
      { href: "/pasien", label: "Pasien & Owner", icon: PawPrint, capability: "manage_patients" },
      { href: "/jatuh-tempo", label: "Jatuh Tempo", icon: Clock, capability: "view_medical_record" },
    ],
  },
  {
    title: "Kasir",
    items: [
      { href: "/invoice", label: "Invoice", icon: Receipt, capability: "manage_invoice_payment" },
      { href: "/retail", label: "Retail Walk-in", icon: Barcode, capability: "manage_invoice_payment" },
      { href: "/pembayaran", label: "Riwayat Pembayaran", icon: CreditCard, capability: "manage_invoice_payment" },
      { href: "/tutup-kas", label: "Tutup Kas", icon: Wallet, capability: "close_cash" },
    ],
  },
  { title: "Stok", items: [{ href: "/inventaris", label: "Inventaris", icon: Package, capability: "manage_stock" }] },
  {
    title: "Admin",
    items: [
      { href: "/master-data", label: "Master Data", icon: Database, capability: "manage_service_price" },
      { href: "/laporan", label: "Laporan", icon: BarChart3, capability: "view_revenue_reports" },
      { href: "/audit", label: "Audit Log", icon: ScrollText, capability: "view_audit_log" },
      { href: "/pengguna", label: "Pengguna", icon: Users, capability: "manage_users_settings" },
      { href: "/pengaturan", label: "Pengaturan", icon: SlidersHorizontal, capability: "manage_users_settings" },
    ],
  },
];

export function SidebarNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const groups = GROUPS.map((g) => ({ ...g, items: g.items.filter((item) => !item.capability || can(role, item.capability)) })).filter((g) => g.items.length > 0);

  return (
    <nav aria-label="Menu utama" className="flex flex-col gap-3">
      {groups.map((group, gi) => (
        <div key={group.title ?? gi} className="flex flex-col gap-0.5">
          {group.title && <div className="px-3 pb-1 text-[12px] font-semibold tracking-wide text-muted-foreground uppercase md:group-data-[collapsed=true]/side:hidden">{group.title}</div>}
          {group.items.map(({ href, label, icon: Icon, roleLabel }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            const text = roleLabel?.[role] ?? label;
            return (
              <Link
                key={href}
                href={href}
                title={text}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-lg px-3 text-[14.5px] font-medium text-sidebar-foreground hover:bg-muted md:group-data-[collapsed=true]/side:justify-center",
                  active && "bg-sidebar-accent font-semibold text-sidebar-accent-foreground hover:bg-sidebar-accent",
                )}
              >
                <Icon className={cn("size-[18px] shrink-0", active ? "text-current" : "text-[#8A929B]")} />
                <span className="md:group-data-[collapsed=true]/side:sr-only">{text}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
