"use client";

import { useEffect } from "react";
import { Search } from "lucide-react";

export function SidebarSearch() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key !== "/" || e.ctrlKey || e.metaKey || el.closest("input,textarea,select,[contenteditable]")) return;
      e.preventDefault();
      const target = document.querySelector<HTMLInputElement>("[data-search]") ?? document.getElementById("global-search");
      target?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <form action="/pasien" role="search" className="mb-3 flex h-11 items-center gap-2 rounded-lg border border-input bg-card px-3 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 md:max-lg:hidden">
      <Search className="size-4 shrink-0 text-muted-foreground" />
      <input id="global-search" name="q" aria-label="Cari pasien atau owner" placeholder="Cari pasien…" autoComplete="off" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
      <kbd className="rounded border px-1.5 text-[12px] text-muted-foreground">/</kbd>
    </form>
  );
}
