"use client";

import { Barcode, Package, Search, Stethoscope } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { formatRupiah } from "@/lib/format";
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

const label = (c: string) => c.charAt(0).toUpperCase() + c.slice(1);

export function PosCatalog({ items, invoiceId, editable }: { items: PosItem[]; invoiceId: string | null; editable: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const categories = useMemo(() => [...new Set(items.map((i) => i.category))].sort(), [items]);
  const term = query.trim().toLowerCase();
  const shown = items.filter((i) => (!category || i.category === category) && (!term || `${i.name} ${i.sku ?? ""} ${i.barcode ?? ""}`.toLowerCase().includes(term)));

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

  return (
    <section aria-label="Katalog" className={cn("space-y-3.5", pending && "opacity-70")}>
      <div className="flex h-11 items-center gap-2.5 rounded-lg border border-input bg-card pl-3 pr-2 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
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
          placeholder="Cari nama produk, layanan, atau scan barcode"
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
        />
        <Barcode className="size-[18px] text-muted-foreground" aria-hidden />
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Kategori">
        {[["", "Semua"], ...categories.map((c) => [c, label(c)])].map(([value, text]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={category === value}
            onClick={() => setCategory(value)}
            className={cn("h-10 shrink-0 rounded-full border px-4 text-sm font-medium", category === value ? "border-primary bg-accent text-primary" : "bg-card text-muted-foreground")}
          >
            {text}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {!editable && <p className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">Tagihan ini sudah tidak bisa diubah. Mulai transaksi baru untuk menambah item.</p>}

      {shown.length === 0 ? (
        <p className="rounded-[10px] border bg-card p-10 text-center text-sm text-muted-foreground">Tidak ada produk atau layanan yang cocok.</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-2.5">
          {shown.map((item) => {
            const out = item.stock !== null && item.stock <= 0;
            const Icon = item.type === "SERVICE" ? Stethoscope : Package;
            return (
              <button
                key={item.id}
                type="button"
                disabled={!editable || out}
                onClick={() => add(item)}
                className="flex min-h-28 flex-col items-start justify-between gap-2 rounded-[10px] border bg-card p-3.5 text-left hover:border-primary hover:bg-accent/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex w-full items-start justify-between gap-2">
                  <span className="text-[14.5px] leading-snug font-medium">{item.name}</span>
                  <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                </span>
                <span className="w-full">
                  <span className="block text-[13px] text-muted-foreground">
                    {label(item.category)} · {item.baseUnit}
                    {item.stock !== null && <span className={out ? " text-destructive" : ""}> · {out ? "Habis" : `Stok ${item.stock.toLocaleString("id-ID")}`}</span>}
                  </span>
                  <span className="mt-0.5 block text-base font-semibold tabular-nums">{formatRupiah(item.sellPrice)}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
