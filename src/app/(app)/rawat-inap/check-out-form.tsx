"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { billedDays, jakartaLocalToDate } from "@/lib/admission-calc";
import { formatRupiah } from "@/lib/format";
import { keepValuesOnError } from "@/lib/form";
import { checkOutAction, type AdmissionFormState } from "./actions";

type Props = { admissionId: string; checkInIso: string; defaultCheckOut: string; rateName: string; ratePrice: number | null };

export function CheckOutForm({ admissionId, checkInIso, defaultCheckOut, rateName, ratePrice }: Props) {
  const [state, formAction, pending] = useActionState<AdmissionFormState, FormData>(checkOutAction.bind(null, admissionId), {});
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const out = jakartaLocalToDate(checkOut);
  const valid = !Number.isNaN(out.getTime()) && out >= new Date(checkInIso);
  const days = valid ? billedDays(new Date(checkInIso), out) : null;

  return (
    <form onSubmit={keepValuesOnError(formAction)} className="max-w-4xl max-w-xl space-y-5">
      <section className="space-y-4 rounded-[10px] border bg-card p-5">
        <div className="space-y-1.5">
          <label htmlFor="checkOut" className="text-sm font-medium">Waktu keluar</label>
          <Input id="checkOut" name="checkOut" type="datetime-local" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required />
        </div>
        <div className="rounded-lg bg-muted/50 p-4 text-[14.5px]">
          {days === null ? (
            <span className="text-destructive">Waktu keluar tidak boleh sebelum waktu masuk.</span>
          ) : (
            <>
              <div className="flex justify-between"><span className="text-muted-foreground">Lama menginap</span><span className="font-semibold tabular-nums">{days} hari</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tarif</span><span>{rateName}</span></div>
              {ratePrice !== null && (
                <div className="mt-1.5 flex justify-between border-t pt-1.5"><span className="text-muted-foreground">{days} × {formatRupiah(ratePrice)}</span><span className="font-semibold tabular-nums">{formatRupiah(days * ratePrice)}</span></div>
              )}
              <p className="mt-2 text-[13px] text-muted-foreground">Hari dihitung dari selisih tanggal kalender, minimal 1 hari. Item tarif × hari masuk ke draft invoice.</p>
            </>
          )}
        </div>
      </section>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending || days === null}>{pending ? "Memproses…" : "Check-out & buka invoice"}</Button>
        <Button variant="outline" asChild>
          <Link href="/rawat-inap">Batal</Link>
        </Button>
        {state.message && <p role="status" className="text-sm text-destructive">{state.message}</p>}
      </div>
    </form>
  );
}
