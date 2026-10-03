"use client";

import { useActionState, useState } from "react";
import { ConfirmButton } from "@/components/confirm-button";
import { Input, inputClass } from "@/components/ui/input";
import { MoneyInput } from "@/components/money-input";
import { Field, Section } from "@/components/form-fields";
import { keepValuesOnError } from "@/lib/form";
import { formatRupiah } from "@/lib/format";
import { closeCashAction, type CashFormState } from "./actions";

export function CashForm({ suggestedOpening }: { suggestedOpening: number }) {
  const [state, formAction, pending] = useActionState<CashFormState, FormData>(closeCashAction, {});
  const [opening, setOpening] = useState(String(suggestedOpening));
  const [counted, setCounted] = useState("");
  const err = (key: string) => state.errors?.[key];
  const ready = counted.trim() !== "" && opening.trim() !== "";

  return (
    <form onSubmit={keepValuesOnError(formAction)} className="space-y-5">
      <Section title="Tutup kas hari ini">
        <Field label="Modal awal (Rp)" name="openingCash" errors={err("openingCash")} hint="Uang di laci saat mulai hari ini. Terisi dari hitung fisik penutupan terakhir.">
          <MoneyInput id="openingCash" name="openingCash" className={inputClass} value={opening} onValueChange={(v) => { setOpening(v); }} required />
        </Field>
        <Field label="Hitung fisik (Rp)" name="countedCash" errors={err("countedCash")} hint="Total uang tunai di laci saat ini, dihitung langsung.">
          <MoneyInput id="countedCash" name="countedCash" className={inputClass} value={counted} onValueChange={(v) => { setCounted(v); }} required />
        </Field>
        <Field label="Catatan (wajib bila ada selisih)" name="note" errors={err("note")} full>
          <Input id="note" name="note" maxLength={300} placeholder="mis. kembalian kurang Rp 2.000" />
        </Field>
      </Section>

      {state.message && <p role="alert" className="text-sm text-destructive">{state.message}</p>}

      <ConfirmButton
        disabled={!ready || pending}
        confirmLabel="Ya, tutup kas"
        message={`Kas ditutup dengan modal awal ${formatRupiah(Number(opening))} dan hitung fisik ${formatRupiah(Number(counted))}. Tidak bisa diubah setelah disimpan.`}
      >
        {pending ? "Menyimpan…" : "Tutup kas"}
      </ConfirmButton>
    </form>
  );
}
