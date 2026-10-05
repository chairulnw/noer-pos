import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { dateToJakartaLocal } from "@/lib/admission-calc";
import { getAppointment } from "@/lib/appointments";
import { requireCapability } from "@/lib/require-role";
import { listDoctors } from "@/lib/visits";
import { AppointmentForm } from "../../appointment-form";

export default async function EditAppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCapability("create_visit");
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();
  const [appointment, doctors] = await Promise.all([getAppointment(id), listDoctors()]);
  if (!appointment) notFound();
  if (appointment.status !== "TERJADWAL") redirect("/janji-temu");

  return (
    <div className="space-y-5">
      <h1 className="text-[22px] font-semibold leading-11">Ubah janji temu: {appointment.patient.name}</h1>
      <AppointmentForm
        appointmentId={appointment.id}
        doctors={doctors}
        defaults={{ doctorId: appointment.doctor.id, scheduledAt: dateToJakartaLocal(appointment.scheduledAt), purpose: appointment.purpose, notes: appointment.notes ?? "" }}
        cancelHref="/janji-temu"
      />
    </div>
  );
}
