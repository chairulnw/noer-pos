"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { keepValuesOnError } from "@/lib/form";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { checkInHotelAction, searchPatientOptionsAction, type HotelFormState } from "../actions";

type PatientOption = { id: string; name: string; detail: string };
export type SlotOption = { id: string; name: string; category: string | null; rate: number | null; state: "free" | "busy" | "dirty" };
const LABEL = { free: "Tersedia", busy: "Terisi", dirty: "Dibersihkan" } as const;

function PatientPicker({ initial, error }: { initial: PatientOption[]; error?: string }) {
  const [options, setOptions] = useState(initial);
  const [picked, setPicked] = useState<PatientOption>();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (open) setOptions(query.trim() ? await searchPatientOptionsAction(query) : initial);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, open, initial]);

  useEffect(() => {
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={box} className="relative">
      <input type="hidden" name="patientId" value={picked?.id ?? ""} />
      <div className={cn("flex h-12 items-center gap-2 rounded-xl border bg-card px-3 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50", error ? "border-destructive" : "border-input")}>
        <input
          value={open ? query : (picked ? `${picked.name} · ${picked.detail}` : "")}
          onFocus={() => { setOpen(true); setQuery(""); }}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Cari pasien"
          placeholder="Cari nama pasien atau pemilik…"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-[14px] outline-none"
        />
        <ChevronDown className="size-4 text-muted-foreground" />
      </div>
      {open && (
        <div role="listbox" className="absolute z-20 mt-1.5 max-h-72 w-full overflow-y-auto rounded-xl border bg-card shadow-lg">
          {options.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">Pasien tidak ditemukan.</p>}
          {options.map((p) => (
            <button key={p.id} type="button" role="option" aria-selected={picked?.id === p.id} onClick={() => { setPicked(p); setOpen(false); }} className="flex w-full flex-col border-b px-4 py-2.5 text-left last:border-0 hover:bg-accent/60">
              <span className="font-semibold">{p.name}</span>
              <span className="text-[12.5px] text-muted-foreground">{p.detail}</span>
            </button>
          ))}
        </div>
      )}
      {error && <p className="mt-1 text-[12.5px] text-destructive">{error}</p>}
    </div>
  );
}

const heading = "text-[12.5px] font-bold tracking-wide text-muted-foreground uppercase";

export function HotelCheckInForm({ slots, patients, today }: { slots: SlotOption[]; patients: PatientOption[]; today: string }) {
  const [state, formAction, pending] = useActionState<HotelFormState, FormData>(checkInHotelAction, {});
  const [slot, setSlot] = useState("");
  const err = (key: string) => state.errors?.[key]?.[0];

  return (
    <form onSubmit={keepValuesOnError(formAction)} className="space-y-5">
      <div className="space-y-2">
        <div className={heading}>Pilih pasien hewan *</div>
        <PatientPicker initial={patients} error={err("patientId")} />
      </div>

      <div className="space-y-2">
        <div className={heading}>Pilih slot kandang / kamar *</div>
        <input type="hidden" name="roomId" value={slot} />
        {slots.length === 0 && <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">Belum ada kandang. Admin menambahkannya lewat Master Kandang di halaman Pet Hotel.</p>}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="Slot kandang">
          {slots.map((s) => {
            const disabled = s.state !== "free" || s.rate === null;
            return (
              <button key={s.id} type="button" role="radio" aria-checked={slot === s.id} disabled={disabled} onClick={() => setSlot(s.id)} className={cn("rounded-xl border p-3.5 text-left", slot === s.id ? "border-primary bg-accent shadow-[inset_0_0_0_1px_var(--color-primary)]" : "bg-card", disabled && "cursor-not-allowed bg-muted/50 opacity-60")}>
                <span className="flex items-center justify-between gap-2"><b className="text-lg">{s.name}</b><span className={cn("text-[11px] font-bold uppercase", s.state === "free" ? "text-primary" : "text-muted-foreground")}>{s.rate === null && s.state === "free" ? "Tanpa tarif" : LABEL[s.state]}</span></span>
                <span className="block text-[12.5px] text-muted-foreground">{s.category ?? "Umum"}</span>
                <span className="block text-[12.5px] font-bold text-primary">{s.rate === null ? "Tarif belum diisi" : `${formatRupiah(s.rate)}/hari`}</span>
              </button>
            );
          })}
        </div>
        {err("roomId") && <p className="text-[12.5px] text-destructive">{err("roomId")}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2"><span className={heading}>Tanggal check-in *</span>
          <Input name="checkInDate" type="date" defaultValue={today} required className="h-12 rounded-xl" />
          {err("checkInDate") && <span className="block text-[12.5px] text-destructive">{err("checkInDate")}</span>}
        </label>
        <label className="space-y-2"><span className={heading}>Estimasi check-out</span>
          <Input name="expectedCheckOut" type="date" min={today} className="h-12 rounded-xl" />
          {err("expectedCheckOut") && <span className="block text-[12.5px] text-destructive">{err("expectedCheckOut")}</span>}
        </label>
      </div>

      <label className="block space-y-2"><span className={heading}>Instruksi pakan & jadwal makan</span>
        <Textarea name="feedingInstructions" rows={3} maxLength={500} placeholder="Contoh: Royal Canin Gastrointestinal 40gr, 2x sehari jam 08:00 dan 17:00 (makanan bawaan owner)…" className="rounded-xl" />
      </label>
      <label className="block space-y-2"><span className={heading}>Catatan khusus / obat bawaan pasien</span>
        <Textarea name="notes" rows={3} maxLength={300} placeholder="Contoh: Minum obat lambung 1 tablet tiap pagi sebelum makan, anabul takut suara petir…" className="rounded-xl" />
        {err("notes") && <span className="block text-[12.5px] text-destructive">{err("notes")}</span>}
      </label>

      {state.message && <p role="alert" className="text-sm text-destructive">{state.message}</p>}
      <div className="flex gap-3">
        <Button type="submit" size="lg" disabled={pending} className="h-12 flex-1 text-base">{pending ? "Menyimpan…" : "Simpan & Check-In Pasien"}</Button>
        <Button asChild variant="outline" size="lg" className="h-12"><Link href="/pet-hotel">Batal</Link></Button>
      </div>
    </form>
  );
}
