"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { changeDue } from "@/lib/billing";
import { formatRupiah } from "@/lib/format";
import { depositAction, payAction, setDiscountAction } from "./actions";

const METHODS = [
  { id: "TUNAI", label: "Tunai" },
  { id: "QRIS", label: "QRIS" },
  { id: "TRANSFER", label: "Transfer" },
  { id: "KARTU", label: "Kartu" },
] as const;

const HINT = {
  QRIS: "Tampilkan QRIS klinik ke pelanggan. Tekan Bayar setelah dana masuk terkonfirmasi.",
  TRANSFER: "Cek mutasi rekening klinik, lalu tekan Bayar.",
  KARTU: "Proses di mesin EDC, isi 4 digit terakhir kartu dan no. approval.",
} as const;

const roundUp = (n: number, step: number) => Math.ceil(n / step) * step;

type Props = {
  invoiceId: string;
  totals: { subtotal: number; discountTotal: number; taxTotal: number; grandTotal: number; taxRate: number; taxIncluded: boolean };
  discount: { type: "PERCENT" | "AMOUNT" | null; value: number };
  canDiscount: boolean;
  hasQris: boolean;
  editable: boolean;
  canPay: boolean;
  paid: number;
  hasPayments: boolean;
};

export function PayPanel({ invoiceId, totals, discount, canDiscount, hasQris, editable, canPay, paid, hasPayments }: Props) {
  const [method, setMethod] = useState<(typeof METHODS)[number]["id"]>("TUNAI");
  const [received, setReceived] = useState<string | null>(null);
  const [reference, setReference] = useState("");
  const [discOpen, setDiscOpen] = useState(false);
  const [dType, setDType] = useState<"" | "PERCENT" | "AMOUNT">(discount.type ?? "");
  const [dValue, setDValue] = useState(String(discount.value || ""));
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const total = Math.max(totals.grandTotal - paid, 0);
  const overpaid = paid > totals.grandTotal;
  const [dpOpen, setDpOpen] = useState(false);
  const [dpAmount, setDpAmount] = useState("");
  const [dpCash, setDpCash] = useState<string | null>(null);
  const cash = Number(received ?? total) || 0;
  const quick = [...new Set([total, roundUp(total, 10_000), roundUp(total, 50_000), roundUp(total, 100_000)])].filter((v) => v > 0).slice(0, 4);

  const run = (fn: () => Promise<{ error?: string }>) =>
    startTransition(async () => {
      const result = await fn();
      setError(result.error);
    });

  return (
    <section aria-label="Pembayaran" className="space-y-4 rounded-[10px] border bg-card p-5">
      <div className="space-y-2 text-[14.5px]">
        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{formatRupiah(totals.subtotal)}</span></div>
        {totals.discountTotal > 0 && (
          <div className="flex justify-between"><span className="text-muted-foreground">Diskon invoice</span><span className="tabular-nums">− {formatRupiah(totals.discountTotal)}</span></div>
        )}
        {totals.taxRate > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">PPN {totals.taxRate}%{totals.taxIncluded && " (termasuk)"}</span>
            <span className="tabular-nums">{formatRupiah(totals.taxTotal)}</span>
          </div>
        )}
        {editable && canDiscount && (
          <button type="button" onClick={() => setDiscOpen(!discOpen)} className="min-h-11 text-sm font-medium text-primary">
            {discount.type ? "Ubah diskon invoice" : "+ Diskon invoice"}
          </button>
        )}
        {discOpen && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 p-3">
            <select aria-label="Jenis diskon invoice" value={dType} onChange={(e) => setDType(e.target.value as typeof dType)} className="h-10 rounded-lg border border-input bg-card px-2 text-sm">
              <option value="">Tanpa diskon</option>
              <option value="PERCENT">Persen (%)</option>
              <option value="AMOUNT">Nominal (Rp)</option>
            </select>
            {dType && <input type="number" min="0" step="1" aria-label="Nilai diskon invoice" value={dValue} onChange={(e) => setDValue(e.target.value)} className="h-10 w-32 rounded-lg border border-input bg-card px-2 text-sm" />}
            <Button type="button" variant="outline" disabled={pending} onClick={() => run(async () => { const r = await setDiscountAction(invoiceId, { type: dType || null, value: Number(dValue) || 0 }); if (!r.error) setDiscOpen(false); return r; })}>
              Terapkan
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between border-t pt-3.5">
        <span className="text-[15px] font-medium">Total</span>
        <span className={`font-semibold tabular-nums ${paid > 0 ? "text-xl" : "text-[28px]"}`}>{formatRupiah(totals.grandTotal)}</span>
      </div>
      {paid > 0 && (
        <>
          <div className="flex justify-between text-[14.5px]"><span className="text-muted-foreground">DP dibayar</span><span className="tabular-nums">− {formatRupiah(paid)}</span></div>
          <div className="flex items-baseline justify-between">
            <span className="text-[15px] font-medium">Sisa</span>
            <span className="text-[28px] font-semibold tabular-nums">{formatRupiah(total)}</span>
          </div>
        </>
      )}
      {overpaid && (
        <p role="alert" className="rounded-lg border border-[#E9CFA6] p-3 text-sm text-warning">
          Total DP ({formatRupiah(paid)}) melebihi total tagihan. Minta Admin mengoreksi jumlah DP sebelum membayar.
        </p>
      )}

      {canPay && (
        <>
          {total > 0 && (
            <>
          <div className="text-sm font-medium">Metode pembayaran</div>
          <div className="grid grid-cols-2 gap-2">
            {METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={method === m.id}
                onClick={() => setMethod(m.id)}
                className={`h-[52px] rounded-lg border text-[15px] font-medium ${method === m.id ? "border-primary bg-accent text-primary shadow-[inset_0_0_0_1px_var(--color-primary)]" : "border-input bg-card"}`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {method === "TUNAI" ? (
            <div className="space-y-2">
              <label htmlFor="received" className="text-sm font-medium">Uang diterima</label>
              <div className="flex h-12 items-center gap-2 rounded-lg border border-input px-3">
                <span className="text-[15px] text-muted-foreground">Rp</span>
                <input id="received" type="number" min="0" step="1" value={received ?? String(total)} onChange={(e) => setReceived(e.target.value)} className="min-w-0 flex-1 bg-transparent text-lg font-medium tabular-nums outline-none" />
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {quick.map((v) => (
                  <button key={v} type="button" onClick={() => setReceived(String(v))} className="h-11 rounded-lg border text-[13.5px] font-medium text-[#3B434C]">
                    {v === total ? "Uang pas" : formatRupiah(v).replace("Rp ", "")}
                  </button>
                ))}
              </div>
              <div className="flex items-baseline justify-between pt-1.5">
                <span className="text-[14.5px] text-muted-foreground">Kembalian</span>
                <span className="text-xl font-semibold tabular-nums">{formatRupiah(changeDue(cash, total))}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="text-sm leading-relaxed text-muted-foreground">{HINT[method]}</p>
              {method === "QRIS" && hasQris && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/api/qris" alt="QRIS klinik" className="size-48 rounded-lg border object-contain" />
              )}
              {method === "QRIS" && !hasQris && <p className="text-sm text-warning">Gambar QRIS belum diunggah di Pengaturan.</p>}
              {method !== "QRIS" && (
                <input value={reference} onChange={(e) => setReference(e.target.value)} aria-label="Referensi pembayaran" placeholder={method === "KARTU" ? "4 digit terakhir / no. approval (opsional)" : "Referensi (opsional)"} className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm" />
              )}
            </div>
          )}
            </>
          )}

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={pending || overpaid || (total > 0 && method === "TUNAI" && cash < total)}
            onClick={() => run(() => payAction(invoiceId, { method, cashReceived: total > 0 && method === "TUNAI" ? cash : null, reference }))}
          >
            {pending ? "Memproses…" : total > 0 ? `Bayar ${formatRupiah(total)}` : "Selesaikan invoice"}
          </Button>

          {!hasPayments && (
            <>
              <Button type="button" variant="outline" className="w-full" onClick={() => setDpOpen(!dpOpen)}>
                Bayar DP
              </Button>
              {dpOpen && (
                <div className="space-y-2.5 rounded-lg bg-muted/50 p-3">
                  <label htmlFor="dp-amount" className="text-sm font-medium">Jumlah DP ({METHODS.find((m) => m.id === method)?.label})</label>
                  <div className="flex h-11 items-center gap-2 rounded-lg border border-input bg-card px-3">
                    <span className="text-sm text-muted-foreground">Rp</span>
                    <input id="dp-amount" type="number" min="1" step="1" value={dpAmount} onChange={(e) => setDpAmount(e.target.value)} className="min-w-0 flex-1 bg-transparent font-medium tabular-nums outline-none" />
                  </div>
                  {method === "TUNAI" && (
                    <div className="flex h-11 items-center gap-2 rounded-lg border border-input bg-card px-3">
                      <span className="text-sm text-muted-foreground">Diterima Rp</span>
                      <input aria-label="Uang diterima untuk DP" type="number" min="0" step="1" value={dpCash ?? dpAmount} onChange={(e) => setDpCash(e.target.value)} className="min-w-0 flex-1 bg-transparent tabular-nums outline-none" />
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pending || !(Number(dpAmount) > 0)}
                    onClick={() =>
                      run(async () => {
                        const r = await depositAction(invoiceId, { amount: Number(dpAmount), method, cashReceived: method === "TUNAI" ? Number(dpCash ?? dpAmount) : null, reference });
                        if (!r.error) { setDpOpen(false); setDpAmount(""); setDpCash(null); }
                        return r;
                      })
                    }
                  >
                    Terima DP
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
