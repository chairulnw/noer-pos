import Link from "next/link";
import { z } from "zod";
import { ClinicalNotes, ClinicalTags } from "@/components/clinical-flags";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { todayJakarta } from "@/lib/date";
import { listGroomingServices } from "@/lib/groomings";
import { getPatient, searchPatients } from "@/lib/patients";
import { requireCapability } from "@/lib/require-role";
import { GroomingForm } from "../grooming-form";

export default async function NewGroomingPage({ searchParams }: { searchParams: Promise<{ patient?: string; q?: string }> }) {
  await requireCapability("create_visit");
  const { patient: patientId, q = "" } = await searchParams;
  const patient = patientId && z.guid().safeParse(patientId).success ? await getPatient(patientId) : null;

  if (!patient) {
    const results = (await searchPatients(q)).patients;
    return (
      <div className="space-y-5">
        <h1 className="text-[20px] font-semibold leading-11">Grooming baru: pilih pasien</h1>
        <form className="flex gap-2">
          <Input name="q" defaultValue={q} autoFocus placeholder="Nama owner/hewan, no. WA, no. RM, microchip" aria-label="Cari pasien" />
          <Button type="submit" variant="outline">Cari</Button>
        </form>
        <div className="overflow-hidden rounded-[10px] border bg-card">
          {results.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Tidak ada pasien ditemukan.</p>}
          {results.map((p) => (
            <Link key={p.id} href={`/grooming/baru?patient=${p.id}`} className="flex flex-col gap-1 border-b px-4 py-3.5 last:border-0">
              <span className="flex flex-wrap items-center gap-1.5"><span className="text-[14px] font-semibold">{p.name}</span><ClinicalTags allergyNote={p.allergyNote} aggressive={p.aggressive} /></span>
              <span className="text-[13px] text-muted-foreground">{[p.species, p.breed, p.rmNo].filter(Boolean).join(" · ")} · {p.owner.name}</span>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const services = await listGroomingServices();
  return (
    <div className="space-y-5">
      <h1 className="text-[20px] font-semibold leading-11">Grooming baru</h1>
      <div className="overflow-hidden rounded-[10px] border bg-card">
        <div className="flex flex-wrap items-center gap-2.5 p-4">
          <span className="text-lg font-semibold">{patient.name}</span>
          <span className="text-sm text-muted-foreground tabular-nums">{patient.rmNo}</span>
          <ClinicalTags allergyNote={patient.allergyNote} aggressive={patient.aggressive} />
          <span className="text-sm text-muted-foreground">Owner {patient.owner.name}</span>
        </div>
        <ClinicalNotes allergyNote={patient.allergyNote} aggressive={patient.aggressive} behaviorNote={patient.behaviorNote} />
      </div>
      <GroomingForm patientId={patient.id} services={services} defaultDate={todayJakarta().toISOString().slice(0, 10)} />
    </div>
  );
}
