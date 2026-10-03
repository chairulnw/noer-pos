"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckField, Field, Section, selectClass } from "@/components/form-fields";
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

const SPECIES = ["Kucing", "Anjing", "Kelinci", "Burung", "Hamster", "Reptil"];

export function PatientForm({ ownerId, ownerName, patient }: { ownerId: string; ownerName: string; patient: Patient | null }) {
  const [state, formAction, pending] = useActionState<PatientFormState, FormData>(
    savePatientAction.bind(null, ownerId, patient?.id ?? null),
    {},
  );
  const err = (key: string) => state.errors?.[key];

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
        <Field label="Spesies" name="species" errors={err("species")}>
          <Input id="species" name="species" list="species-options" defaultValue={patient?.species} required />
          <datalist id="species-options">
            {SPECIES.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Field>
        <Field label="Ras" name="breed" errors={err("breed")}>
          <Input id="breed" name="breed" defaultValue={patient?.breed ?? ""} />
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

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan"}
        </Button>
        <Button variant="outline" asChild>
          <Link href={patient ? `/pasien?id=${patient.id}` : `/pasien/owner/${ownerId}`}>Batal</Link>
        </Button>
        {state.message && <p role="status" className="text-sm text-destructive">{state.message}</p>}
      </div>
    </form>
  );
}
