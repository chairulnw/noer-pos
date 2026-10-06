"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/money-input";
import { Input } from "@/components/ui/input";
import { CheckField, Field, Section, selectClass } from "@/components/form-fields";
import { keepValuesOnError } from "@/lib/form";
import { saveRoomAction, type RoomFormState } from "./actions";

type Room = { id: string; name: string; type: "RAWAT_INAP" | "HOTEL"; active: boolean; capacity: number; defaultRate: { sellPrice: number } | null; suitableFor: string | null };

export function RoomForm({ room, defaultType = "RAWAT_INAP" }: { room: Room | null; defaultType?: "RAWAT_INAP" | "HOTEL" }) {
  const [state, formAction, pending] = useActionState<RoomFormState, FormData>(
    saveRoomAction.bind(null, room?.id ?? null),
    {},
  );
  const err = (key: string) => state.errors?.[key];

  return (
    <form onSubmit={keepValuesOnError(formAction)} className="space-y-5">
      <Section title="Kandang / ruangan">
        <Field label="Nama" name="name" errors={err("name")}>
          <Input id="name" name="name" defaultValue={room?.name} placeholder="mis. K-01" required />
        </Field>
        <Field label="Jenis" name="type" errors={err("type")}>
          <select id="type" name="type" defaultValue={room?.type ?? defaultType} className={selectClass}>
            <option value="RAWAT_INAP">Rawat inap</option>
            <option value="HOTEL">Hotel</option>
          </select>
        </Field>
        <Field label="Kapasitas (jumlah hewan)" name="capacity" errors={err("capacity")} hint="Berapa hewan yang boleh menginap bersamaan di kandang ini.">
          <Input id="capacity" name="capacity" type="number" min={1} max={50} step={1} inputMode="numeric" defaultValue={room?.capacity ?? 1} required />
        </Field>
        <Field label="Tarif per hari" name="dailyRate" errors={err("dailyRate")} hint="Per hewan per hari. Terpilih otomatis saat check-in. Kosongkan bila belum ada tarif.">
          <div className="flex h-11 items-center gap-2 rounded-lg border border-input bg-card px-3">
            <span className="text-sm text-muted-foreground">Rp</span>
            <MoneyInput id="dailyRate" name="dailyRate" defaultValue={room?.defaultRate ? String(room.defaultRate.sellPrice) : ""} className="min-w-0 flex-1 bg-transparent font-medium tabular-nums outline-none" />
          </div>
        </Field>
        <Field label="Peruntukan (opsional)" name="suitableFor" errors={err("suitableFor")}>
          <Input id="suitableFor" name="suitableFor" defaultValue={room?.suitableFor ?? ""} maxLength={80} placeholder="mis. kucing, anjing kecil" />
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
