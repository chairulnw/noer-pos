"use client";

import { MoneyInput } from "@/components/money-input";
import { Barcode, Minus, Plus, Search, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";
import { addItemAction, removeItemAction, updateItemAction, type ActionResult } from "./actions";

export type CatalogEntry = { id: string; name: string; type: "SERVICE" | "PRODUCT"; sellPrice: number; baseUnit: string; sku: string | null; barcode: string | null };
export type EditorLine = {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  discountType: "PERCENT" | "AMOUNT" | null;
  discountValue: number;
  discountAmount: number;
  total: number;
};

const selectSmall = "h-10 rounded-lg border border-input bg-card px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function LineRow({ invoiceId, line, editable, canDiscount, run }: { invoiceId: string; line: EditorLine; editable: boolean; canDiscount: boolean; run: (fn: () => Promise<ActionResult>) => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"" | "PERCENT" | "AMOUNT">(line.discountType ?? "");
  const [value, setValue] = useState(String(line.discountValue || ""));
  const discount = () => ({ type: type || null, value: Number(value) || 0 });
  const save = (qty: number, d = { type: line.discountType, value: line.discountValue }) => run(() => updateItemAction(invoiceId, line.id, qty, d));

  return (
    <div className="border-b last:border-0">
      <div className="grid min-h-16 grid-cols-[minmax(0,2.4fr)_124px_minmax(0,1fr)_80px_minmax(0,1.1fr)_44px] items-center gap-3 px-1 text-[13.5px]">
        <div className="min-w-0 font-medium">{line.name}</div>
        {editable ? (
          <div className="flex h-11 items-center overflow-hidden rounded-lg border border-input">
            <button type="button" aria-label="Kurangi" disabled={line.qty <= 1} onClick={() => save(line.qty - 1)} className="flex h-11 w-10 items-center justify-center text-muted-foreground disabled:opacity-40">
              <Minus className="size-4" />
            </button>
            <input
              type="number"
              min="0"
              step="any"
              defaultValue={line.qty}
              key={line.qty}
              aria-label={`Jumlah ${line.name}`}
              onBlur={(e) => Number(e.target.value) !== line.qty && save(Number(e.target.value))}
              className="w-full min-w-0 bg-transparent text-center font-medium tabular-nums outline-none"
            />
            <button type="button" aria-label="Tambah" onClick={() => save(line.qty + 1)} className="flex h-11 w-10 items-center justify-center text-muted-foreground">
              <Plus className="size-4" />
            </button>
          </div>
        ) : (
          <span className="text-center tabular-nums">{line.qty}</span>
        )}
        <span className="text-right tabular-nums text-muted-foreground">{formatRupiah(line.unitPrice)}</span>
        {editable && canDiscount ? (
          <button type="button" onClick={() => setOpen(!open)} className="text-right text-sm font-medium text-primary tabular-nums">
            {line.discountType === "PERCENT" ? `${line.discountValue}%` : line.discountAmount > 0 ? formatRupiah(line.discountAmount) : "Diskon"}
          </button>
        ) : (
          <span className="text-right tabular-nums text-muted-foreground">{line.discountType === "PERCENT" ? `${line.discountValue}%` : line.discountAmount > 0 ? formatRupiah(line.discountAmount) : "—"}</span>
        )}
        <span className="text-right font-medium tabular-nums">{formatRupiah(line.total)}</span>
        {editable ? (
          <button type="button" aria-label={`Hapus ${line.name}`} onClick={() => run(() => removeItemAction(invoiceId, line.id))} className="flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
            <Trash2 className="size-4" />
          </button>
        ) : (
          <span />
        )}
      </div>
      {open && (
        <div className="mb-3 ml-1 flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 p-3">
          <select aria-label="Jenis diskon" value={type} onChange={(e) => setType(e.target.value as typeof type)} className={selectSmall}>
            <option value="">Tanpa diskon</option>
            <option value="PERCENT">Persen (%)</option>
            <option value="AMOUNT">Nominal (Rp)</option>
          </select>
          {type === "AMOUNT" ? <MoneyInput aria-label="Nilai diskon" value={value} onValueChange={setValue} className={`${selectSmall} w-32`} /> : type && <input type="number" min="0" max="100" step="1" aria-label="Nilai diskon (%)" value={value} onChange={(e) => setValue(e.target.value)} className={`${selectSmall} w-32`} />}
          <Button type="button" variant="outline" onClick={() => { save(line.qty, discount()); setOpen(false); }}>
            Terapkan
          </Button>
        </div>
      )}
    </div>
  );
}

export function InvoiceEditor({ invoiceId, lines, catalog, editable, canDiscount }: { invoiceId: string; lines: EditorLine[]; catalog: CatalogEntry[]; editable: boolean; canDiscount: boolean }) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<ActionResult>) =>
    startTransition(async () => {
      const result = await fn();
      setError(result.error);
    });

  const term = query.trim().toLowerCase();
  const results = term ? catalog.filter((c) => `${c.name} ${c.sku ?? ""} ${c.barcode ?? ""}`.toLowerCase().includes(term)).slice(0, 8) : [];
  const add = (entry: CatalogEntry) => {
    setQuery("");
    run(() => addItemAction(invoiceId, entry.id));
  };

  return (
    <section aria-label="Item invoice" className={`space-y-3.5 rounded-[10px] border bg-card p-5 ${pending ? "opacity-70" : ""}`}>
      {editable && (
        <div className="relative">
          <div className="flex h-11 items-center gap-2.5 rounded-lg border border-input bg-card pl-3 pr-2 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
            <Search className="size-[18px] text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                const exact = catalog.find((c) => c.barcode === query.trim() || c.sku?.toLowerCase() === term);
                const pick = exact ?? (results.length === 1 ? results[0] : undefined);
                if (pick) add(pick);
              }}
              aria-label="Tambah item"
              data-search
              autoFocus
              placeholder="Tambah layanan / produk, atau scan barcode"
              className="min-w-0 flex-1 bg-transparent text-[14px] outline-none"
            />
            <Barcode className="size-[18px] text-muted-foreground" aria-hidden />
          </div>
          {results.length > 0 && (
            <div className="absolute z-10 mt-1.5 w-full overflow-hidden rounded-lg border bg-card shadow-lg">
              {results.map((c) => (
                <button key={c.id} type="button" onClick={() => add(c)} className="flex min-h-13 w-full items-center justify-between gap-3 border-b px-3.5 py-2 text-left last:border-0 hover:bg-muted">
                  <span className="text-[13.5px] font-medium">
                    {c.name} <span className="font-normal text-muted-foreground">· {c.type === "SERVICE" ? "Layanan" : "Produk"} · {c.baseUnit}</span>
                  </span>
                  <span className="tabular-nums text-muted-foreground">{formatRupiah(c.sellPrice)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="grid grid-cols-[minmax(0,2.4fr)_124px_minmax(0,1fr)_80px_minmax(0,1.1fr)_44px] gap-3 border-b px-1 py-2 text-[12.5px] text-muted-foreground">
            <span>Item</span>
            <span className="text-center">Qty</span>
            <span className="text-right">Harga</span>
            <span className="text-right">Diskon</span>
            <span className="text-right">Subtotal</span>
            <span />
          </div>
          {lines.length === 0 && <p className="px-1 py-8 text-center text-sm text-muted-foreground">Belum ada item.</p>}
          {lines.map((line) => (
            <LineRow key={line.id} invoiceId={invoiceId} line={line} editable={editable} canDiscount={canDiscount} run={run} />
          ))}
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </section>
  );
}
