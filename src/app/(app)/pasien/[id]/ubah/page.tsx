import { notFound } from "next/navigation";
import { z } from "zod";
import { ConfirmButton } from "@/components/confirm-button";
import { listActiveAnimalOptions } from "@/lib/animals";
import { getPatient } from "@/lib/patients";
import { requireCapability } from "@/lib/require-role";
import { deletePatientAction } from "../../actions";
import { PatientForm } from "../../patient-form";

export default async function EditPatientPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCapability("manage_patients");
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();
  const [patient, options] = await Promise.all([getPatient(id), listActiveAnimalOptions()]);
  if (!patient) notFound();

  return (
    <div className="space-y-5">
      <h1 className="text-[22px] font-semibold leading-11">Ubah data {patient.name}</h1>
      <PatientForm
        ownerId={patient.owner.id}
        ownerName={patient.owner.name}
        patient={{ ...patient, birthDate: patient.birthDate?.toISOString().slice(0, 10) ?? "" }}
        options={options}
      />
      <form action={deletePatientAction.bind(null, patient.id)} className="pt-4">
        <ConfirmButton variant="destructive" message={`Hapus ${patient.name} dari daftar pasien?`}>
          Hapus pasien
        </ConfirmButton>
      </form>
    </div>
  );
}
