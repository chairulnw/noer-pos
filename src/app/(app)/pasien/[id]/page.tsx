import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { latestRawatInapLogs, listPatientAdmissions } from "@/lib/admissions";
import { can } from "@/lib/permissions";
import { getPatient, getPatientHistory } from "@/lib/patients";
import { requireCapability } from "@/lib/require-role";
import { PatientProfile } from "../patient-profile";

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCapability("manage_patients");
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();
  const patient = await getPatient(id);
  if (!patient) notFound();
  const [history, admissions, monitoring] = await Promise.all([
    can(user.role, "view_medical_record") ? getPatientHistory(patient.id) : null,
    listPatientAdmissions(patient.id),
    can(user.role, "monitor_admission") ? latestRawatInapLogs(patient.id) : null,
  ]);

  return (
    <div className="space-y-4">
      <Link href="/pasien" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary"><ArrowLeft className="size-4" /> Hewan Peliharaan</Link>
      <PatientProfile patient={patient} history={history} admissions={admissions} monitoring={monitoring} />
    </div>
  );
}
