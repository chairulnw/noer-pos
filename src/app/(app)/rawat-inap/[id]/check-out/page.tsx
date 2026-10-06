import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { ClinicalNotes, ClinicalTags } from "@/components/clinical-flags";
import { dateToJakartaLocal } from "@/lib/admission-calc";
import { admissionBase } from "@/lib/admission-paths";
import { getAdmission } from "@/lib/admissions";
import { formatDate, formatTime } from "@/lib/format";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { requireCapability } from "@/lib/require-role";
import { CheckOutForm } from "../../check-out-form";

export default async function CheckOutPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCapability("manage_admission");
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();
  const admission = await getAdmission(id);
  if (!admission) notFound();
  if (admission.status !== "AKTIF") redirect(admissionBase(admission.type));

  const rate = can(user.role, "view_service_price")
    ? await prisma.admission.findUniqueOrThrow({ where: { id }, select: { rateItem: { select: { sellPrice: true } } } })
    : null;
  const { patient } = admission;

  return (
    <div className="space-y-5">
      <h1 className="text-[20px] font-semibold leading-11">Check-out</h1>
      <div className="overflow-hidden rounded-[10px] border bg-card">
        <div className="space-y-1 p-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <Link href={`/pasien?id=${patient.id}`} className="text-lg font-semibold">{patient.name}</Link>
            <span className="text-sm text-muted-foreground tabular-nums">{patient.rmNo}</span>
            <ClinicalTags allergyNote={patient.allergyNote} aggressive={patient.aggressive} />
          </div>
          <p className="text-sm text-muted-foreground">{admission.type === "HOTEL" ? "Hotel" : "Rawat inap"} {admission.room.name} · masuk {formatDate(admission.checkIn)} {formatTime(admission.checkIn)}</p>
        </div>
        <ClinicalNotes allergyNote={patient.allergyNote} aggressive={patient.aggressive} behaviorNote={patient.behaviorNote} />
      </div>
      <CheckOutForm
        admissionId={admission.id}
        cancelHref={admissionBase(admission.type)}
        checkInIso={admission.checkIn.toISOString()}
        defaultCheckOut={dateToJakartaLocal(new Date())}
        rateName={admission.rateItem.name}
        ratePrice={rate?.rateItem.sellPrice ?? null}
      />
    </div>
  );
}
