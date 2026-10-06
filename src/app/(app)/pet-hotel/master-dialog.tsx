"use client";

import { Check, Home, Plus, Settings, Trash2, X } from "lucide-react";
import { useActionState, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { ConfirmButton } from "@/components/confirm-button";
import { MoneyInput } from "@/components/money-input";
import { useMounted } from "@/components/modal";
import { toast } from "@/components/toaster";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { deleteRoomAction, saveHotelRoomAction, setCleaningAction, type HotelFormState } from "./actions";

export type MasterRoom = { id: string; name: string; suitableFor: string | null; dimensions: string | null; rate: number | null; capacity: number; state: "free" | "busy" | "dirty" };

const CATEGORIES = ["Kucing", "Anjing Kecil", "Anjing Sedang", "Anjing Besar"];
const STATE = { free: ["Tersedia", "border-success/30 bg-success/10 text-success"], busy: ["Terisi", "border-destructive/30 bg-destructive/10 text-destructive"], dirty: ["Dibersihkan", "border-warning/30 bg-warning/10 text-warning"] } as const;

function RoomForm({ onDone }: { onDone: () => void }) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [state, formAction, pending] = useActionState<HotelFormState, FormData>(async (prev, formData) => {
    const result = await saveHotelRoomAction(prev, formData);
    if (result.nonce) onDone();
    return result;
  }, {});
  const err = (key: string) => state.errors?.[key]?.[0];

  return (
    <form key={state.nonce} action={formAction} className="space-y-3 border-b bg-accent/40 p-4">
      <h3 className="text-[13px] font-bold tracking-wide text-primary uppercase">Tambah slot kandang baru</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-[12.5px] font-semibold text-muted-foreground">Nomor/Kode *
          <Input name="name" placeholder="Contoh: K-04" required maxLength={50} className="bg-card text-foreground" />
          {err("name") && <span className="block text-destructive">{err("name")}</span>}
        </label>
        <label className="space-y-1 text-[12.5px] font-semibold text-muted-foreground">Tarif / Hari (Rp) *
          <div className="flex h-11 items-center gap-2 rounded-lg border border-input bg-card px-3 text-foreground">
            <span className="text-sm text-muted-foreground">Rp</span>
            <MoneyInput name="dailyRate" defaultValue="" className="min-w-0 flex-1 bg-transparent font-medium tabular-nums outline-none" />
          </div>
          {err("dailyRate") && <span className="block text-destructive">{err("dailyRate")}</span>}
        </label>
        <label className="space-y-1 text-[12.5px] font-semibold text-muted-foreground sm:col-span-2">Dimensi / Ukuran
          <Input name="dimensions" placeholder="Contoh: Medium Room (80x70 cm)" maxLength={80} className="bg-card text-foreground" />
        </label>
        <label className="space-y-1 text-[12.5px] font-semibold text-muted-foreground">Kapasitas (jumlah hewan)
          <Input name="capacity" type="number" min={1} max={50} defaultValue={1} inputMode="numeric" className="bg-card text-foreground" />
          {err("capacity") && <span className="block text-destructive">{err("capacity")}</span>}
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[12.5px] font-semibold text-muted-foreground">
        Kategori:
        <input type="hidden" name="suitableFor" value={category} />
        {CATEGORIES.map((c) => (
          <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)} className={cn("rounded-full border px-3 py-1", category === c ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>{c}</button>
        ))}
      </div>
      {state.message && <p role="alert" className="text-sm text-destructive">{state.message}</p>}
      <Button type="submit" disabled={pending} className="w-full"><Check className="size-4" /> {pending ? "Menyimpan…" : "Simpan Slot Kandang"}</Button>
    </form>
  );
}

export function MasterKandang({ rooms, canManage }: { rooms: MasterRoom[]; canManage: boolean }) {
  const mounted = useMounted();
  const dialog = useRef<HTMLDialogElement>(null);
  const [adding, setAdding] = useState(false);
  const [, startTransition] = useTransition();
  const run = (fn: () => Promise<{ error?: string } | void>) =>
    startTransition(async () => {
      const result = await fn();
      if (result?.error) toast(result.error);
    });

  return (
    <>
      <Button type="button" variant="outline" onClick={() => dialog.current?.showModal()}><Settings className="size-4" /> Master Kandang</Button>
      {mounted && createPortal(
        <dialog ref={dialog} onClick={(e) => e.target === dialog.current && dialog.current?.close()} className="m-auto h-[min(86vh,760px)] w-[min(94vw,720px)] overflow-hidden rounded-2xl border bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-black/50">
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-3 bg-primary p-4 text-primary-foreground">
              <span className="grid size-10 place-items-center rounded-xl bg-white/15"><Home className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <h2 className="text-[15px] font-bold tracking-wide uppercase">Master data kandang & kamar pet hotel</h2>
                <p className="text-[13px] opacity-80">Kelola kapasitas slot, ukuran, kategori, dan tarif sewa harian</p>
              </div>
              <button type="button" aria-label="Tutup" onClick={() => dialog.current?.close()} className="grid size-9 place-items-center rounded-full bg-white/15"><X className="size-5" /></button>
            </div>
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
              <b className="text-sm">Total {rooms.length} Kandang Terdaftar</b>
              {canManage && <Button type="button" onClick={() => setAdding(!adding)}><Plus className="size-4" /> {adding ? "Tutup Form" : "Tambah Kandang"}</Button>}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {adding && canManage && <RoomForm onDone={() => setAdding(false)} />}
              <div className="space-y-2.5 p-4">
                {rooms.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Belum ada kandang. Klik Tambah Kandang.</p>}
                {rooms.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent text-[13px] font-bold text-primary">{r.name}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-[14.5px] font-semibold">
                        Kandang {r.name}{r.suitableFor && ` • ${r.suitableFor}`}
                        <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase", STATE[r.state][1])}>{STATE[r.state][0]}</span>
                      </div>
                      <div className="text-[13px] text-muted-foreground">{r.dimensions ?? "Ukuran belum diisi"}{r.capacity > 1 && ` · kapasitas ${r.capacity}`} · <b className="text-primary">{r.rate ? `${formatRupiah(r.rate)} / hari` : "Tarif belum diisi"}</b></div>
                    </div>
                    {r.state !== "busy" && (
                      <Button type="button" size="sm" variant="outline" className="h-9" onClick={() => run(() => setCleaningAction(r.id, r.state === "free"))}>{r.state === "dirty" ? "Set Tersedia" : "Set Dibersihkan"}</Button>
                    )}
                    {canManage && r.state !== "busy" && (
                      <ConfirmButton type="button" variant="outline" aria-label={`Hapus ${r.name}`} className="size-9 shrink-0 p-0 text-destructive" message={`Hapus kandang ${r.name}?`} confirmLabel="Ya, hapus" onConfirm={() => run(() => deleteRoomAction(r.id))}><Trash2 className="size-4" /></ConfirmButton>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </dialog>,
        document.body,
      )}
    </>
  );
}
