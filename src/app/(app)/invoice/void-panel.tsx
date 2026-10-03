"use client";

import { useRef, useState, useTransition } from "react";
import { Modal } from "@/components/modal";
import { menuItemClass } from "@/components/more-menu";
import { toast } from "@/components/toaster";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { voidAction } from "./actions";

export function VoidPanel({ invoiceId, invoiceNo, products }: { invoiceId: string; invoiceNo: string; products: { id: string; name: string; qty: number }[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState("");
  const [restock, setRestock] = useState<string[]>(products.map((p) => p.id));
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button type="button" role="menuitem" onClick={() => dialog.current?.showModal()} className={`${menuItemClass} text-destructive`}>
        Void invoice
      </button>
      <Modal dialogRef={dialog}>
    <section aria-label="Void invoice" className="space-y-3.5">
      <h2 className="text-base font-semibold text-destructive">Void {invoiceNo}</h2>
      <p className="text-sm text-muted-foreground">
        Void membatalkan invoice, bukan refund. Pembayaran yang sudah masuk tetap tercatat dan ditandai void. Jika uang dikembalikan, lakukan di luar sistem dan catat di alasan.
      </p>
      <div className="space-y-1.5">
        <label htmlFor="void-reason" className="text-sm font-medium">Alasan</label>
        <Textarea id="void-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
      {products.length > 0 && (
        <fieldset className="space-y-1">
          <legend className="text-sm font-medium">Kembalikan stok</legend>
          {products.map((p) => (
            <label key={p.id} className="flex min-h-11 items-center gap-2.5 text-[14.5px]">
              <input
                type="checkbox"
                className="size-5 accent-primary"
                checked={restock.includes(p.id)}
                onChange={(e) => setRestock((cur) => (e.target.checked ? [...cur, p.id] : cur.filter((x) => x !== p.id)))}
              />
              {p.name} <span className="text-muted-foreground tabular-nums">× {p.qty}</span>
            </label>
          ))}
        </fieldset>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="destructive"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await voidAction(invoiceId, { reason, restockLineIds: restock });
              setError(result.error);
              if (!result.error) { dialog.current?.close(); toast("Invoice di-void"); }
            })
          }
        >
          {pending ? "Memproses…" : "Void invoice"}
        </Button>
        <Button type="button" variant="outline" onClick={() => dialog.current?.close()}>
          Batal
        </Button>
      </div>
    </section>
      </Modal>
    </>
  );
}
