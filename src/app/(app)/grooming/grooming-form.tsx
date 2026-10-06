"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, Section, selectClass } from "@/components/form-fields";
import { keepValuesOnError } from "@/lib/form";
import { createGroomingAction, type GroomingFormState } from "./actions";

export function GroomingForm({ patientId, services, defaultDate }: { patientId: string; services: { id: string; name: string }[]; defaultDate: string }) {
  const [state, formAction, pending] = useActionState<GroomingFormState, FormData>(createGroomingAction.bind(null, patientId), {});
  const err = (key: string) => state.errors?.[key];
  return (
    <form onSubmit={keepValuesOnError(formAction)} className="space-y-5">
      <Section title="Grooming baru">
        <Field label="Layanan" name="serviceItemId" errors={err("serviceItemId")} hint={services.length === 0 ? "Belum ada layanan kategori grooming. Tambahkan di Produk." : undefined}>
          <select id="serviceItemId" name="serviceItemId" defaultValue="" className={selectClass} required>
            <option value="" disabled>Pilih layanan</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="Tanggal" name="groomingDate" errors={err("groomingDate")}>
          <Input id="groomingDate" name="groomingDate" type="date" defaultValue={defaultDate} required />
        </Field>
        <Field label="Catatan (opsional)" name="notes" errors={err("notes")} full>
          <Textarea id="notes" name="notes" rows={3} placeholder="mis. kutu, bulu kusut, sensitif disentuh" />
        </Field>
      </Section>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Simpan"}</Button>
        <Button variant="outline" asChild><Link href="/grooming">Batal</Link></Button>
        {state.message && <p role="status" className="text-sm text-destructive">{state.message}</p>}
      </div>
    </form>
  );
}
