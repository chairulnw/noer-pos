"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/master-data/item", label: "Layanan & Produk" },
  { href: "/master-data/kandang", label: "Kandang" },
];

export function MasterTabs() {
  const pathname = usePathname();

  return (
    <div role="tablist" className="flex gap-1 border-b">
      {TABS.map(({ href, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            role="tab"
            aria-selected={active}
            className={cn(
              "flex h-12 items-center border-b-2 px-3 text-[14.5px] font-medium text-muted-foreground",
              active ? "border-primary font-semibold text-primary" : "border-transparent",
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
