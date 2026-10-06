"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { selectClass } from "@/components/form-fields";
import { keepValuesOnError } from "@/lib/form";
import {
  addAddendumAction,
  addAttachmentAction,
  addVaccinationAction,
  type RecordFormState,
} from "./actions";

function Message({ state }: { state: RecordFormState }) {
  return state.message ? <p role="status" className="text-sm text-destructive">{state.message}</p> : null;
}

function Errors({ errors }: { errors?: string[] }) {
  return errors?.map((e) => (
    <p key={e} className="text-[12.5px] text-destructive">
      {e}
    </p>
  ));
}

export function VaccinationForm({ visitId, recordId, vaccines, today }: { visitId: string; recordId: string; vaccines: { id: string; name: string }[]; today: string }) {
  const [state, formAction, pending] = useActionState<RecordFormState, FormData>(addVaccinationAction.bind(null, visitId, recordId), {});

  return (
    <form
      key={state.nonce}
      onSubmit={keepValuesOnError(formAction)}
      className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] items-end gap-3"
    >
      <div className="space-y-1.5">
        <label htmlFor="itemId" className="text-[13px] font-medium">Vaksin</label>
        <select id="itemId" name="itemId" defaultValue="" className={selectClass} required>
          <option value="" disabled>Pilih vaksin</option>
          {vaccines.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
        <Errors errors={state.errors?.itemId} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="givenAt" className="text-[13px] font-medium">Tanggal diberikan</label>
        <Input id="givenAt" name="givenAt" type="date" defaultValue={today} required />
        <Errors errors={state.errors?.givenAt} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="batchNo" className="text-[13px] font-medium">No. batch</label>
        <Input id="batchNo" name="batchNo" />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="nextDue" className="text-[13px] font-medium">Jatuh tempo berikutnya</label>
        <Input id="nextDue" name="nextDue" type="date" />
        <p className="text-[12.5px] text-muted-foreground">Kosong = ikut interval vaksin</p>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="outline" disabled={pending}>Catat vaksin</Button>
      </div>
      <Message state={state} />
    </form>
  );
}

export function AddendumForm({ visitId, recordId }: { visitId: string; recordId: string }) {
  const [state, formAction, pending] = useActionState<RecordFormState, FormData>(addAddendumAction.bind(null, visitId, recordId), {});

  return (
    <form key={state.nonce} onSubmit={keepValuesOnError(formAction)} className="space-y-3">
      <Textarea name="note" rows={3} placeholder="Catatan tambahan atau koreksi" aria-label="Catatan addendum" required />
      <Errors errors={state.errors?.note} />
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>Tambah addendum</Button>
        <Message state={state} />
      </div>
    </form>
  );
}

export function AttachmentForm({ visitId, recordId }: { visitId: string; recordId: string }) {
  const [state, formAction, pending] = useActionState<RecordFormState, FormData>(addAttachmentAction.bind(null, visitId, recordId), {});

  return (
    <form key={state.nonce} onSubmit={keepValuesOnError(formAction)} className="flex flex-wrap items-center gap-3">
      <Input name="file" type="file" accept="application/pdf,image/jpeg,image/png" aria-label="File lampiran" className="max-w-xs" />
      <Button type="submit" variant="outline" disabled={pending}>Unggah</Button>
      <Message state={state} />
    </form>
  );
}
