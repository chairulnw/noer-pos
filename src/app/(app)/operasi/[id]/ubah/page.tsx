import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { requireCapability } from "@/lib/require-role";
import { getSurgery, listOperationServices } from "@/lib/surgeries";
import { isEditable } from "@/lib/surgery-schema";
import { listDoctors } from "@/lib/visits";
import { SurgeryForm } from "../../surgery-form";

export default async function EditSurgeryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCapability("edit_medical_record");
  const { id } = await params;
  const s = z.guid().safeParse(id).success ? await getSurgery(id) : null;
  if (!s) notFound();
  if (!isEditable(s.status)) redirect(`/operasi/${id}`);
  const [doctors, services] = await Promise.all([listDoctors(), listOperationServices()]);

  return (
    <div className="space-y-5">
      <h1 className="text-[20px] font-semibold leading-11">Ubah operasi: {s.patient.name}</h1>
      <SurgeryForm
        surgeryId={s.id}
        doctors={doctors}
        services={services}
        defaults={{ procedure: s.procedure, anesthesia: s.anesthesia ?? "", surgeryDate: s.surgeryDate.toISOString().slice(0, 10), doctorId: s.doctor.id, serviceItemId: s.serviceItemId ?? "", preNotes: s.preNotes ?? "" }}
        cancelHref={`/operasi/${id}`}
      />
    </div>
  );
}
