"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BedDouble, Boxes, Building2, CalendarDays, ClipboardCheck, CreditCard, DoorOpen, LayoutDashboard, Package, PawPrint, Receipt, ScrollText, ShoppingCart, Syringe, Users, Wallet, type LucideIcon } from "lucide-react";
import { can, type Capability, type Role } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon; capability?: Capability; roleLabel?: Partial<Record<Role, string>> };

const GROUPS: { title?: string; items: NavItem[] }[] = [
  { title: "Ikhtisar", items: [{ href: "/", label: "Dasbor", icon: LayoutDashboard }] },
  {
    title: "Penjualan",
    items: [
      { href: "/retail", label: "Kasir (POS)", icon: ShoppingCart, capability: "manage_invoice_payment" },
      { href: "/pembayaran", label: "Transaksi (Lunas)", icon: CreditCard, capability: "manage_invoice_payment" },
      { href: "/invoice", label: "Tagihan / Invoice", icon: Receipt, capability: "manage_invoice_payment" },
      { href: "/tutup-kas", label: "Tutup Kas", icon: Wallet, capability: "close_cash" },
    ],
  },
  {
    title: "Operasional Klinik",
    items: [
      { href: "/kunjungan", label: "Kunjungan", icon: CalendarDays, capability: "create_visit", roleLabel: { DOKTER: "Pasien Hari Ini" } },
      { href: "/rawat-inap", label: "Rawat Inap & Hotel", icon: BedDouble, capability: "manage_admission" },
      { href: "/jatuh-tempo", label: "Vaksin Jatuh Tempo", icon: Syringe, capability: "view_medical_record" },
    ],
  },
  {
    title: "Pelanggan",
    items: [{ href: "/pasien", label: "Hewan & Pemilik", icon: PawPrint, capability: "manage_patients" }],
  },
  {
    title: "Inventaris & Ritel",
    items: [
      { href: "/master-data/item", label: "Produk & Layanan", icon: Package, capability: "manage_service_price" },
      { href: "/inventaris", label: "Stok", icon: Boxes, capability: "manage_stock" },
      { href: "/inventaris/opname", label: "Stok Opname", icon: ClipboardCheck, capability: "manage_stock" },
    ],
  },
  {
    title: "Laporan",
    items: [
      { href: "/laporan", label: "Laporan Penjualan", icon: BarChart3, capability: "view_revenue_reports" },
      { href: "/audit", label: "Audit Log", icon: ScrollText, capability: "view_audit_log" },
    ],
  },
  {
    title: "Data Master",
    items: [
      { href: "/pengaturan", label: "Klinik", icon: Building2, capability: "manage_users_settings" },
      { href: "/master-data/kandang", label: "Kandang", icon: DoorOpen, capability: "manage_rooms" },
      { href: "/pengguna", label: "Pengguna", icon: Users, capability: "manage_users_settings" },
    ],
  },
];

const isActive = (href: string, pathname: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

export function SidebarNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const groups = GROUPS.map((g) => ({ ...g, items: g.items.filter((item) => !item.capability || can(role, item.capability)) })).filter((g) => g.items.length > 0);
  const activeHref = groups.flatMap((g) => g.items).filter((i) => isActive(i.href, pathname)).sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav aria-label="Menu utama" className="flex flex-col gap-3">
      {groups.map((group, gi) => (
        <div key={group.title ?? gi} className="flex flex-col gap-0.5">
          {group.title && <div className="px-3 pb-1 text-[12px] font-semibold tracking-wide text-muted-foreground uppercase md:group-data-[collapsed=true]/side:hidden">{group.title}</div>}
          {group.items.map(({ href, label, icon: Icon, roleLabel }) => {
            const active = href === activeHref;
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
