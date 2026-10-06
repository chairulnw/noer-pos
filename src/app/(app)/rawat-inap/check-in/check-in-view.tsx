import Link from "next/link";
import { z } from "zod";
import { ClinicalNotes, ClinicalTags } from "@/components/clinical-flags";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dateToJakartaLocal } from "@/lib/admission-calc";
import { getCheckInOptions, listTodayVisitsOf } from "@/lib/admissions";
import { formatTime } from "@/lib/format";
import { getPatient, searchPatients } from "@/lib/patients";
import { requireCapability } from "@/lib/require-role";
import { admissionBase, admissionLabel, type AdmissionType } from "@/lib/admission-paths";
import { CheckInForm } from "../check-in-form";

export async function CheckInView({ searchParams, type }: { searchParams: Promise<{ patient?: string; q?: string }>; type?: AdmissionType }) {
  await requireCapability("manage_admission");
  const { patient: patientId, q = "" } = await searchParams;
  const base = admissionBase(type ?? "RAWAT_INAP");
  const heading = type ? `Check-in ${admissionLabel(type)}` : "Check-in rawat inap / hotel";
  const patient = patientId && z.guid().safeParse(patientId).success ? await getPatient(patientId) : null;

  if (!patient) {
    const results = (await searchPatients(q)).patients;
    return (
      <div className="space-y-5">
        <h1 className="text-[20px] font-semibold leading-11">{heading}: pilih pasien</h1>
        <form className="flex gap-2">
          <Input name="q" defaultValue={q} autoFocus placeholder="Nama owner/hewan, no. WA, no. RM, microchip" aria-label="Cari pasien" />
          <Button type="submit" variant="outline">Cari</Button>
        </form>
        <div className="overflow-hidden rounded-[10px] border bg-card">
          {results.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Tidak ada pasien ditemukan.</p>}
          {results.map((p) => (
            <Link key={p.id} href={`${base}/check-in?patient=${p.id}`} className="flex flex-col gap-1 border-b px-4 py-3.5 last:border-0">
              <span className="flex flex-wrap items-center gap-1.5">
                <span className="text-[14px] font-semibold">{p.name}</span>
                <ClinicalTags allergyNote={p.allergyNote} aggressive={p.aggressive} />
              </span>
              <span className="text-[13px] text-muted-foreground">{[p.species, p.breed, p.rmNo].filter(Boolean).join(" · ")} · {p.owner.name}</span>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const [options, visits] = await Promise.all([getCheckInOptions(), listTodayVisitsOf(patient.id)]);

  return (
    <div className="space-y-5">
      <h1 className="text-[20px] font-semibold leading-11">{heading}</h1>
      <div className="overflow-hidden rounded-[10px] border bg-card">
        <div className="flex flex-wrap items-center gap-2.5 p-4">
          <span className="text-lg font-semibold">{patient.name}</span>
          <span className="text-sm text-muted-foreground tabular-nums">{patient.rmNo}</span>
          <ClinicalTags allergyNote={patient.allergyNote} aggressive={patient.aggressive} />
          <span className="text-sm text-muted-foreground">Owner {patient.owner.name}</span>
        </div>
        <ClinicalNotes allergyNote={patient.allergyNote} aggressive={patient.aggressive} behaviorNote={patient.behaviorNote} />
      </div>
      <CheckInForm
        lockedType={type}
        cancelHref={base}
        patientId={patient.id}
        patientName={patient.name}
        defaultCheckIn={dateToJakartaLocal(new Date())}
        rooms={options.rooms}
        rates={options.rates}
        visits={visits.map((v) => ({ id: v.id, label: `${formatTime(v.createdAt)} · ${v.complaint}` }))}
      />
    </div>
  );
}
