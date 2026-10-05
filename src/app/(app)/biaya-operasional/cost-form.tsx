"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, Section, selectClass } from "@/components/form-fields";
import { MoneyInput } from "@/components/money-input";
import { COST_CATEGORIES } from "@/lib/cost-schema";
import { keepValuesOnError } from "@/lib/form";
import { saveCostAction, type CostFormState } from "./actions";

type Props = { id: string | null; defaults: { name: string; amount: string; category: string; costDate: string; notes: string } };

export function CostForm({ id, defaults }: Props) {
  const [state, formAction, pending] = useActionState<CostFormState, FormData>(saveCostAction.bind(null, id), {});
  const [amount, setAmount] = useState(defaults.amount);
  const err = (key: string) => state.errors?.[key];
  return (
    <form onSubmit={keepValuesOnError(formAction)} className="space-y-5">
      <Section title={id ? "Ubah biaya operasional" : "Catat biaya operasional"}>
        <Field label="Nama pengeluaran" name="name" errors={err("name")}>
          <Input id="name" name="name" defaultValue={defaults.name} placeholder="mis. Listrik Oktober, gaji staf" maxLength={150} required autoFocus />
        </Field>
        <Field label="Nominal biaya (Rp)" name="amount" errors={err("amount")}>
          <MoneyInput id="amount" name="amount" value={amount} onValueChange={setAmount} className="h-11 w-full rounded-lg border border-input bg-card px-3 text-base tabular-nums outline-none" required />
        </Field>
        <Field label="Kategori biaya" name="category" errors={err("category")}>
          <select id="category" name="category" defaultValue={defaults.category} className={selectClass} required>
            <option value="" disabled>Pilih kategori biaya</option>
            {COST_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Tanggal pengeluaran" name="costDate" errors={err("costDate")}>
          <Input id="costDate" name="costDate" type="date" defaultValue={defaults.costDate} required />
        </Field>
        <Field label="Keterangan tambahan (opsional)" name="notes" errors={err("notes")} full hint="Pembelian stok tidak dicatat di sini karena sudah masuk HPP.">
          <Textarea id="notes" name="notes" rows={2} defaultValue={defaults.notes} />
        </Field>
      </Section>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending || !(Number(amount) > 0)}>{pending ? "Menyimpan…" : "Simpan biaya"}</Button>
        <Button variant="outline" asChild><Link href="/biaya-operasional">Batal</Link></Button>
        {state.message && <p role="status" className="text-sm text-destructive">{state.message}</p>}
      </div>
    </form>
  );
}
