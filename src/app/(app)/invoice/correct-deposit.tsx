"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { correctDepositAction } from "./actions";

export function CorrectDeposit({ invoiceId, current }: { invoiceId: string; current: number }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(current));
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="min-h-11 text-sm font-medium text-primary">
        Koreksi DP
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-2.5 rounded-lg bg-muted/50 p-3">
      <div className="flex flex-wrap gap-2">
        <input type="number" min="1" step="1" aria-label="Jumlah DP baru" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-10 w-40 rounded-lg border border-input bg-card px-2.5 text-sm tabular-nums" />
        <input aria-label="Alasan koreksi" placeholder="Alasan koreksi (wajib)" value={reason} onChange={(e) => setReason(e.target.value)} className="h-10 min-w-48 flex-1 rounded-lg border border-input bg-card px-2.5 text-sm" />
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await correctDepositAction(invoiceId, Number(amount), reason);
              setError(result.error);
              if (!result.error) setOpen(false);
            })
          }
        >
          Simpan koreksi
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
      </div>
    </div>
  );
}
