"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, Section, selectClass } from "@/components/form-fields";
import { keepValuesOnError } from "@/lib/form";
import { createAppointmentAction, updateAppointmentAction, type AppointmentFormState } from "./actions";

type Props = {
  patientId?: string;
  appointmentId?: string;
  doctors: { id: string; name: string }[];
  defaults: { doctorId: string; scheduledAt: string; purpose: string; notes: string };
  cancelHref: string;
};

export function AppointmentForm({ patientId, appointmentId, doctors, defaults, cancelHref }: Props) {
  const action = appointmentId ? updateAppointmentAction.bind(null, appointmentId) : createAppointmentAction.bind(null, patientId ?? "");
  const [state, formAction, pending] = useActionState<AppointmentFormState, FormData>(action, {});
  const err = (key: string) => state.errors?.[key];

  return (
    <form onSubmit={keepValuesOnError(formAction)} className="space-y-5">
      <Section title={appointmentId ? "Ubah janji temu" : "Janji temu baru"}>
        <Field label="Dokter pemeriksa" name="doctorId" errors={err("doctorId")}>
          <select id="doctorId" name="doctorId" defaultValue={defaults.doctorId} className={selectClass} required>
            <option value="" disabled>Pilih dokter</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
        <Field label="Tanggal dan jam" name="scheduledAt" errors={err("scheduledAt")}>
          <Input id="scheduledAt" name="scheduledAt" type="datetime-local" defaultValue={defaults.scheduledAt} required />
        </Field>
        <Field label="Keperluan" name="purpose" errors={err("purpose")} full hint="Contoh: konsultasi, vaksinasi, kontrol, operasi, grooming.">
          <Input id="purpose" name="purpose" defaultValue={defaults.purpose} maxLength={200} required autoFocus />
        </Field>
        <Field label="Catatan (opsional)" name="notes" errors={err("notes")} full>
          <Textarea id="notes" name="notes" rows={2} defaultValue={defaults.notes} />
        </Field>
      </Section>

      {state.conflict && (
        <div role="alert" className="space-y-2 rounded-lg border border-[#E9CFA6] p-4 text-sm">
          <p className="text-warning">Dokter ini sudah punya janji temu pada waktu berdekatan: <strong>{state.conflict.join(", ")}</strong>. Janji temu boleh tumpang tindih.</p>
          <Button type="submit" name="confirmConflict" value="1" variant="outline" disabled={pending}>Tetap simpan</Button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Simpan janji temu"}</Button>
        <Button variant="outline" asChild><Link href={cancelHref}>Batal</Link></Button>
        {state.message && <p role="status" className="text-sm text-destructive">{state.message}</p>}
      </div>
    </form>
  );
}
