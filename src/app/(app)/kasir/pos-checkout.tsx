"use client";

import { Tag } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { Modal } from "@/components/modal";
import { toast } from "@/components/toaster";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";
import { setDiscountAction } from "../invoice/actions";
import { PayPanel } from "../invoice/pay-panel";

type PayProps = React.ComponentProps<typeof PayPanel>;

export function PosCheckout({ invoiceId, qty, hasItems, pay }: { invoiceId: string | null; qty: number; hasItems: boolean; pay: Omit<PayProps, "bare" | "showDiscount"> | null }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const discount = pay?.discount ?? { type: null, value: 0 };
  const [type, setType] = useState<"" | "PERCENT" | "AMOUNT">(discount.type ?? "");
  const [value, setValue] = useState(String(discount.value || ""));
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const total = pay ? Math.max(pay.totals.grandTotal - pay.paid, 0) : 0;
  const canDiscount = Boolean(pay?.canDiscount && pay.editable && hasItems);
  const discountText = pay && pay.totals.discountTotal > 0 ? `- ${formatRupiah(pay.totals.discountTotal)}` : null;

  const apply = () =>
    startTransition(async () => {
      const result = await setDiscountAction(invoiceId!, { type: type || null, value: Number(value) || 0 });
      setError(result.error);
      if (!result.error) { setOpen(false); toast("Diskon tersimpan"); }
    });

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between text-[14.5px]">
        <span className="text-muted-foreground">Total Kuantitas</span>
        <b className="tabular-nums">{qty.toLocaleString("id-ID")} item</b>
      </div>

      <div className="rounded-xl border bg-background/60">
        <div className="flex min-h-11 items-center justify-between gap-2 px-3">
          <span className="flex items-center gap-2 text-[14.5px] font-semibold"><Tag className="size-4 text-primary" /> Diskon Cart</span>
          {discountText && <span className="text-sm font-semibold tabular-nums text-destructive">{discountText}</span>}
          {canDiscount && <button type="button" onClick={() => setOpen(!open)} className="min-h-11 text-sm font-semibold text-primary">{discount.type ? "Ubah" : "+ Tambah Diskon"}</button>}
        </div>
        {open && (
          <div className="flex flex-wrap items-center gap-2 border-t p-3">
            <select aria-label="Jenis diskon" value={type} onChange={(e) => setType(e.target.value as typeof type)} className="h-10 rounded-lg border border-input bg-card px-2 text-sm">
              <option value="">Tanpa diskon</option>
              <option value="PERCENT">Persen (%)</option>
              <option value="AMOUNT">Nominal (Rp)</option>
            </select>
            {type && <input type="number" min="0" step="1" aria-label="Nilai diskon" value={value} onChange={(e) => setValue(e.target.value)} className="h-10 w-28 rounded-lg border border-input bg-card px-2 text-sm" />}
            <Button type="button" variant="outline" disabled={pending} onClick={apply}>Terapkan</Button>
            {error && <p role="alert" className="basis-full text-sm text-destructive">{error}</p>}
          </div>
        )}
      </div>

      {pay && pay.totals.taxRate > 0 && hasItems && (
        <div className="flex items-center justify-between text-[14.5px]">
          <span className="text-muted-foreground">PPN {pay.totals.taxRate}%{pay.totals.taxIncluded && " (termasuk)"}</span>
          <span className="tabular-nums">{formatRupiah(pay.totals.taxTotal)}</span>
        </div>
      )}

      <div className="flex items-baseline justify-between border-t pt-3">
        <span className="text-base font-semibold">Total Tagihan</span>
        <span className="text-[28px] font-bold text-primary tabular-nums">{formatRupiah(pay?.totals.grandTotal ?? 0)}</span>
      </div>
      {pay && pay.paid > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Sisa setelah DP</span><b className="tabular-nums">{formatRupiah(total)}</b></div>}

      <Button type="button" size="lg" className="h-14 w-full text-base" disabled={!pay || !hasItems || !pay.canPay} onClick={() => dialog.current?.showModal()}>
        Bayar ({formatRupiah(total)})
      </Button>
      {invoiceId && <Link href={`/invoice/${invoiceId}`} className="block text-center text-sm font-medium text-primary">Rincian tagihan, pembatalan, dan koreksi DP</Link>}

      {pay && (
        <Modal dialogRef={dialog}>
          <div className="max-h-[80dvh] overflow-y-auto">
            <PayPanel {...pay} bare showDiscount={false} />
          </div>
        </Modal>
      )}
    </div>
  );
}
