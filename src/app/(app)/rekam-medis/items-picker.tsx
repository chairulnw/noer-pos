"use client";

import { Search, TriangleAlert, X } from "lucide-react";
import { useState } from "react";
import { allergyMatch } from "@/lib/billing";

export type CatalogItem = { id: string; name: string; type: "SERVICE" | "PRODUCT"; category: string; baseUnit: string };
export type RecordItemRow = { itemId: string; qty: number; instruction: string };

const TYPE_LABEL = { SERVICE: "Tindakan", PRODUCT: "Resep" };

export function ItemsPicker({ catalog, allergyNote, initial, error }: { catalog: CatalogItem[]; allergyNote: string | null; initial: RecordItemRow[]; error?: string[] }) {
  const [rows, setRows] = useState(initial);
  const [query, setQuery] = useState("");
  const byId = new Map(catalog.map((item) => [item.id, item]));
  const term = query.trim().toLowerCase();
  const results = term
    ? catalog.filter((item) => !rows.some((r) => r.itemId === item.id) && `${item.name} ${item.category}`.toLowerCase().includes(term)).slice(0, 8)
    : [];

  const update = (index: number, patch: Partial<RecordItemRow>) => setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  return (
    <section className="space-y-3 rounded-[10px] border bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">Tindakan & resep</h2>
        <span className="text-[12.5px] text-muted-foreground">Masuk ke draft invoice saat difinalkan</span>
      </div>

      <div className="relative">
        <div className="flex h-11 items-center gap-2.5 rounded-lg border border-input bg-card px-3 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
          <Search className="size-[18px] text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
            aria-label="Cari tindakan atau obat"
            placeholder="Cari tindakan atau obat"
            className="min-w-0 flex-1 bg-transparent text-[14px] outline-none"
          />
        </div>
        {results.length > 0 && (
          <div className="absolute z-10 mt-1.5 w-full overflow-hidden rounded-lg border bg-card shadow-lg">
            {results.map((item) => {
              const warn = item.type === "PRODUCT" && allergyMatch(allergyNote, item.name);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setRows((current) => [...current, { itemId: item.id, qty: 1, instruction: "" }]);
                    setQuery("");
                  }}
                  className="flex min-h-13 w-full flex-col items-start justify-center gap-0.5 border-b px-3.5 py-2 text-left last:border-0 hover:bg-muted"
                >
                  <span className="text-[13.5px] font-medium">
                    {item.name} <span className="font-normal text-muted-foreground">· {TYPE_LABEL[item.type]} · {item.baseUnit}</span>
                  </span>
                  {warn && (
                    <span className="flex items-center gap-1.5 text-[12.5px] text-destructive">
                      <TriangleAlert className="size-3.5" />
                      Pasien tercatat alergi obat ini
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada tindakan atau obat.</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[560px] text-[13.5px]">
            <div className="grid grid-cols-[90px_minmax(0,2fr)_minmax(0,1.6fr)_90px_44px] gap-3 border-b px-1 py-2 text-[12.5px] text-muted-foreground">
              <span>Jenis</span>
              <span>Item</span>
              <span>Aturan pakai</span>
              <span>Qty</span>
              <span />
            </div>
            {rows.map((row, i) => {
              const item = byId.get(row.itemId);
              if (!item) return null;
              const warn = item.type === "PRODUCT" && allergyMatch(allergyNote, item.name);
              return (
                <div key={row.itemId} className="grid min-h-14 grid-cols-[90px_minmax(0,2fr)_minmax(0,1.6fr)_90px_44px] items-center gap-3 border-b px-1 last:border-0">
                  <input type="hidden" name="itemId" value={row.itemId} />
                  <span className="text-muted-foreground">{TYPE_LABEL[item.type]}</span>
                  <span>
                    <span className="font-medium">{item.name}</span>
                    {warn && (
                      <span className="flex items-center gap-1.5 text-[12.5px] text-destructive">
                        <TriangleAlert className="size-3.5" />
                        Pasien tercatat alergi obat ini
                      </span>
                    )}
                  </span>
                  {item.type === "PRODUCT" ? (
                    <input
                      name="instruction"
                      value={row.instruction}
                      onChange={(e) => update(i, { instruction: e.target.value })}
                      aria-label={`Aturan pakai ${item.name}`}
                      placeholder="mis. 2× sehari ½ tab"
                      className="h-10 min-w-0 rounded-lg border border-input bg-card px-2.5 text-[13.5px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                  ) : (
                    <>
                      <input type="hidden" name="instruction" value="" />
                      <span className="text-muted-foreground">—</span>
                    </>
                  )}
                  <div className="flex items-center gap-1">
                    <input
                      name="qty"
                      type="number"
                      min="0"
                      step="any"
                      value={row.qty}
                      onChange={(e) => update(i, { qty: Number(e.target.value) })}
                      aria-label={`Jumlah ${item.name}`}
                      className="h-10 w-16 rounded-lg border border-input bg-card px-2 text-[13.5px] tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                    <span className="text-[12.5px] text-muted-foreground">{item.baseUnit}</span>
                  </div>
                  <button type="button" aria-label={`Hapus ${item.name}`} onClick={() => setRows((current) => current.filter((_, idx) => idx !== i))} className="flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
                    <X className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {error?.map((e) => (
        <p key={e} className="text-[12.5px] text-destructive">{e}</p>
      ))}
    </section>
  );
}
