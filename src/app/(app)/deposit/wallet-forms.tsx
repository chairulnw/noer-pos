"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, Section, selectClass } from "@/components/form-fields";
import { MoneyInput } from "@/components/money-input";
import { formatRupiah } from "@/lib/format";
import { keepValuesOnError } from "@/lib/form";
import { adjustAction, topUpAction, type WalletFormState } from "./actions";

export function TopUpForm({ ownerId, ownerName, balance }: { ownerId: string; ownerName: string; balance: number }) {
  const [state, formAction, pending] = useActionState<WalletFormState, FormData>(topUpAction, {});
  const [amount, setAmount] = useState("");
  const err = (key: string) => state.errors?.[key];
  return (
    <form onSubmit={keepValuesOnError(formAction)} className="space-y-5">
      <input type="hidden" name="ownerId" value={ownerId} />
      <Section title={`Top-up saldo ${ownerName}`}>
        <p className="text-sm text-muted-foreground md:col-span-2">Saldo saat ini <b className="text-foreground tabular-nums">{formatRupiah(balance)}</b>. Saldo tidak bisa ditarik tunai.</p>
        <Field label="Nominal top-up (Rp)" name="amount" errors={err("amount")}>
          <MoneyInput id="amount" name="amount" value={amount} onValueChange={setAmount} className="h-11 w-full rounded-lg border border-input bg-card px-3 text-base tabular-nums outline-none" required autoFocus />
        </Field>
        <Field label="Metode pembayaran" name="method" errors={err("method")}>
          <select id="method" name="method" defaultValue="TUNAI" className={selectClass}>
            <option value="TUNAI">Tunai</option>
            <option value="TRANSFER">Transfer</option>
            <option value="QRIS">QRIS</option>
            <option value="KARTU">Kartu</option>
          </select>
        </Field>
        <Field label="Catatan (opsional)" name="note" errors={err("note")} full>
          <Input id="note" name="note" maxLength={200} />
        </Field>
      </Section>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending || !(Number(amount) > 0)}>{pending ? "Menyimpan…" : "Konfirmasi top-up"}</Button>
        <Button variant="outline" asChild><Link href="/deposit">Batal</Link></Button>
        {state.message && <p role="status" className="text-sm text-destructive">{state.message}</p>}
      </div>
    </form>
  );
}

export function AdjustForm({ ownerId, ownerName, balance }: { ownerId: string; ownerName: string; balance: number }) {
  const [state, formAction, pending] = useActionState<WalletFormState, FormData>(adjustAction, {});
  const [sign, setSign] = useState<1 | -1>(1);
  const [amount, setAmount] = useState("");
  const err = (key: string) => state.errors?.[key];
  return (
    <form onSubmit={keepValuesOnError(formAction)} className="space-y-5">
      <input type="hidden" name="ownerId" value={ownerId} />
      <input type="hidden" name="delta" value={amount ? String(sign * Number(amount)) : ""} />
      <Section title={`Koreksi saldo ${ownerName}`}>
        <p className="text-sm text-muted-foreground md:col-span-2">Saldo saat ini <b className="text-foreground tabular-nums">{formatRupiah(balance)}</b>. Pilih tambah atau kurangi, lalu isi nominalnya. Tercatat di audit log.</p>
        <Field label="Koreksi" name="sign">
          <select id="sign" value={sign} onChange={(e) => setSign(Number(e.target.value) as 1 | -1)} className={selectClass}>
            <option value={1}>Tambah saldo</option>
            <option value={-1}>Kurangi saldo</option>
          </select>
        </Field>
        <Field label="Nominal (Rp)" name="delta" errors={err("delta")}>
          <MoneyInput id="delta" value={amount} onValueChange={setAmount} className="h-11 w-full rounded-lg border border-input bg-card px-3 text-base tabular-nums outline-none" required autoFocus />
        </Field>
        <Field label="Alasan koreksi" name="reason" errors={err("reason")} full>
          <Textarea id="reason" name="reason" rows={2} required />
        </Field>
      </Section>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Simpan koreksi"}</Button>
        <Button variant="outline" asChild><Link href="/deposit">Batal</Link></Button>
        {state.message && <p role="status" className="text-sm text-destructive">{state.message}</p>}
      </div>
    </form>
  );
}
