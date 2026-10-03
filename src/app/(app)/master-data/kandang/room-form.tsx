"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckField, Field, Section, selectClass } from "@/components/form-fields";
import { keepValuesOnError } from "@/lib/form";
import { saveRoomAction, type RoomFormState } from "./actions";

type Room = { id: string; name: string; type: "RAWAT_INAP" | "HOTEL"; active: boolean };

export function RoomForm({ room }: { room: Room | null }) {
  const [state, formAction, pending] = useActionState<RoomFormState, FormData>(
    saveRoomAction.bind(null, room?.id ?? null),
    {},
  );
  const err = (key: string) => state.errors?.[key];

  return (
    <form onSubmit={keepValuesOnError(formAction)} className="max-w-4xl space-y-5">
      <Section title="Kandang / ruangan">
        <Field label="Nama" name="name" errors={err("name")}>
          <Input id="name" name="name" defaultValue={room?.name} placeholder="mis. K-01" required />
        </Field>
        <Field label="Jenis" name="type" errors={err("type")}>
          <select id="type" name="type" defaultValue={room?.type ?? "RAWAT_INAP"} className={selectClass}>
            <option value="RAWAT_INAP">Rawat inap</option>
            <option value="HOTEL">Hotel</option>
          </select>
        </Field>
        <CheckField name="active" label="Aktif (bisa dipakai untuk check-in)" defaultChecked={room?.active ?? true} />
      </Section>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan"}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/master-data/kandang">Batal</Link>
        </Button>
        {state.message && <p role="status" className="text-sm text-destructive">{state.message}</p>}
      </div>
    </form>
  );
}
