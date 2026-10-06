"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ChevronRight, LayoutGrid, Search, X } from "lucide-react";
import { useMounted } from "@/components/modal";
import { createPortal } from "react-dom";
import { GROUPS } from "@/components/sidebar-nav";
import { can, type Role } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const COLORS = ["bg-success", "bg-info", "bg-warning", "bg-primary", "bg-destructive"];

export function ModulesDialog({ role }: { role: Role }) {
  const mounted = useMounted();
  const dialog = useRef<HTMLDialogElement>(null);
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const groups = GROUPS.filter((g) => g.title !== "Ikhtisar")
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.soon && (!i.capability || can(role, i.capability)) && (!term || i.label.toLowerCase().includes(term))) }))
    .filter((g) => g.items.length > 0);
  let n = 0;

  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} className="flex w-full flex-col items-center gap-3 rounded-2xl border bg-card px-3 py-5 text-center text-[15px] font-semibold text-primary hover:border-primary/40">
        <span className="grid size-14 place-items-center rounded-2xl bg-accent text-primary"><LayoutGrid className="size-6" /></span>
        Lainnya
      </button>
      {mounted && createPortal(
        <dialog ref={dialog} onClose={() => setQ("")} onClick={(e) => e.target === dialog.current && dialog.current?.close()} className="m-auto h-[min(88vh,820px)] w-[min(94vw,640px)] overflow-hidden rounded-3xl border bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm">
          <div className="flex h-full flex-col">
            <div className="space-y-4 p-5 pb-4">
              <div className="flex items-start gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent text-primary"><LayoutGrid className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold">Semua modul dan fitur</h2>
                  <p className="text-sm text-muted-foreground">Navigasi cepat ke seluruh modul operasional, diagnostik, dan keuangan klinik</p>
                </div>
                <button type="button" aria-label="Tutup" onClick={() => dialog.current?.close()} className="grid size-10 shrink-0 place-items-center rounded-full bg-muted/70 hover:bg-muted"><X className="size-5" /></button>
              </div>
              <label className="flex h-12 items-center gap-2.5 rounded-xl border bg-background px-3.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
                <Search className="size-[18px] text-muted-foreground" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari menu…" aria-label="Cari menu" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none" />
              </label>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto border-t bg-background/60 p-5">
              {groups.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Menu tidak ditemukan.</p>}
              {groups.map((g) => (
                <section key={g.title} className="space-y-2">
                  <h3 className="px-1 text-[12.5px] font-semibold uppercase tracking-wider text-muted-foreground">{g.title}</h3>
                  <div className="overflow-hidden rounded-2xl border bg-card">
                    {g.items.map(({ href, label, icon: Icon }) => (
                      <Link key={href} href={href} onClick={() => dialog.current?.close()} className="flex items-center gap-3.5 border-b px-4 py-3 last:border-0 hover:bg-accent/60">
                        <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl text-white", COLORS[n++ % COLORS.length])}><Icon className="size-5" /></span>
                        <span className="flex-1 text-base font-semibold">{label}</span>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </dialog>,
        document.body,
      )}
    </>
  );
}
