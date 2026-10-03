import { notFound } from "next/navigation";
import { z } from "zod";
import { getOwner } from "@/lib/patients";
import { requireCapability } from "@/lib/require-role";
import { PatientForm } from "../patient-form";

export default async function NewPatientPage({ searchParams }: { searchParams: Promise<{ owner?: string }> }) {
  await requireCapability("manage_patients");
  const { owner: ownerId } = await searchParams;
  if (!ownerId || !z.guid().safeParse(ownerId).success) notFound();
  const owner = await getOwner(ownerId);
  if (!owner) notFound();

  return (
    <div className="space-y-5">
      <h1 className="text-[22px] font-semibold leading-11">Hewan baru</h1>
      <PatientForm ownerId={owner.id} ownerName={owner.name} patient={null} />
    </div>
  );
}
