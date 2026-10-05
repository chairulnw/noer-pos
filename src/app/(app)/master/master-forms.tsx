"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckField, Field, Section, selectClass } from "@/components/form-fields";
import { keepValuesOnError } from "@/lib/form";
import { saveBreedAction, saveSpeciesAction, type MasterFormState } from "./actions";

function Footer({ pending, state, cancel }: { pending: boolean; state: MasterFormState; cancel: string }) {
  return (
    <div className="flex items-center gap-3">
      <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Simpan"}</Button>
      <Button variant="outline" asChild><Link href={cancel}>Batal</Link></Button>
      {state.message && !state.errors?.name && <p role="status" className="text-sm text-destructive">{state.message}</p>}
    </div>
  );
}

export function SpeciesForm({ id, defaults }: { id: string | null; defaults: { name: string; active: boolean } }) {
  const [state, formAction, pending] = useActionState<MasterFormState, FormData>(saveSpeciesAction.bind(null, id), {});
  return (
    <form onSubmit={keepValuesOnError(formAction)} className="space-y-5">
      <Section title={id ? "Ubah jenis hewan" : "Jenis hewan baru"}>
        <Field label="Nama jenis hewan" name="name" errors={state.errors?.name} hint={id ? "Mengganti nama ikut memperbarui data semua pasien dengan jenis ini." : "Contoh: Kucing, Anjing, Kelinci."}>
          <Input id="name" name="name" defaultValue={defaults.name} maxLength={50} required autoFocus />
        </Field>
        <CheckField name="active" label="Aktif (muncul di form pasien)" defaultChecked={defaults.active} />
      </Section>
      <Footer pending={pending} state={state} cancel="/master/jenis-hewan" />
    </form>
  );
}

export function BreedForm({ id, species, defaults }: { id: string | null; species: { id: string; name: string }[]; defaults: { name: string; speciesId: string; active: boolean } }) {
  const [state, formAction, pending] = useActionState<MasterFormState, FormData>(saveBreedAction.bind(null, id), {});
  return (
    <form onSubmit={keepValuesOnError(formAction)} className="space-y-5">
      <Section title={id ? "Ubah ras hewan" : "Ras hewan baru"}>
        <Field label="Jenis hewan" name="speciesId" errors={state.errors?.speciesId} hint={id ? "Jenis hewan tidak bisa dipindah setelah dibuat." : undefined}>
          {id ? <input type="hidden" name="speciesId" value={defaults.speciesId} /> : null}
          <select id="speciesId" name={id ? undefined : "speciesId"} defaultValue={defaults.speciesId} disabled={Boolean(id)} className={selectClass} required>
            <option value="" disabled>Pilih jenis hewan</option>
            {species.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="Nama ras" name="name" errors={state.errors?.name} hint={id ? "Mengganti nama ikut memperbarui data pasien dengan ras ini." : undefined}>
          <Input id="name" name="name" defaultValue={defaults.name} maxLength={50} required autoFocus />
        </Field>
        <CheckField name="active" label="Aktif (muncul sebagai saran di form pasien)" defaultChecked={defaults.active} />
      </Section>
      <Footer pending={pending} state={state} cancel="/master/ras-hewan" />
    </form>
  );
}
