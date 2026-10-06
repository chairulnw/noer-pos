"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Banknote, BarChart3, BedDouble, Bell, Building2, Cat, ChevronDown, ClipboardCheck, CreditCard, Dog, FileText, HeartPulse, History, Hotel, ImageIcon, LayoutDashboard, Package, PawPrint, Printer, Receipt, Scale, Scissors, ShoppingCart, Stethoscope, Syringe, UserCog, UserRound, Users, WalletCards, type LucideIcon } from "lucide-react";
import { can, type Capability, type Role } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; icon: LucideIcon; capability?: Capability; roleLabel?: Partial<Record<Role, string>>; soon?: boolean };

export const GROUPS: { title: string; items: NavItem[] }[] = [
  { title: "Ikhtisar", items: [{ href: "/", label: "Dasbor", icon: LayoutDashboard }] },
  {
    title: "Penjualan",
    items: [
      { href: "/kasir", label: "Kasir (POS)", icon: ShoppingCart, capability: "manage_invoice_payment" },
      { href: "/pembayaran", label: "Transaksi (Lunas)", icon: CreditCard, capability: "manage_invoice_payment" },
      { href: "/invoice", label: "Tagihan / Invoice", icon: Receipt, capability: "manage_invoice_payment" },
    ],
  },
  {
    title: "Operasional Klinik",
    items: [
      { href: "/rekam-medis", label: "Rekam Medis", icon: Stethoscope, capability: "view_medical_record" },
      { href: "/rawat-inap", label: "Rawat Inap", icon: BedDouble, capability: "manage_admission" },
      { href: "/pet-hotel", label: "Pet Hotel", icon: Hotel, capability: "manage_admission" },
      { href: "/vaksin", label: "Vaksin", icon: Syringe, capability: "view_medical_record" },
      { href: "/hasil-lab", label: "Hasil Lab", icon: FileText, capability: "view_medical_record" },
      { href: "/radiologi", label: "Radiologi", icon: ImageIcon, capability: "view_medical_record" },
      { href: "/operasi", label: "Operasi", icon: HeartPulse, capability: "view_medical_record" },
      { href: "/grooming", label: "Grooming", icon: Scissors, capability: "create_visit" },
    ],
  },
  {
    title: "Pelanggan",
    items: [
      { href: "/pasien", label: "Hewan Peliharaan", icon: PawPrint, capability: "manage_patients" },
      { href: "/pemilik", label: "Pemilik Hewan", icon: UserRound, capability: "manage_patients" },
      { href: "/deposit", label: "Deposit / Wallet", icon: WalletCards, capability: "manage_invoice_payment" },
    ],
  },
  {
    title: "Inventaris & Ritel",
    items: [
      { href: "/master-data/item", label: "Produk", icon: Package, capability: "manage_service_price" },
      { href: "/riwayat-stok", label: "Riwayat Stok", icon: History, capability: "manage_stock" },
      { href: "/inventaris/opname", label: "Stok Opname", icon: ClipboardCheck, capability: "manage_stock" },
      { href: "/biaya-operasional", label: "Biaya Operasional", icon: Banknote, capability: "view_revenue_reports" },
    ],
  },
  {
    title: "Laporan",
    items: [
      { href: "/laporan", label: "Laporan Penjualan", icon: BarChart3, capability: "view_revenue_reports" },
      { href: "/laba-rugi", label: "Laba Rugi", icon: Scale, capability: "view_revenue_reports" },
    ],
  },
  {
    title: "Data Master",
    items: [
      { href: "/pengaturan", label: "Klinik", icon: Building2, capability: "manage_users_settings" },
      { href: "/master/jenis-hewan", label: "Jenis Hewan", icon: Cat, capability: "manage_users_settings" },
      { href: "/master/ras-hewan", label: "Ras Hewan", icon: Dog, capability: "manage_users_settings" },
      { href: "/pengguna", label: "Pengguna", icon: Users, capability: "manage_users_settings" },
      { href: "/pengaturan/printer", label: "Pengaturan Printer", icon: Printer, capability: "manage_users_settings" },
      { href: "/notifikasi", label: "Notifikasi", icon: Bell },
      { href: "/akun", label: "Profil", icon: UserCog },
    ],
  },
];

const isActive = (href: string, pathname: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

export function SidebarNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const groups = GROUPS.map((g) => ({ ...g, items: g.items.filter((item) => !item.capability || can(role, item.capability)) })).filter((g) => g.items.length > 0);
  const activeHref = groups.flatMap((g) => g.items).filter((i) => !i.soon && isActive(i.href, pathname)).sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav aria-label="Menu utama" className="flex flex-col gap-2">
      {groups.map((group) => {
        const isClosed = closed[group.title] ?? false;
        return (
          <div key={group.title} className="flex flex-col gap-0.5">
            <button
              type="button"
              aria-expanded={!isClosed}
              onClick={() => setClosed({ ...closed, [group.title]: !isClosed })}
              className="flex min-h-9 items-center justify-between rounded-lg px-3 text-[12px] font-semibold tracking-wide text-muted-foreground uppercase hover:bg-muted md:group-data-[collapsed=true]/side:hidden"
            >
              {group.title}
              <ChevronDown className={cn("size-4 transition-transform", isClosed && "-rotate-90")} />
            </button>
            <div className={cn("flex-col gap-0.5", isClosed ? "hidden md:group-data-[collapsed=true]/side:flex" : "flex")}>
              {group.items.map(({ href, label, icon: Icon, roleLabel, soon }) => {
                const text = roleLabel?.[role] ?? label;
                if (soon) {
                  return (
                    <div key={href} aria-disabled="true" title={`${text} (segera hadir)`} className="flex min-h-11 cursor-not-allowed items-center gap-3 rounded-lg px-3 text-[14.5px] font-medium text-muted-foreground/70 md:group-data-[collapsed=true]/side:hidden">
                      <Icon className="size-[18px] shrink-0 text-[#B4BAC2]" />
                      <span className="flex-1">{text}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold">Segera</span>
                    </div>
                  );
                }
                const active = href === activeHref;
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
          </div>
        );
      })}
    </nav>
  );
}
