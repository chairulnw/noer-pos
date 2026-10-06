import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { latestRawatInapLogs, listPatientAdmissions } from "@/lib/admissions";
import { listPatientGroomings } from "@/lib/groomings";
import { can } from "@/lib/permissions";
import { getPatient, getPatientHistory } from "@/lib/patients";
import { requireCapability } from "@/lib/require-role";
import { listPatientSurgeries } from "@/lib/surgeries";
import { PatientProfile, type ProfileTab } from "../patient-profile";

export default async function PatientPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const user = await requireCapability("manage_patients");
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();
  const patient = await getPatient(id);
  if (!patient) notFound();
  const canMedical = can(user.role, "view_medical_record");
  const requested = (await searchParams).tab;
  const tab: ProfileTab = requested === "aktivitas" || (requested === "rekam" && canMedical) ? requested : "info";
  const [history, admissions, monitoring, surgeries, groomings] = await Promise.all([
    canMedical ? getPatientHistory(patient.id) : null,
    listPatientAdmissions(patient.id),
    can(user.role, "monitor_admission") ? latestRawatInapLogs(patient.id) : null,
    canMedical ? listPatientSurgeries(patient.id) : [],
    listPatientGroomings(patient.id),
  ]);

  return (
    <div className="space-y-4">
      <Link href="/pasien" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary"><ArrowLeft className="size-4" /> Hewan Peliharaan</Link>
      <PatientProfile patient={patient} tab={tab} history={history} admissions={admissions} monitoring={monitoring} surgeries={surgeries} groomings={groomings} canMedical={canMedical} />
    </div>
  );
}
