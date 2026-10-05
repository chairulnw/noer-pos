"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, Section, selectClass } from "@/components/form-fields";
import { keepValuesOnError } from "@/lib/form";
import { checkInAction, type AdmissionFormState } from "./actions";

type Type = "RAWAT_INAP" | "HOTEL";
type Props = {
  patientId: string;
  patientName: string;
  defaultCheckIn: string;
  rooms: { id: string; name: string; type: Type }[];
  rates: { id: string; name: string; type: Type }[];
  visits: { id: string; label: string }[];
  lockedType?: Type;
  cancelHref?: string;
};

export function CheckInForm({ patientId, patientName, defaultCheckIn, rooms, rates, visits, lockedType, cancelHref = "/rawat-inap" }: Props) {
  const [state, formAction, pending] = useActionState<AdmissionFormState, FormData>(checkInAction, {});
  const [type, setType] = useState<Type>(lockedType ?? "RAWAT_INAP");
  const err = (key: string) => state.errors?.[key];
  const roomOptions = rooms.filter((r) => r.type === type);
  const rateOptions = rates.filter((r) => r.type === type);

  return (
    <form onSubmit={keepValuesOnError(formAction)} className="space-y-5">
      <input type="hidden" name="patientId" value={patientId} />
      <Section title={`Check-in ${patientName}`}>
        {lockedType ? (
          <input type="hidden" name="type" value={lockedType} />
        ) : (
          <Field label="Jenis" name="type" errors={err("type")}>
            <select id="type" name="type" value={type} onChange={(e) => setType(e.target.value as Type)} className={selectClass}>
              <option value="RAWAT_INAP">Rawat inap</option>
              <option value="HOTEL">Pet hotel</option>
            </select>
          </Field>
        )}
        <Field label="Waktu masuk" name="checkIn" errors={err("checkIn")}>
          <Input id="checkIn" name="checkIn" type="datetime-local" defaultValue={defaultCheckIn} required />
        </Field>
        <Field label="Kandang / ruangan" name="roomId" errors={err("roomId")} hint={roomOptions.length === 0 ? "Tidak ada kandang kosong untuk jenis ini." : undefined}>
          <select id="roomId" name="roomId" defaultValue="" key={`room-${type}`} className={selectClass} required>
            <option value="" disabled>Pilih kandang</option>
            {roomOptions.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Tarif harian" name="rateItemId" errors={err("rateItemId")} hint={rateOptions.length === 0 ? "Belum ada layanan tarif per hari untuk jenis ini (Master Data)." : undefined}>
          <select id="rateItemId" name="rateItemId" defaultValue="" key={`rate-${type}`} className={selectClass} required>
            <option value="" disabled>Pilih tarif</option>
            {rateOptions.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </Field>
        {type === "RAWAT_INAP" && visits.length > 0 && (
          <Field label="Kaitkan ke kunjungan hari ini (opsional)" name="visitId" errors={err("visitId")} full>
            <select id="visitId" name="visitId" defaultValue="" className={selectClass}>
              <option value="">Tidak dikaitkan</option>
              {visits.map((v) => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Catatan (opsional)" name="notes" errors={err("notes")} full>
          <Textarea id="notes" name="notes" rows={2} />
        </Field>
      </Section>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Check-in"}</Button>
        <Button variant="outline" asChild>
          <Link href={cancelHref}>Batal</Link>
        </Button>
        {state.message && <p role="status" className="text-sm text-destructive">{state.message}</p>}
      </div>
    </form>
  );
}
