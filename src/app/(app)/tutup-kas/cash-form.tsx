"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Section } from "@/components/form-fields";
import { keepValuesOnError } from "@/lib/form";
import { formatRupiah } from "@/lib/format";
import { closeCashAction, type CashFormState } from "./actions";

export function CashForm({ suggestedOpening }: { suggestedOpening: number }) {
  const [state, formAction, pending] = useActionState<CashFormState, FormData>(closeCashAction, {});
  const [opening, setOpening] = useState(String(suggestedOpening));
  const [counted, setCounted] = useState("");
  const [confirming, setConfirming] = useState(false);
  const err = (key: string) => state.errors?.[key];
  const ready = counted.trim() !== "" && opening.trim() !== "";

  return (
    <form onSubmit={keepValuesOnError(formAction)} className="max-w-4xl space-y-5">
      <Section title="Tutup kas hari ini">
        <Field label="Modal awal (Rp)" name="openingCash" errors={err("openingCash")} hint="Uang di laci saat mulai hari ini. Terisi dari hitung fisik penutupan terakhir.">
          <Input id="openingCash" name="openingCash" type="number" min="0" step="1" inputMode="numeric" value={opening} onChange={(e) => { setOpening(e.target.value); setConfirming(false); }} required />
        </Field>
        <Field label="Hitung fisik (Rp)" name="countedCash" errors={err("countedCash")} hint="Total uang tunai di laci saat ini, dihitung langsung.">
          <Input id="countedCash" name="countedCash" type="number" min="0" step="1" inputMode="numeric" value={counted} onChange={(e) => { setCounted(e.target.value); setConfirming(false); }} required />
        </Field>
        <Field label="Catatan (wajib bila ada selisih)" name="note" errors={err("note")} full>
          <Input id="note" name="note" maxLength={300} placeholder="mis. kembalian kurang Rp 2.000" />
        </Field>
      </Section>

      {state.message && <p role="alert" className="text-sm text-destructive">{state.message}</p>}

      {confirming ? (
        <div className="space-y-3 rounded-[10px] border border-primary bg-accent p-4">
          <p className="text-sm">Kas ditutup dengan modal awal <b>{formatRupiah(Number(opening))}</b> dan hitung fisik <b>{formatRupiah(Number(counted))}</b>. Tidak bisa diubah setelah disimpan.</p>
          <div className="flex gap-3">
            <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Ya, tutup kas"}</Button>
            <Button type="button" variant="outline" onClick={() => setConfirming(false)}>Periksa lagi</Button>
          </div>
        </div>
      ) : (
        <Button type="button" disabled={!ready} onClick={() => setConfirming(true)}>Tutup kas</Button>
      )}
    </form>
  );
}
