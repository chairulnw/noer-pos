"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckField, Field, Section, selectClass } from "@/components/form-fields";
import { breedsOf } from "@/lib/animal-schema";
import { keepValuesOnError } from "@/lib/form";
import { savePatientAction, type PatientFormState } from "./actions";

type Patient = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  sex: "JANTAN" | "BETINA";
  birthDate: string;
  microchip: string | null;
  color: string | null;
  neutered: boolean;
  lastWeightKg: number | null;
  allergyNote: string | null;
  aggressive: boolean;
  behaviorNote: string | null;
};

export function PatientForm({ ownerId, ownerName, patient, options }: { ownerId: string; ownerName: string; patient: Patient | null; options: { species: string[]; breeds: { species: string; name: string }[] } }) {
  const [state, formAction, pending] = useActionState<PatientFormState, FormData>(
    savePatientAction.bind(null, ownerId, patient?.id ?? null),
    {},
  );
  const err = (key: string) => state.errors?.[key];
  const [species, setSpecies] = useState(patient?.species ?? "");
  const speciesOptions = species && !options.species.some((s) => s.toLowerCase() === species.toLowerCase()) ? [species, ...options.species] : options.species;

  return (
    <form onSubmit={keepValuesOnError(formAction)} className="space-y-5">
      <Section title={`Hewan milik ${ownerName}`}>
        <Field label="Nama hewan" name="name" errors={err("name")}>
          <Input id="name" name="name" defaultValue={patient?.name} required autoFocus />
        </Field>
        <Field label="Jenis kelamin" name="sex" errors={err("sex")}>
          <select id="sex" name="sex" defaultValue={patient?.sex ?? ""} className={selectClass} required>
            <option value="" disabled>
              Pilih
            </option>
            <option value="JANTAN">Jantan</option>
            <option value="BETINA">Betina</option>
          </select>
        </Field>
        <Field label="Jenis hewan" name="species" errors={err("species")}>
          <select id="species" name="species" value={species} onChange={(e) => setSpecies(e.target.value)} className={selectClass} required>
            <option value="" disabled>Pilih jenis hewan</option>
            {speciesOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Ras" name="breed" errors={err("breed")} hint="Pilih dari saran atau ketik bila belum ada.">
          <Input id="breed" name="breed" list="breed-options" defaultValue={patient?.breed ?? ""} />
          <datalist id="breed-options">{breedsOf(options.breeds, species).map((b) => <option key={b} value={b} />)}</datalist>
        </Field>
        <Field label="Tanggal lahir" name="birthDate" errors={err("birthDate")}>
          <Input id="birthDate" name="birthDate" type="date" defaultValue={patient?.birthDate} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Perkiraan umur (tahun)" name="ageYears" errors={err("ageYears")}>
            <Input id="ageYears" name="ageYears" type="number" min={0} max={40} step={1} />
          </Field>
          <Field label="Bulan" name="ageMonths" errors={err("ageMonths")}>
            <Input id="ageMonths" name="ageMonths" type="number" min={0} max={11} step={1} />
          </Field>
        </div>
        <Field label="Warna" name="color" errors={err("color")}>
          <Input id="color" name="color" defaultValue={patient?.color ?? ""} />
        </Field>
        <Field label="Microchip" name="microchip" errors={err("microchip")}>
          <Input id="microchip" name="microchip" defaultValue={patient?.microchip ?? ""} />
        </Field>
        <Field label="Berat terakhir (kg)" name="lastWeightKg" errors={err("lastWeightKg")}>
          <Input id="lastWeightKg" name="lastWeightKg" type="number" min={0} step="0.01" defaultValue={patient?.lastWeightKg ?? ""} />
        </Field>
        <CheckField name="neutered" label="Sudah steril" defaultChecked={patient?.neutered} />
      </Section>

      <Section title="Catatan klinis">
        <Field label="Alergi (kosongkan jika tidak ada)" name="allergyNote" errors={err("allergyNote")} full>
          <Textarea id="allergyNote" name="allergyNote" defaultValue={patient?.allergyNote ?? ""} rows={2} placeholder="mis. Amoxicillin (gatal & bengkak), daging ayam" />
        </Field>
        <CheckField name="aggressive" label="Hewan agresif" defaultChecked={patient?.aggressive} />
        <Field label="Catatan perilaku" name="behaviorNote" errors={err("behaviorNote")} full>
          <Textarea id="behaviorNote" name="behaviorNote" defaultValue={patient?.behaviorNote ?? ""} rows={2} placeholder="mis. Menggigit saat telinga diperiksa, gunakan muzzle" />
        </Field>
      </Section>

      <Section title="Foto (opsional)">
        <Field label="Foto hewan (JPG/PNG, maks 5 MB)" name="photo" errors={err("photo")} full>
          <Input id="photo" name="photo" type="file" accept="image/png,image/jpeg" />
        </Field>
      </Section>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan"}
        </Button>
        <Button variant="outline" asChild>
          <Link href={patient ? `/pasien/${patient.id}` : `/pemilik/${ownerId}`}>Batal</Link>
        </Button>
        {state.message && <p role="status" className="text-sm text-destructive">{state.message}</p>}
      </div>
    </form>
  );
}
