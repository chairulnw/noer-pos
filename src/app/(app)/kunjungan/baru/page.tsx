import { notFound } from "next/navigation";
import { z } from "zod";
import { ClinicalNotes, ClinicalTags } from "@/components/clinical-flags";
import { getPatient } from "@/lib/patients";
import { requireCapability } from "@/lib/require-role";
import { listDoctors } from "@/lib/visits";
import { VisitForm } from "../visit-form";

export default async function NewVisitPage({ searchParams }: { searchParams: Promise<{ patient?: string }> }) {
  const user = await requireCapability("create_visit");
  const { patient: patientId } = await searchParams;
  if (!patientId || !z.guid().safeParse(patientId).success) notFound();
  const [patient, doctors] = await Promise.all([getPatient(patientId), listDoctors()]);
  if (!patient) notFound();

  return (
    <div className="space-y-5">
      <h1 className="text-[20px] font-semibold leading-11">Kunjungan baru</h1>
      <div className="overflow-hidden rounded-[10px] border bg-card">
        <div className="flex flex-wrap items-center gap-2.5 p-4">
          <span className="text-lg font-semibold">{patient.name}</span>
          <span className="text-sm text-muted-foreground tabular-nums">{patient.rmNo}</span>
          <ClinicalTags allergyNote={patient.allergyNote} aggressive={patient.aggressive} />
          <span className="text-sm text-muted-foreground">
            {[patient.species, patient.breed].filter(Boolean).join(" · ")} · Owner {patient.owner.name}
          </span>
        </div>
        <ClinicalNotes allergyNote={patient.allergyNote} aggressive={patient.aggressive} behaviorNote={patient.behaviorNote} />
      </div>
      <VisitForm
        patientId={patient.id}
        doctors={doctors}
        defaultDoctorId={user.isDoctor ? user.id : doctors.length === 1 ? doctors[0].id : undefined}
      />
    </div>
  );
}
