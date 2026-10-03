import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ClinicalNotes, ClinicalTags } from "@/components/clinical-flags";
import { ConfirmButton } from "@/components/confirm-button";
import { StatusChip } from "@/components/status-chip";
import { todayJakarta } from "@/lib/date";
import { formatDate } from "@/lib/format";
import { can } from "@/lib/permissions";
import { formatAge } from "@/lib/patient-schema";
import { ensureRecord, getRecordView, listCatalog, listDiagnoses, listVaccines } from "@/lib/records";
import { requireCapability } from "@/lib/require-role";
import { removeVaccinationAction } from "../actions";
import { RecordForm, type Vitals } from "../record-form";
import { AddendumForm, AttachmentForm, VaccinationForm } from "../side-forms";

const SEX = { JANTAN: "Jantan", BETINA: "Betina" };
const VITAL_LABELS: [keyof Vitals, string, string][] = [
  ["temp", "Suhu", "°C"], ["hr", "Heart rate", "bpm"], ["rr", "Resp. rate", "/mnt"],
  ["weight", "Berat", "kg"], ["bcs", "BCS", "/ 9"], ["crt", "CRT", "detik"],
];
const EMPTY_VITALS: Vitals = { temp: null, hr: null, rr: null, weight: null, bcs: null, crt: null };

function Card({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-3.5 rounded-[10px] border bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export default async function RecordPage({ params }: { params: Promise<{ visitId: string }> }) {
  const user = await requireCapability("view_medical_record");
  const { visitId } = await params;
  if (!z.uuid().safeParse(visitId).success) notFound();
  if (!(await ensureRecord(visitId))) notFound();

  const data = await getRecordView(visitId);
  if (!data?.record) notFound();
  const { visit, record } = data;
  const { patient } = visit;
  const canEdit = can(user.role, "edit_medical_record");
  const final = record.finalized;
  const vitals = { ...EMPTY_VITALS, ...(record.vitals as Partial<Vitals> | null) };
  const today = todayJakarta();

  const [diagnoses, vaccines, catalog] = final || !canEdit ? [[], [], []] : await Promise.all([listDiagnoses(), listVaccines(), listCatalog()]);

  return (
    <div className="space-y-4">
      <header className="overflow-hidden rounded-[10px] border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 px-5">
          <div className="space-y-1">
            <Link href="/kunjungan" className="text-[13px] font-medium text-primary">← Kunjungan hari ini</Link>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[22px] font-semibold">{patient.name}</h1>
              <span className="text-sm text-muted-foreground tabular-nums">{patient.rmNo}</span>
              <ClinicalTags allergyNote={patient.allergyNote} aggressive={patient.aggressive} />
            </div>
            <p className="text-sm text-muted-foreground">
              {[patient.species, patient.breed, `${SEX[patient.sex]}${patient.neutered ? " steril" : ""}`, patient.birthDate && formatAge(patient.birthDate, today)].filter(Boolean).join(" · ")}
              {" · "}Owner {patient.owner.name} · {formatDate(visit.createdAt)} · {visit.doctor.name}
            </p>
            <p className="text-sm">Keluhan: {visit.complaint}</p>
          </div>
          <StatusChip tone={final ? "info" : "neutral"}>{final ? "Final" : "Draft"}</StatusChip>
        </div>
        <ClinicalNotes allergyNote={patient.allergyNote} aggressive={patient.aggressive} behaviorNote={patient.behaviorNote} />
      </header>

      {final || !canEdit ? (
        <>
          <Card title="Vital signs">
            <dl className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3">
              {VITAL_LABELS.map(([key, label, unit]) => (
                <div key={key}>
                  <dt className="text-[13px] text-muted-foreground">{label}</dt>
                  <dd className="text-lg font-semibold tabular-nums">{vitals[key] === null ? "—" : `${vitals[key]} ${unit}`}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card title="Catatan">
            <div className="grid gap-4 md:grid-cols-2">
              {([["S · Subjective", record.subjective], ["O · Objective", record.objective], ["A · Assessment", record.assessment], ["P · Plan", record.plan]] as const).map(([label, value]) => (
                <div key={label}>
                  <h3 className="text-[14.5px] font-semibold">{label}</h3>
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{value || "—"}</p>
                </div>
              ))}
              <div className="md:col-span-2">
                <h3 className="text-[14.5px] font-semibold">Diagnosa</h3>
                <p className="text-[15px]">{record.diagnosis || "—"}</p>
              </div>
            </div>
            {record.finalizedAt && <p className="text-[13px] text-muted-foreground">Difinalkan {formatDate(record.finalizedAt)}. Isi asli tidak bisa diubah, koreksi lewat addendum.</p>}
          </Card>
        </>
      ) : (
        <RecordForm
          visitId={visit.id}
          recordId={record.id}
          diagnoses={diagnoses.map((d) => d.name)}
          catalog={catalog}
          allergyNote={patient.allergyNote}
          items={record.prescriptionItems.map((p) => ({ itemId: p.itemId, qty: Number(p.qty), instruction: p.instruction ?? "" }))}
          initial={{ subjective: record.subjective ?? "", objective: record.objective ?? "", assessment: record.assessment ?? "", plan: record.plan ?? "", diagnosis: record.diagnosis ?? "", vitals }}
        />
      )}

      {(final || !canEdit) && (
        <Card title="Tindakan & resep">
          {record.prescriptionItems.length === 0 && <p className="text-sm text-muted-foreground">Tidak ada tindakan atau obat.</p>}
          {record.prescriptionItems.map((p) => (
            <div key={p.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-2.5 last:border-0 last:pb-0">
              <div>
                <span className="font-medium">{p.item.name}</span>
                <span className="text-[13.5px] text-muted-foreground"> · {p.item.type === "SERVICE" ? "Tindakan" : "Resep"}</span>
                {p.instruction && <div className="text-[13.5px] text-muted-foreground">{p.instruction}</div>}
              </div>
              <span className="tabular-nums">{Number(p.qty)} {p.item.baseUnit}</span>
            </div>
          ))}
        </Card>
      )}

      <Card title="Vaksinasi">
        {record.vaccinations.length === 0 && <p className="text-sm text-muted-foreground">Belum ada vaksinasi pada kunjungan ini.</p>}
        {record.vaccinations.map((v) => (
          <div key={v.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5 last:border-0 last:pb-0">
            <div>
              <div className="font-medium">{v.item.name}</div>
              <div className="text-[13.5px] text-muted-foreground">
                {formatDate(v.givenAt)}{v.batchNo && ` · Batch ${v.batchNo}`}{v.nextDue && ` · berikutnya ${formatDate(v.nextDue)}`}
              </div>
            </div>
            {!final && canEdit && (
              <form action={removeVaccinationAction.bind(null, visit.id, v.id)}>
                <ConfirmButton variant="ghost" message="Hapus catatan vaksin ini?">Hapus</ConfirmButton>
              </form>
            )}
          </div>
        ))}
        {!final && canEdit && <VaccinationForm visitId={visit.id} recordId={record.id} vaccines={vaccines} today={today.toISOString().slice(0, 10)} />}
      </Card>

      <Card title="Lampiran hasil lab / rontgen" aside={<span className="text-[13px] text-muted-foreground">PDF, JPG, PNG, maks 10 MB</span>}>
        {record.attachments.length === 0 && <p className="text-sm text-muted-foreground">Belum ada lampiran.</p>}
        {record.attachments.map((a) => (
          <a key={a.id} href={`/api/lampiran/${a.id}`} target="_blank" rel="noreferrer" className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-2.5 font-medium text-primary last:border-0 last:pb-0">
            {a.fileName}
            <span className="text-[13px] font-normal text-muted-foreground">{formatDate(a.createdAt)} · {(a.size / 1024).toFixed(0)} KB</span>
          </a>
        ))}
        {canEdit && <AttachmentForm visitId={visit.id} recordId={record.id} />}
      </Card>

      {final && (
        <Card title="Addendum">
          {record.addenda.length === 0 && <p className="text-sm text-muted-foreground">Belum ada addendum.</p>}
          {record.addenda.map((a) => (
            <div key={a.id} className="border-b pb-3 last:border-0 last:pb-0">
              <p className="whitespace-pre-wrap text-[15px]">{a.note}</p>
              <p className="text-[13px] text-muted-foreground">{a.user.name} · {formatDate(a.createdAt)}</p>
            </div>
          ))}
          {canEdit && <AddendumForm visitId={visit.id} recordId={record.id} />}
        </Card>
      )}
    </div>
  );
}
