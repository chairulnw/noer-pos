"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, Section, selectClass } from "@/components/form-fields";
import { keepValuesOnError } from "@/lib/form";
import { createSurgeryAction, updateSurgeryAction, type SurgeryFormState } from "./actions";

type Props = {
  patientId?: string;
  surgeryId?: string;
  doctors: { id: string; name: string }[];
  services: { id: string; name: string }[];
  defaults: { procedure: string; anesthesia: string; surgeryDate: string; doctorId: string; serviceItemId: string; preNotes: string };
  cancelHref: string;
};

export function SurgeryForm({ patientId, surgeryId, doctors, services, defaults, cancelHref }: Props) {
  const action = surgeryId ? updateSurgeryAction.bind(null, surgeryId) : createSurgeryAction.bind(null, patientId ?? "");
  const [state, formAction, pending] = useActionState<SurgeryFormState, FormData>(action, {});
  const err = (key: string) => state.errors?.[key];
  return (
    <form onSubmit={keepValuesOnError(formAction)} className="space-y-5">
      <Section title={surgeryId ? "Ubah jadwal operasi" : "Jadwal operasi baru"}>
        <Field label="Prosedur / tindakan" name="procedure" errors={err("procedure")} full>
          <Input id="procedure" name="procedure" defaultValue={defaults.procedure} maxLength={150} placeholder="mis. Sterilisasi kucing betina, pengangkatan tumor" required autoFocus />
        </Field>
        <Field label="Tanggal operasi" name="surgeryDate" errors={err("surgeryDate")}>
          <Input id="surgeryDate" name="surgeryDate" type="date" defaultValue={defaults.surgeryDate} required />
        </Field>
        <Field label="Dokter operator" name="doctorId" errors={err("doctorId")}>
          <select id="doctorId" name="doctorId" defaultValue={defaults.doctorId} className={selectClass} required>
            <option value="" disabled>Pilih dokter</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
        <Field label="Zat / protokol anestesi" name="anesthesia" errors={err("anesthesia")}>
          <Input id="anesthesia" name="anesthesia" defaultValue={defaults.anesthesia} maxLength={150} />
        </Field>
        <Field label="Layanan operasi (untuk tagihan)" name="serviceItemId" errors={err("serviceItemId")} hint="Masuk ke draft tagihan otomatis saat operasi selesai. Obat dan bahan ditambahkan di kasir.">
          <select id="serviceItemId" name="serviceItemId" defaultValue={defaults.serviceItemId} className={selectClass}>
            <option value="">Tanpa layanan (tagihan kosong)</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="Catatan pra-operasi (opsional)" name="preNotes" errors={err("preNotes")} full>
          <Textarea id="preNotes" name="preNotes" rows={3} defaultValue={defaults.preNotes} />
        </Field>
      </Section>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Simpan"}</Button>
        <Button variant="outline" asChild><Link href={cancelHref}>Batal</Link></Button>
        {state.message && <p role="status" className="text-sm text-destructive">{state.message}</p>}
      </div>
    </form>
  );
}
