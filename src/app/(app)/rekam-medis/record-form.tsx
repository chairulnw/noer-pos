"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmButton } from "@/components/confirm-button";
import { selectClass } from "@/components/form-fields";
import { keepValuesOnError } from "@/lib/form";
import { appendPick } from "@/lib/quick-picks";
import { saveRecordAction, type RecordFormState } from "./actions";
import { ItemsPicker, type CatalogItem, type RecordItemRow } from "./items-picker";

export type Vitals = { temp: number | null; hr: number | null; rr: number | null; weight: number | null; bcs: number | null; crt: number | null };

type Props = {
  visitId: string;
  recordId: string;
  diagnoses: string[];
  catalog: CatalogItem[];
  allergyNote: string | null;
  items: RecordItemRow[];
  picks: Record<"subjective" | "objective" | "assessment" | "plan", string[]>;
  initial: { subjective: string; objective: string; assessment: string; plan: string; diagnosis: string; vitals: Vitals };
};

const SOAP = [
  { name: "subjective", letter: "S", title: "Subjective", hint: "anamnesis", rows: 4 },
  { name: "objective", letter: "O", title: "Objective", hint: "pemeriksaan fisik", rows: 4 },
  { name: "assessment", letter: "A", title: "Assessment", hint: "diagnosis", rows: 3 },
  { name: "plan", letter: "P", title: "Plan", hint: "terapi & edukasi", rows: 3 },
] as const;

function Vital({ name, label, unit, error, value, step = "any", min }: { name: string; label: string; unit: string; error?: string[]; value: number | null; step?: string; min?: number }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-[13px] font-medium">
        {label}
      </label>
      <div className="flex h-11 items-center gap-1.5 rounded-lg border border-input bg-card px-3 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
        <input id={name} name={name} type="number" step={step} min={min} defaultValue={value ?? ""} className="min-w-0 flex-1 bg-transparent text-base font-medium outline-none" />
        <span className="text-[12.5px] text-muted-foreground">{unit}</span>
      </div>
      {error?.map((e) => (
        <p key={e} className="text-[12.5px] text-destructive">
          {e}
        </p>
      ))}
    </div>
  );
}

export function RecordForm({ visitId, recordId, diagnoses, catalog, allergyNote, items, initial, picks }: Props) {
  const [state, formAction, pending] = useActionState<RecordFormState, FormData>(saveRecordAction.bind(null, visitId, recordId), {});
  const err = (key: string) => state.errors?.[key];
  const v = initial.vitals;
  const [soap, setSoap] = useState({ subjective: initial.subjective, objective: initial.objective, assessment: initial.assessment, plan: initial.plan });

  return (
    <form onSubmit={keepValuesOnError(formAction)} className="space-y-4">
      <section className="space-y-3.5 rounded-[10px] border bg-card p-5">
        <h2 className="text-base font-semibold">Vital signs</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3.5">
          <Vital name="temp" label="Suhu" unit="°C" value={v.temp} error={err("temp")} />
          <Vital name="hr" label="Heart rate" unit="bpm" value={v.hr} step="1" error={err("hr")} />
          <Vital name="rr" label="Resp. rate" unit="/mnt" value={v.rr} step="1" error={err("rr")} />
          <Vital name="weight" label="Berat" unit="kg" value={v.weight} error={err("weight")} min={0} />
          <div className="space-y-1.5">
            <label htmlFor="bcs" className="text-[13px] font-medium">
              BCS
            </label>
            <select id="bcs" name="bcs" defaultValue={v.bcs ?? ""} className={selectClass}>
              <option value="">—</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <option key={n} value={n}>
                  {n} / 9
                </option>
              ))}
            </select>
          </div>
          <Vital name="crt" label="CRT" unit="detik" value={v.crt} error={err("crt")} min={0} />
        </div>
      </section>

      <section className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-x-5 gap-y-4 rounded-[10px] border bg-card p-5">
        {SOAP.map(({ name, letter, title, hint, rows }) => (
          <div key={name} className="space-y-1.5">
            <label htmlFor={name} className="text-[13.5px] font-semibold">
              <span className="text-primary">{letter}</span> · {title} <span className="text-[12.5px] font-normal text-muted-foreground">{hint}</span>
            </label>
            <Textarea id={name} name={name} rows={rows} value={soap[name]} onChange={(e) => setSoap({ ...soap, [name]: e.target.value })} className="min-h-24 text-[14px] leading-relaxed" />
            {picks[name].length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={`Pilih cepat ${title}`}>
                <span className="text-[12.5px] text-muted-foreground">Pilih cepat:</span>
                {picks[name].map((pick) => (
                  <button key={pick} type="button" onClick={() => setSoap({ ...soap, [name]: appendPick(soap[name], pick) })} className="min-h-9 rounded-full border bg-card px-3 text-[12.5px] font-medium text-primary hover:bg-accent">
                    + {pick}
                  </button>
                ))}
              </div>
            )}
            {err(name)?.map((e) => (
              <p key={e} className="text-[12.5px] text-destructive">
                {e}
              </p>
            ))}
          </div>
        ))}
        <div className="space-y-1.5 md:col-span-2">
          <label htmlFor="diagnosis" className="text-[13.5px] font-semibold">
            Diagnosa <span className="text-[12.5px] font-normal text-muted-foreground">ketik baru atau pilih dari daftar</span>
          </label>
          <Input id="diagnosis" name="diagnosis" list="diagnosis-options" defaultValue={initial.diagnosis} />
          <datalist id="diagnosis-options">
            {diagnoses.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
          {err("diagnosis")?.map((e) => (
            <p key={e} className="text-[12.5px] text-destructive">
              {e}
            </p>
          ))}
        </div>
      </section>

      <ItemsPicker catalog={catalog} allergyNote={allergyNote} initial={items} error={err("items")} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[13px] text-muted-foreground">Setelah final, catatan terkunci. Perubahan lewat addendum.</span>
        <div className="flex flex-wrap items-center gap-2">
          {state.message && (
            <p role="status" className={`text-sm ${state.ok ? "text-success" : "text-destructive"}`}>
              {state.message}
            </p>
          )}
          <Button type="submit" name="intent" value="draft" variant="outline" disabled={pending}>
            Simpan draft
          </Button>
          <ConfirmButton name="intent" value="finalize" size="lg" disabled={pending} message="Finalkan rekam medis? Setelah final isinya tidak bisa diubah.">
            Finalkan & kirim ke kasir
          </ConfirmButton>
        </div>
      </div>
    </form>
  );
}
