"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmButton } from "@/components/confirm-button";
import { keepValuesOnError } from "@/lib/form";
import { addAddendumAction, changeStatusAction, type SurgeryFormState } from "./actions";

function Message({ state }: { state: SurgeryFormState }) {
  return state.message ? <p role="status" className="text-sm text-destructive">{state.message}</p> : null;
}

export function StartButton({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState<SurgeryFormState, FormData>(changeStatusAction.bind(null, id, "BERJALAN"), {});
  return (
    <form action={formAction} className="flex items-center gap-3">
      <Button type="submit" disabled={pending}>Mulai operasi</Button>
      <Message state={state} />
    </form>
  );
}

export function CompleteForm({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState<SurgeryFormState, FormData>(changeStatusAction.bind(null, id, "SELESAI"), {});
  const [notes, setNotes] = useState("");
  return (
    <form onSubmit={keepValuesOnError(formAction)} className="space-y-3">
      <Textarea name="postNotes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan pasca-operasi, instruksi perawatan, obat yang diberikan" aria-label="Catatan pasca-operasi" />
      <div className="flex flex-wrap items-center gap-3">
        <ConfirmButton disabled={pending || !notes.trim()} confirmLabel="Ya, selesaikan" message="Selesaikan operasi? Catatan terkunci (koreksi lewat addendum) dan draft tagihan dibuat untuk kasir.">Selesaikan operasi</ConfirmButton>
        <Message state={state} />
      </div>
    </form>
  );
}

export function CancelButton({ id }: { id: string }) {
  const [state, formAction] = useActionState<SurgeryFormState, FormData>(changeStatusAction.bind(null, id, "BATAL"), {});
  return (
    <form action={formAction} className="flex items-center gap-3">
      <ConfirmButton variant="outline" confirmLabel="Ya, batalkan" message="Batalkan operasi ini?">Batalkan</ConfirmButton>
      <Message state={state} />
    </form>
  );
}

export function AddendumForm({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState<SurgeryFormState, FormData>(addAddendumAction.bind(null, id), {});
  return (
    <form key={state.nonce} onSubmit={keepValuesOnError(formAction)} className="space-y-3">
      <Textarea name="note" rows={3} placeholder="Catatan tambahan atau koreksi" aria-label="Catatan addendum" required />
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>Tambah addendum</Button>
        <Message state={state} />
      </div>
    </form>
  );
}
