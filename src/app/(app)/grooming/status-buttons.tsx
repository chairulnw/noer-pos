"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/confirm-button";
import type { GroomingStatus } from "@/lib/grooming-schema";
import { changeGroomingStatusAction, type GroomingFormState } from "./actions";

export function StatusButtons({ id, status }: { id: string; status: GroomingStatus }) {
  const to: GroomingStatus = status === "MENUNGGU" ? "PROSES" : "SELESAI";
  const [state, forward, pending] = useActionState<GroomingFormState>(changeGroomingStatusAction.bind(null, id, to), {});
  const [cancelState, cancel] = useActionState<GroomingFormState>(changeGroomingStatusAction.bind(null, id, "BATAL"), {});
  const message = state.message ?? cancelState.message;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <form action={forward}>
        {to === "PROSES" ? <Button type="submit" disabled={pending}>Mulai grooming</Button> : <ConfirmButton disabled={pending} confirmLabel="Ya, selesaikan" message="Selesaikan grooming? Draft tagihan dibuat untuk kasir.">Selesaikan</ConfirmButton>}
      </form>
      <form action={cancel}><ConfirmButton variant="outline" confirmLabel="Ya, batalkan" message="Batalkan grooming ini?">Batalkan</ConfirmButton></form>
      {message && <p role="status" className="text-sm text-destructive">{message}</p>}
    </div>
  );
}
