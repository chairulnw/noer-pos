"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, Section, selectClass } from "@/components/form-fields";
import { keepValuesOnError } from "@/lib/form";
import { createVisitAction, type VisitFormState } from "./actions";

export function VisitForm({
  patientId,
  doctors,
  defaultDoctorId,
}: {
  patientId: string;
  doctors: { id: string; name: string }[];
  defaultDoctorId?: string;
}) {
  const [state, formAction, pending] = useActionState<VisitFormState, FormData>(
    createVisitAction.bind(null, patientId),
    {},
  );
  const err = (key: string) => state.errors?.[key];

  return (
    <form onSubmit={keepValuesOnError(formAction)} className="space-y-5">
      <Section title="Kunjungan baru">
        <Field label="Dokter" name="doctorId" errors={err("doctorId")}>
          <select id="doctorId" name="doctorId" defaultValue={defaultDoctorId ?? ""} className={selectClass} required>
            <option value="" disabled>
              Pilih dokter
            </option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Keluhan" name="complaint" errors={err("complaint")} full>
          <Textarea id="complaint" name="complaint" rows={3} required autoFocus />
        </Field>
      </Section>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : "Buat kunjungan"}
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/pasien/${patientId}`}>Batal</Link>
        </Button>
        {state.message && <p role="status" className="text-sm text-destructive">{state.message}</p>}
      </div>
    </form>
  );
}
