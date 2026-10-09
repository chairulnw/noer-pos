"use client";

import { MoneyInput } from "@/components/money-input";
import { Minus, Plus, ShoppingCart, Trash2, UserRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { formatRupiah } from "@/lib/format";
import { removeItemAction, updateItemAction } from "../invoice/actions";
import { posCustomerAction, searchOwnersAction } from "./actions";

export type CartLine = {
  id: string;
  name: string;
  qty: number;
  unit: string;
  unitPrice: number;
  discountType: "PERCENT" | "AMOUNT" | null;
  discountValue: number;
  discountAmount: number;
  total: number;
};

type Owner = { id: string; name: string; whatsapp: string; pets: string[] };
const small = "h-10 rounded-lg border border-input bg-card px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function Line({ invoiceId, line, editable, canDiscount, run }: { invoiceId: string; line: CartLine; editable: boolean; canDiscount: boolean; run: (fn: () => Promise<{ error?: string }>) => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"" | "PERCENT" | "AMOUNT">(line.discountType ?? "");
  const [value, setValue] = useState(String(line.discountValue || ""));
  const save = (qty: number, discount = { type: line.discountType, value: line.discountValue }) => run(() => updateItemAction(invoiceId, line.id, qty, discount));
  const discountText = line.discountType === "PERCENT" ? `Diskon ${line.discountValue}%` : line.discountAmount > 0 ? `Diskon ${formatRupiah(line.discountAmount)}` : "Diskon";

  return (
    <li className="space-y-2 border-b py-3 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[13.5px] leading-snug font-medium">{line.name}</div>
          <div className="text-[12.5px] text-muted-foreground tabular-nums">{formatRupiah(line.unitPrice)} / {line.unit}</div>
        </div>
        {editable && (
          <button type="button" aria-label={`Hapus ${line.name}`} onClick={() => run(() => removeItemAction(invoiceId, line.id))} className="-mt-1 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        {editable ? (
          <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-11 w-32 shrink-0 items-center overflow-hidden rounded-lg border border-input">
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
          <span className="min-w-0 truncate text-[12.5px] text-muted-foreground">{line.unit}</span>
          </div>
        ) : (
          <span className="tabular-nums text-muted-foreground">× {line.qty} {line.unit}</span>
        )}
        <div className="text-right">
          <div className="font-semibold tabular-nums">{formatRupiah(line.total)}</div>
          {editable && canDiscount ? (
            <button type="button" onClick={() => setOpen(!open)} className="min-h-8 text-[12.5px] font-medium text-primary">{discountText}</button>
          ) : (
            line.discountAmount > 0 && <div className="text-[12.5px] text-muted-foreground">{discountText}</div>
          )}
        </div>
      </div>
      {open && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 p-3">
          <select aria-label="Jenis diskon" value={type} onChange={(e) => setType(e.target.value as typeof type)} className={small}>
            <option value="">Tanpa diskon</option>
            <option value="PERCENT">Persen (%)</option>
            <option value="AMOUNT">Nominal (Rp)</option>
          </select>
          {type === "AMOUNT" ? <MoneyInput aria-label="Nilai diskon" value={value} onValueChange={setValue} className={`${small} w-28`} /> : type && <input type="number" min="0" max="100" step="1" aria-label="Nilai diskon (%)" value={value} onChange={(e) => setValue(e.target.value)} className={`${small} w-28`} />}
          <button type="button" onClick={() => { save(line.qty, { type: type || null, value: Number(value) || 0 }); setOpen(false); }} className="h-10 rounded-lg border px-3 text-sm font-medium">Terapkan</button>
        </div>
      )}
    </li>
  );
}

function Customer({ invoiceId, name, locked, editable, run }: { invoiceId: string | null; name: string | null; locked: boolean; editable: boolean; run: (fn: () => Promise<{ error?: string }>) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Owner[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = (q: string) => {
    setQuery(q);
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => setResults(await searchOwnersAction(q)), 250);
  };
  const choose = (ownerId: string | null) => {
    if (!invoiceId) return;
    setOpen(false);
    setQuery("");
    setResults([]);
    run(() => posCustomerAction(invoiceId, ownerId));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <UserRound className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate font-medium">{name ?? "Umum / Walk-in"}</span>
        </div>
        {editable && !locked && invoiceId && (
          <div className="flex shrink-0 gap-1">
            {name && <button type="button" aria-label="Hapus pelanggan" onClick={() => choose(null)} className="flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"><X className="size-4" /></button>}
            <button type="button" onClick={() => setOpen(!open)} className="min-h-10 px-2 text-sm font-medium text-primary">{name ? "Ganti" : "Pilih pelanggan"}</button>
          </div>
        )}
      </div>
      {open && (
        <div className="space-y-2 rounded-lg bg-muted/50 p-3">
          <input value={query} onChange={(e) => search(e.target.value)} autoFocus aria-label="Cari pemilik" placeholder="Nama atau no. WhatsApp pemilik" className={`${small} w-full`} />
          {query.trim().length >= 2 && results.length === 0 && <p className="text-[12.5px] text-muted-foreground">Pemilik tidak ditemukan.</p>}
          {results.map((o) => (
            <button key={o.id} type="button" onClick={() => choose(o.id)} className="flex min-h-11 w-full flex-col items-start rounded-lg border bg-card px-3 py-1.5 text-left">
              <span className="text-sm font-medium">{o.name}</span>
              <span className="text-[12.5px] text-muted-foreground">{o.pets.length ? o.pets.join(", ") : "Belum ada hewan"}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function PosCart({ invoiceId, lines, editable, canDiscount, customerName, customerLocked, footer, invoiceNo }: { footer: React.ReactNode; invoiceNo: string | null; invoiceId: string | null; lines: CartLine[]; editable: boolean; canDiscount: boolean; customerName: string | null; customerLocked: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<{ error?: string }>) =>
    startTransition(async () => {
      const result = await fn();
      setError(result.error);
      router.refresh();
    });

  return (
    <section aria-label="Keranjang" className={`flex flex-col gap-3 p-5 md:min-h-0 md:flex-1 ${pending ? "opacity-70" : ""}`}>
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary"><ShoppingCart className="size-5" /></span>
        <div>
          <h2 className="text-base leading-tight font-semibold">Keranjang</h2>
          <p className="text-[12.5px] text-muted-foreground tabular-nums">{invoiceNo ? `${invoiceNo} · ` : ""}{lines.length} item</p>
        </div>
      </div>
      <Customer invoiceId={invoiceId} name={customerName} locked={customerLocked} editable={editable} run={run} />
      <div className="border-t" />
      {lines.length === 0 || !invoiceId ? (
        <div className="flex min-h-56 flex-1 flex-col items-center justify-center gap-2 text-center">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-muted/70 text-muted-foreground"><ShoppingCart className="size-7" /></span>
          <p className="font-semibold">Keranjang Kosong</p>
          <p className="max-w-56 text-sm text-muted-foreground">Pilih produk atau layanan dari katalog di sebelah kiri untuk menambahkan ke pesanan.</p>
        </div>
      ) : (
        <ul className="min-h-40 flex-1 overflow-y-auto">
          {lines.map((line) => (
            <Line key={line.id} invoiceId={invoiceId} line={line} editable={editable} canDiscount={canDiscount} run={run} />
          ))}
        </ul>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {footer}
    </section>
  );
}
