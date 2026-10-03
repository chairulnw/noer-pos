"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/form-fields";
import { keepValuesOnError } from "@/lib/form";
import { addLogAction, type AdmissionFormState } from "./actions";

export function LogForm({ admissionId, defaultTime }: { admissionId: string; defaultTime: string }) {
  const [state, formAction, pending] = useActionState<AdmissionFormState, FormData>(addLogAction.bind(null, admissionId), {});
  const err = (key: string) => state.errors?.[key];

  return (
    <form key={state.nonce} onSubmit={keepValuesOnError(formAction)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Waktu" name="loggedAt" errors={err("loggedAt")}>
          <Input id="loggedAt" name="loggedAt" type="datetime-local" defaultValue={defaultTime} required />
        </Field>
        <Field label="Suhu (°C)" name="temp" errors={err("temp")}>
          <Input id="temp" name="temp" type="number" step="0.1" min={30} max={45} />
        </Field>
        <Field label="Makan / minum" name="intake" errors={err("intake")}>
          <Input id="intake" name="intake" placeholder="mis. makan ½ porsi, minum cukup" />
        </Field>
      </div>
      <Field label="Catatan" name="note" errors={err("note")}>
        <Textarea id="note" name="note" rows={2} />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Simpan monitoring"}</Button>
        {state.message && <p role="status" className="text-sm text-destructive">{state.message}</p>}
      </div>
    </form>
  );
}
