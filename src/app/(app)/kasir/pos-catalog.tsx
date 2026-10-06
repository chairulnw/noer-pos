"use client";

import { Barcode, Building2, LayoutGrid, List, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { formatRupiah } from "@/lib/format";
import { ITEM_GROUPS } from "@/lib/item-groups";
import { cn } from "@/lib/utils";
import { posAddAction } from "./actions";

export type PosItem = {
  id: string;
  name: string;
  type: "SERVICE" | "PRODUCT";
  category: string;
  sellPrice: number;
  baseUnit: string;
  sku: string | null;
  barcode: string | null;
  stock: number | null;
};

const groupOf = (category: string) => ITEM_GROUPS.find((g) => g.value && (g.categories as readonly string[]).includes(category))?.value ?? "";

export function PosCatalog({ items, invoiceId, editable, clinicName, actions }: { items: PosItem[]; invoiceId: string | null; editable: boolean; clinicName: string; actions?: React.ReactNode }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const groups = useMemo(() => {
    const present = new Set(items.map((i) => groupOf(i.category)));
    return [{ value: "", label: "Semua" }, ...ITEM_GROUPS.filter((g) => g.value && present.has(g.value)).map((g) => ({ value: g.value as string, label: g.label as string }))];
  }, [items]);
  const term = query.trim().toLowerCase();
  const shown = items.filter((i) => (!group || groupOf(i.category) === group) && (!term || `${i.name} ${i.sku ?? ""} ${i.barcode ?? ""}`.toLowerCase().includes(term)));

  const add = (item: PosItem) => {
    if (!editable || (item.stock !== null && item.stock <= 0)) return;
    setQuery("");
    setError(undefined);
    startTransition(async () => {
      const result = await posAddAction(invoiceId, item.id);
      if (result.error) setError(result.error);
      if (result.invoiceId && result.invoiceId !== invoiceId) router.push(`/kasir?inv=${result.invoiceId}`);
      else router.refresh();
    });
  };

  const toggle = (id: "grid" | "list", Icon: typeof LayoutGrid, text: string) => (
    <button type="button" aria-label={text} aria-pressed={view === id} onClick={() => setView(id)} className={cn("flex size-9 items-center justify-center rounded-lg", view === id ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}>
      <Icon className="size-[18px]" />
    </button>
  );

  return (
    <section aria-label="Katalog" className={cn("flex min-w-0 flex-col overflow-hidden rounded-[10px] border bg-card md:min-h-0 md:flex-1", pending && "opacity-70")}>
      <div className="flex items-center gap-3 border-b p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary"><Building2 className="size-5" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base leading-tight font-semibold">{clinicName}</h2>
          <p className="text-[13px] text-muted-foreground">Katalog Produk & Kasir (POS)</p>
        </div>
        {actions}
        <div className="flex gap-1 rounded-xl bg-muted/70 p-1">
          {toggle("grid", LayoutGrid, "Tampilan kotak")}
          {toggle("list", List, "Tampilan daftar")}
        </div>
      </div>

      <div className="space-y-3 border-b p-4">
        <div className="flex h-11 items-center gap-2.5 rounded-xl border border-input bg-background pl-3 pr-2 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
          <Search className="size-[18px] text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              const exact = items.find((i) => i.barcode === query.trim() || i.sku?.toLowerCase() === term);
              const pick = exact ?? (shown.length === 1 ? shown[0] : undefined);
              if (pick) add(pick);
            }}
            aria-label="Cari produk atau layanan"
            data-search
            autoFocus
            placeholder="Cari nama produk, obat, atau scan barcode…"
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
          />
          <Barcode className="size-[18px] text-muted-foreground" aria-hidden />
        </div>
        <div className="flex gap-1.5 overflow-x-auto" role="tablist" aria-label="Kelompok">
          {groups.map((g) => (
            <button key={g.value} type="button" role="tab" aria-selected={group === g.value} onClick={() => setGroup(g.value)} className={cn("h-10 shrink-0 rounded-full border px-4 text-sm font-medium", group === g.value ? "border-primary bg-accent text-primary" : "bg-card text-muted-foreground")}>
              {g.label}
            </button>
          ))}
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {!editable && <p className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">Tagihan ini sudah tidak bisa diubah. Mulai transaksi baru untuk menambah item.</p>}
      </div>

      <div className="min-h-64 flex-1 overflow-y-auto bg-background/60 p-4">
        {shown.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Tidak ada produk atau layanan yang cocok.</p>
        ) : (
          <div className={view === "grid" ? "grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3" : "flex flex-col gap-2"}>
            {shown.map((item) => {
              const out = item.stock !== null && item.stock <= 0;
              const stock = item.stock !== null && (
                <span className={cn("rounded-full border px-2 py-0.5 text-[12px] font-semibold", out ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-success/30 bg-success/10 text-success")}>
                  {out ? "Habis" : `Stok: ${item.stock.toLocaleString("id-ID")}`}
                </span>
              );
              const plus = <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground", (!editable || out) && "opacity-40")}><Plus className="size-5" /></span>;
              return view === "grid" ? (
                <button key={item.id} type="button" disabled={!editable || out} onClick={() => add(item)} className="flex flex-col gap-3 rounded-2xl border bg-card p-3.5 text-left hover:border-primary/50 disabled:cursor-not-allowed">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate rounded-md bg-muted/70 px-2 py-0.5 font-mono text-[12px] text-muted-foreground">{item.sku ?? item.baseUnit}</span>
                    {stock}
                  </span>
                  <span className="min-h-10 text-[15px] leading-snug font-semibold">{item.name}</span>
                  <span className="flex items-end justify-between gap-2 border-t pt-3">
                    <span>
                      <span className="block text-[12px] text-muted-foreground">Harga</span>
                      <span className="text-lg font-bold text-primary tabular-nums">{formatRupiah(item.sellPrice)}</span>
                    </span>
                    {plus}
                  </span>
                </button>
              ) : (
                <button key={item.id} type="button" disabled={!editable || out} onClick={() => add(item)} className="flex items-center gap-3 rounded-xl border bg-card px-3.5 py-2.5 text-left hover:border-primary/50 disabled:cursor-not-allowed">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold">{item.name}</span>
                    <span className="text-[12.5px] text-muted-foreground">{item.sku ?? item.baseUnit}</span>
                  </span>
                  {stock}
                  <span className="w-28 text-right font-bold text-primary tabular-nums">{formatRupiah(item.sellPrice)}</span>
                  {plus}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
