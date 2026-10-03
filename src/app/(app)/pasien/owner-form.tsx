"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, Section } from "@/components/form-fields";
import { keepValuesOnError } from "@/lib/form";
import { saveOwnerAction, type PatientFormState } from "./actions";

type Owner = { id: string; name: string; whatsapp: string; address: string; notes: string | null };

export function OwnerForm({ owner }: { owner: Owner | null }) {
  const [state, formAction, pending] = useActionState<PatientFormState, FormData>(
    saveOwnerAction.bind(null, owner?.id ?? null),
    {},
  );
  const err = (key: string) => state.errors?.[key];

  return (
    <form onSubmit={keepValuesOnError(formAction)} className="max-w-3xl space-y-5">
      <Section title="Data owner">
        <Field label="Nama" name="name" errors={err("name")}>
          <Input id="name" name="name" defaultValue={owner?.name} required autoFocus />
        </Field>
        <Field label="No. WhatsApp" name="whatsapp" errors={err("whatsapp")}>
          <Input id="whatsapp" name="whatsapp" inputMode="tel" defaultValue={owner?.whatsapp ? `0${owner.whatsapp.slice(2)}` : ""} placeholder="0812-3456-7890" required />
        </Field>
        <Field label="Alamat" name="address" errors={err("address")} full>
          <Textarea id="address" name="address" defaultValue={owner?.address} rows={2} required />
        </Field>
        <Field label="Catatan (opsional)" name="notes" errors={err("notes")} full>
          <Textarea id="notes" name="notes" defaultValue={owner?.notes ?? ""} rows={2} />
        </Field>
      </Section>

      {state.duplicate && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-[10px] border border-[#E9CFA6] bg-card p-4 text-sm">
          <span className="flex-1 basis-60 text-warning">
            Nomor WhatsApp ini sudah terdaftar atas nama <strong>{state.duplicate}</strong>.
          </span>
          <Button type="submit" name="confirmDuplicate" value="1" variant="outline" disabled={pending}>
            Tetap simpan
          </Button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan"}
        </Button>
        <Button variant="outline" asChild>
          <Link href={owner ? `/pasien/owner/${owner.id}` : "/pasien"}>Batal</Link>
        </Button>
        {state.message && <p role="status" className="text-sm text-destructive">{state.message}</p>}
      </div>
    </form>
  );
}
