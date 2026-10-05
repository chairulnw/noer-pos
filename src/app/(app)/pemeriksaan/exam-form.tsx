"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, Section, selectClass } from "@/components/form-fields";
import { EXAM, type ExaminationType } from "@/lib/examination-schema";
import { keepValuesOnError } from "@/lib/form";
import { formatDate } from "@/lib/format";
import { createExamAction, updateExamAction, type ExamFormState } from "./actions";

type Props = {
  type: ExaminationType;
  patientId?: string;
  examId?: string;
  defaults: { name: string; performedAt: string; findings: string; notes: string; recordId: string };
  records: { id: string; visitDate: Date; diagnosis: string | null }[];
  cancelHref: string;
};

export function ExamForm({ type, patientId, examId, defaults, records, cancelHref }: Props) {
  const config = EXAM[type];
  const action = examId ? updateExamAction.bind(null, examId) : createExamAction.bind(null, type, patientId ?? "");
  const [state, formAction, pending] = useActionState<ExamFormState, FormData>(action, {});
  const err = (key: string) => state.errors?.[key];

  return (
    <form onSubmit={keepValuesOnError(formAction)} className="space-y-5">
      <Section title={examId ? `Ubah ${config.singular}` : `${config.title} baru`}>
        <Field label={config.nameLabel} name="name" errors={err("name")}>
          <Input id="name" name="name" list="exam-suggestions" defaultValue={defaults.name} maxLength={150} required autoFocus />
          <datalist id="exam-suggestions">{config.suggestions.map((s) => <option key={s} value={s} />)}</datalist>
        </Field>
        <Field label="Tanggal pemeriksaan" name="performedAt" errors={err("performedAt")}>
          <Input id="performedAt" name="performedAt" type="date" defaultValue={defaults.performedAt} required />
        </Field>
        <Field label={config.findingsLabel} name="findings" errors={err("findings")} full>
          <Textarea id="findings" name="findings" rows={5} defaultValue={defaults.findings} required={type === "RADIOLOGI"} />
        </Field>
        <Field label={`${config.notesLabel} (opsional)`} name="notes" errors={err("notes")} full>
          <Textarea id="notes" name="notes" rows={3} defaultValue={defaults.notes} />
        </Field>
        {records.length > 0 && (
          <Field label="Rekam medis terkait (opsional)" name="recordId" errors={err("recordId")} full>
            <select id="recordId" name="recordId" defaultValue={defaults.recordId} className={selectClass}>
              <option value="">Tidak dikaitkan</option>
              {records.map((r) => <option key={r.id} value={r.id}>{formatDate(r.visitDate)}{r.diagnosis ? ` · ${r.diagnosis}` : ""}</option>)}
            </select>
          </Field>
        )}
      </Section>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Simpan"}</Button>
        <Button variant="outline" asChild><Link href={cancelHref}>Batal</Link></Button>
        {state.message && <p role="status" className="text-sm text-destructive">{state.message}</p>}
      </div>
    </form>
  );
}
