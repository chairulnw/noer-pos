"use client";

import { Printer } from "lucide-react";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { keepValuesOnError } from "@/lib/form";
import { cn } from "@/lib/utils";
import { savePrinterAction, type PrinterState } from "./actions";

const SIZES = [
  { value: 58, label: "58 mm", hint: "Kertas kecil (printer kasir portabel)" },
  { value: 80, label: "80 mm", hint: "Standar kasir (paling umum)" },
] as const;

export function PrinterForm({ initial, clinicName }: { initial: 58 | 80; clinicName: string }) {
  const [state, formAction, pending] = useActionState<PrinterState, FormData>(savePrinterAction, {});
  const [width, setWidth] = useState<58 | 80>(initial);
  const mm = `${width}mm`;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <form onSubmit={keepValuesOnError(formAction)} className="space-y-5">
        <section className="space-y-4 rounded-[10px] border bg-card p-5">
          <h2 className="text-base font-semibold">Ukuran kertas kasir</h2>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {SIZES.map((s) => (
              <label key={s.value} className={cn("flex cursor-pointer flex-col gap-0.5 rounded-lg border p-4", width === s.value ? "border-primary bg-accent shadow-[inset_0_0_0_1px_var(--color-primary)]" : "bg-card")}>
                <input type="radio" name="paperWidth" value={s.value} checked={width === s.value} onChange={() => setWidth(s.value)} className="sr-only" />
                <span className="text-base font-semibold">{s.label}</span>
                <span className="text-[12.5px] text-muted-foreground">{s.hint}</span>
              </label>
            ))}
          </div>
          <div className="space-y-1.5 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
            <div className="font-medium text-foreground">Cara mencetak</div>
            <p>Struk dicetak lewat dialog cetak browser, jadi semua printer thermal yang sudah terpasang di komputer atau tablet bisa dipakai (USB, jaringan, atau AirPrint/Android Print).</p>
            <p>Di dialog cetak pilih printer kasir, matikan opsi header dan footer, dan atur margin ke tidak ada.</p>
          </div>
        </section>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Simpan"}</Button>
          <Button type="button" variant="outline" onClick={() => window.print()}><Printer className="size-4" /> Cetak halaman uji</Button>
          {state.message && <p role="status" className="text-sm text-muted-foreground">{state.message}</p>}
        </div>
      </form>

      <section className="space-y-3 rounded-[10px] border bg-card p-5 print:border-0 print:p-0">
        <h2 className="text-base font-semibold print:hidden">Pratinjau struk</h2>
        <style>{`
          @page { size: ${mm} auto; margin: 0; }
          @media print {
            body * { visibility: hidden; }
            #printer-test, #printer-test * { visibility: visible; }
            #printer-test { position: absolute; left: 0; top: 0; width: ${mm}; margin: 0; border: 0; }
          }
        `}</style>
        <div id="printer-test" className="mx-auto bg-white p-3 font-mono text-[12px] leading-snug text-black" style={{ width: mm, maxWidth: "100%" }}>
          <div className="text-center font-bold">{clinicName}</div>
          <div className="text-center">TES CETAK {width} mm</div>
          <div className="my-1.5 border-t border-dashed border-black" />
          <div className="flex justify-between"><span>Konsultasi Umum</span><span>50.000</span></div>
          <div className="flex justify-between"><span>2 x Amoxicillin</span><span>4.000</span></div>
          <div className="my-1.5 border-t border-dashed border-black" />
          <div className="flex justify-between font-bold"><span>TOTAL</span><span>Rp 54.000</span></div>
          <div className="my-1.5 border-t border-dashed border-black" />
          <div className="text-center">ABCDEFGHIJKLMNOPQRSTUVWXYZ</div>
          <div className="text-center">0123456789 0123456789 0123456789</div>
          <div className="mt-2 text-center">Terima kasih</div>
        </div>
      </section>
    </div>
  );
}
