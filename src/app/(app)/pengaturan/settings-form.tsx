"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckField, Field, Section, selectClass } from "@/components/form-fields";
import type { Settings } from "@/lib/settings-schema";
import { keepValuesOnError } from "@/lib/form";
import { updateSettings, type SettingsState } from "./actions";

export function SettingsForm({ settings }: { settings: Settings }) {
  const [editing, setEditing] = useState(false);
  const [version, setVersion] = useState(0);
  return <SettingsFields key={version} settings={settings} editing={editing} onEdit={() => setEditing(true)} onDone={(reset) => { setEditing(false); if (reset) setVersion((v) => v + 1); }} />;
}

function SettingsFields({ settings, editing, onEdit, onDone }: { settings: Settings; editing: boolean; onEdit: () => void; onDone: (reset: boolean) => void }) {
  const [state, formAction, pending] = useActionState<SettingsState, FormData>(async (prev, formData) => {
    const result = await updateSettings(prev, formData);
    if (result.ok) onDone(false);
    return result;
  }, {});
  const err = (key: string) => state.errors?.[key];

  return (
    <form onSubmit={keepValuesOnError(formAction)} className="space-y-5">
      <fieldset disabled={!editing} className="space-y-5">
      <Section title="Data klinik">
        <Field label="Nama klinik" name="clinicName" errors={err("clinicName")} full>
          <Input id="clinicName" name="clinicName" defaultValue={settings.clinicName} required />
        </Field>
        <Field label="Alamat" name="address" errors={err("address")} full>
          <Textarea id="address" name="address" defaultValue={settings.address} rows={2} />
        </Field>
        <Field label="Telepon" name="phone" errors={err("phone")}>
          <Input id="phone" name="phone" defaultValue={settings.phone} inputMode="tel" />
        </Field>
        <Field label="NPWP" name="npwp" errors={err("npwp")}>
          <Input id="npwp" name="npwp" defaultValue={settings.npwp} />
        </Field>
        <Field label="Logo (PNG/JPG/WebP, maks 200 KB)" name="logoFile" errors={err("logo")}>
          <Input id="logoFile" name="logoFile" type="file" accept="image/png,image/jpeg,image/webp" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {settings.logo && <img src={settings.logo} alt="Logo saat ini" className="mt-2 h-10 w-auto" />}
        </Field>
      </Section>

      <Section title="Struk & PPN">
        <Field label="Footer struk" name="receiptFooter" errors={err("receiptFooter")} full>
          <Input id="receiptFooter" name="receiptFooter" defaultValue={settings.receiptFooter} />
        </Field>
        <Field label="Gambar QRIS statis (PNG/JPG/WebP, maks 1 MB)" name="qrisFile" errors={err("qris")}>
          <Input id="qrisFile" name="qrisFile" type="file" accept="image/png,image/jpeg,image/webp" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {settings.qris && <img src={settings.qris} alt="QRIS saat ini" className="mt-2 size-24 rounded border object-contain" />}
        </Field>
        <CheckField name="taxEnabled" label="Aktifkan PPN" defaultChecked={settings.taxEnabled} />
        <Field label="Tarif PPN (%)" name="taxRate" errors={err("taxRate")}>
          <Input id="taxRate" name="taxRate" type="number" min={0} max={100} step={1} defaultValue={settings.taxRate} />
        </Field>
        <Field label="Mode PPN" name="taxMode" errors={err("taxMode")}>
          <select id="taxMode" name="taxMode" defaultValue={settings.taxMode} className={selectClass}>
            <option value="EXCLUDE">Exclude (ditambahkan di atas harga)</option>
            <option value="INCLUDE">Include (sudah termasuk di harga)</option>
          </select>
        </Field>
      </Section>

      <Section title="Stok">
        <Field label="Peringatan hampir expired (hari)" name="expiryWarningDays" errors={err("expiryWarningDays")}>
          <Input
            id="expiryWarningDays"
            name="expiryWarningDays"
            type="number"
            min={1}
            max={365}
            step={1}
            defaultValue={settings.expiryWarningDays}
          />
        </Field>
      </Section>

      <Section title="Pilihan cepat rekam medis">
        <p className="text-sm text-muted-foreground md:col-span-2">Tombol pintas di form pemeriksaan. Satu pilihan per baris, maksimal 20 pilihan.</p>
        {([
          ["quickSubjective", "S · Keluhan (Subjective)"],
          ["quickObjective", "O · Pemeriksaan fisik (Objective)"],
          ["quickAssessment", "A · Diagnosis (Assessment)"],
          ["quickPlan", "P · Rencana tindakan (Plan)"],
        ] as const).map(([name, label]) => (
          <Field key={name} label={label} name={name} errors={err(name)}>
            <Textarea id={name} name={name} rows={6} defaultValue={settings[name]} />
          </Field>
        ))}
      </Section>

      </fieldset>

      <div className="flex items-center gap-3">
        {editing ? (
          <>
            <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Simpan"}</Button>
            <Button type="button" variant="outline" disabled={pending} onClick={() => onDone(true)}>Batal</Button>
          </>
        ) : (
          <Button type="button" onClick={(e) => { e.preventDefault(); onEdit(); }}>Ubah data klinik</Button>
        )}
        {state.message && (
          <p role="status" className={`text-sm ${state.ok ? "text-success" : "text-destructive"}`}>
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
