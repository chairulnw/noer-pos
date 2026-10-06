import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ClinicalNotes, ClinicalTags } from "@/components/clinical-flags";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime } from "@/lib/format";
import { requireCapability } from "@/lib/require-role";
import { getSurgery } from "@/lib/surgeries";
import { isEditable, SURGERY_STATUS } from "@/lib/surgery-schema";
import { AddendumForm, CancelButton, CompleteForm, StartButton } from "../status-panel";

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><dt className="text-[13px] text-muted-foreground">{label}</dt><dd className="whitespace-pre-wrap text-[15px]">{children || "—"}</dd></div>
);

export default async function SurgeryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCapability("view_medical_record");
  const { id } = await params;
  const s = z.guid().safeParse(id).success ? await getSurgery(id) : null;
  if (!s) notFound();
  const canEdit = user.role === "ADMIN" || user.role === "DOKTER";

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Link href="/operasi" className="text-[13px] font-medium text-primary">← Bedah & Operasi</Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[22px] font-semibold leading-11">{s.procedure}</h1>
          <StatusChip tone={SURGERY_STATUS[s.status].tone}>{SURGERY_STATUS[s.status].label}</StatusChip>
          {canEdit && isEditable(s.status) && <Button asChild variant="outline"><Link href={`/operasi/${s.id}/ubah`}>Ubah</Link></Button>}
        </div>
      </div>

      <div className="overflow-hidden rounded-[10px] border bg-card">
        <div className="flex flex-wrap items-center gap-2.5 p-4">
          <Link href={`/pasien?id=${s.patient.id}`} className="text-lg font-semibold">{s.patient.name}</Link>
          <span className="text-sm text-muted-foreground tabular-nums">{s.patient.rmNo}</span>
          <ClinicalTags allergyNote={s.patient.allergyNote} aggressive={s.patient.aggressive} />
          <span className="text-sm text-muted-foreground">Owner {s.patient.owner.name}</span>
        </div>
        <ClinicalNotes allergyNote={s.patient.allergyNote} aggressive={s.patient.aggressive} behaviorNote={null} />
      </div>

      <dl className="grid gap-4 rounded-[10px] border bg-card p-5 md:grid-cols-2">
        <Row label="Tanggal operasi">{formatDate(s.surgeryDate)}</Row>
        <Row label="Dokter operator">{s.doctor.name}</Row>
        <Row label="Anestesi">{s.anesthesia}</Row>
        <Row label="Layanan untuk tagihan">{s.serviceItem?.name}</Row>
        <div className="md:col-span-2"><Row label="Catatan pra-operasi">{s.preNotes}</Row></div>
        {s.status === "SELESAI" && (
          <>
            <div className="md:col-span-2"><Row label={`Catatan pasca-operasi${s.finishedAt ? ` (selesai ${formatDate(s.finishedAt)} ${formatTime(s.finishedAt)})` : ""}`}>{s.postNotes}</Row></div>
            {s.invoice && <Row label="Tagihan"><Link href={`/invoice/${s.invoice.id}`} className="font-medium text-primary">{s.invoice.invoiceNo}</Link></Row>}
          </>
        )}
      </dl>

      {canEdit && s.status === "DIJADWALKAN" && <section className="flex flex-wrap gap-3 rounded-[10px] border bg-card p-5"><StartButton id={s.id} /><CancelButton id={s.id} /></section>}
      {canEdit && s.status === "BERJALAN" && (
        <section className="space-y-3 rounded-[10px] border bg-card p-5">
          <h2 className="text-base font-semibold">Selesaikan operasi</h2>
          <CompleteForm id={s.id} />
          <CancelButton id={s.id} />
        </section>
      )}

      {s.status === "SELESAI" && (
        <section className="space-y-3 rounded-[10px] border bg-card p-5">
          <h2 className="text-base font-semibold">Addendum</h2>
          {s.addenda.length === 0 && <p className="text-sm text-muted-foreground">Belum ada addendum.</p>}
          {s.addenda.map((a) => (
            <div key={a.id} className="border-b pb-3 last:border-0">
              <p className="whitespace-pre-wrap text-[15px]">{a.note}</p>
              <p className="text-[13px] text-muted-foreground">{a.user.name} · {formatDate(a.createdAt)} {formatTime(a.createdAt)}</p>
            </div>
          ))}
          {canEdit && <AddendumForm id={s.id} />}
        </section>
      )}
    </div>
  );
}
