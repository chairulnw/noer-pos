import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ClinicalNotes, ClinicalTags } from "@/components/clinical-flags";
import { StatusChip } from "@/components/status-chip";
import { formatDate, formatTime } from "@/lib/format";
import { GROOMING_STATUS, isEditable } from "@/lib/grooming-schema";
import { getGrooming } from "@/lib/groomings";
import { can } from "@/lib/permissions";
import { requireCapability } from "@/lib/require-role";
import { StatusButtons } from "../status-buttons";

export default async function GroomingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCapability("create_visit");
  const { id } = await params;
  const g = z.guid().safeParse(id).success ? await getGrooming(id) : null;
  if (!g) notFound();

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Link href="/grooming" className="text-[13px] font-medium text-primary">← Grooming & Salon</Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[22px] font-semibold leading-11">{g.serviceItem?.name ?? "Grooming"}</h1>
          <StatusChip tone={GROOMING_STATUS[g.status].tone}>{GROOMING_STATUS[g.status].label}</StatusChip>
        </div>
      </div>
      <div className="overflow-hidden rounded-[10px] border bg-card">
        <div className="flex flex-wrap items-center gap-2.5 p-4">
          <Link href={`/pasien?id=${g.patient.id}`} className="text-lg font-semibold">{g.patient.name}</Link>
          <span className="text-sm text-muted-foreground tabular-nums">{g.patient.rmNo}</span>
          <ClinicalTags allergyNote={g.patient.allergyNote} aggressive={g.patient.aggressive} />
          <span className="text-sm text-muted-foreground">Owner {g.patient.owner.name}</span>
        </div>
        <ClinicalNotes allergyNote={g.patient.allergyNote} aggressive={g.patient.aggressive} behaviorNote={null} />
      </div>
      <dl className="grid gap-4 rounded-[10px] border bg-card p-5 md:grid-cols-2">
        <div><dt className="text-[13px] text-muted-foreground">Tanggal</dt><dd className="text-[15px]">{formatDate(g.groomingDate)}</dd></div>
        {g.finishedAt && <div><dt className="text-[13px] text-muted-foreground">Selesai</dt><dd className="text-[15px]">{formatDate(g.finishedAt)} {formatTime(g.finishedAt)}</dd></div>}
        <div className="md:col-span-2"><dt className="text-[13px] text-muted-foreground">Catatan</dt><dd className="whitespace-pre-wrap text-[15px]">{g.notes || "—"}</dd></div>
        {g.invoice && can(user.role, "manage_invoice_payment") && <div><dt className="text-[13px] text-muted-foreground">Tagihan</dt><dd><Link href={`/invoice/${g.invoice.id}`} className="font-medium text-primary">{g.invoice.invoiceNo}</Link></dd></div>}
      </dl>
      {isEditable(g.status) && <section className="rounded-[10px] border bg-card p-5"><StatusButtons id={g.id} status={g.status} /></section>}
    </div>
  );
}
