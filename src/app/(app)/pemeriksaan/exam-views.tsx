import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { ClinicalNotes, ClinicalTags } from "@/components/clinical-flags";
import { ConfirmButton } from "@/components/confirm-button";
import { MoreMenu, menuItemClass, } from "@/components/more-menu";
import { FileText, ImageIcon } from "lucide-react";
import { ListHeader, ListPage, ListToolbar, TableCard } from "@/components/data-table";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseYmd } from "@/lib/appointment-calc";
import { todayJakarta } from "@/lib/date";
import { EXAM, type ExaminationType } from "@/lib/examination-schema";
import { getExamination, listExaminations, listRecordOptions } from "@/lib/examinations";
import { formatDate } from "@/lib/format";
import { parsePaging, type PagingParams } from "@/lib/paging";
import { getPatient, searchPatients } from "@/lib/patients";
import { can } from "@/lib/permissions";
import { requireCapability } from "@/lib/require-role";
import { deleteExamAction } from "./actions";
import { ExamFileForm } from "./exam-file-form";
import { ExamForm } from "./exam-form";

const field = "h-11 rounded-lg border border-input bg-card px-3 text-sm";
const today = () => todayJakarta().toISOString().slice(0, 10);

export async function ExamList({ type, searchParams }: { type: ExaminationType; searchParams: Promise<{ q?: string; dari?: string; sampai?: string } & PagingParams> }) {
  const user = await requireCapability("view_medical_record");
  const params = await searchParams;
  const config = EXAM[type];
  const from = parseYmd(params.dari) ?? undefined;
  const to = parseYmd(params.sampai) ?? undefined;
  const { page, size, skip, take } = parsePaging(params);
  const { rows, total } = await listExaminations(type, { q: params.q, from, to }, skip, take);
  const canEdit = can(user.role, "edit_medical_record");
  const keep = { q: params.q, dari: from, sampai: to, baris: params.baris };
  const add = canEdit ? <Button asChild><Link href={`${config.path}/baru`}>+ {type === "LAB" ? "Uji Lab Baru" : "Radiologi Baru"}</Link></Button> : undefined;

  return (
    <ListPage>
      <ListHeader icon={type === "LAB" ? FileText : ImageIcon} title={config.title} subtitle={type === "LAB" ? "Kelola riwayat pemeriksaan darah, urine, parasit, dan tes laboratorium pasien" : "Kelola hasil rontgen (X-Ray), USG, dan rekam pencitraan diagnostik pasien"} actions={add} />
      <ListToolbar base={config.path} params={{ q: params.q, baris: params.baris }} placeholder="Cari pasien, pemilik, pemeriksaan, atau hasil…" total={total}>
        <input type="date" name="dari" defaultValue={from ?? ""} aria-label="Dari tanggal" className={field} />
        <input type="date" name="sampai" defaultValue={to ?? ""} aria-label="Sampai tanggal" className={field} />
        <Button type="submit" variant="outline">Terapkan</Button>
      </ListToolbar>
      <TableCard
        columns={[{ label: "Tanggal" }, { label: "Pasien & pemilik" }, { label: config.nameLabel }, { label: type === "LAB" ? "Hasil / nilai uji" : "Temuan / interpretasi" }, { label: "Lampiran" }, { label: "Aksi", align: "right" }]}
        total={total}
        page={page}
        size={size}
        base={config.path}
        params={keep}
        minWidth={720}
        empty={<EmptyState action={add}>{type === "LAB" ? "Belum ada hasil lab. Mulai catat hasil tes laboratorium baru untuk pasien." : "Belum ada data radiologi. Mulai catat pemeriksaan radiologi atau USG baru."}</EmptyState>}
      >
        {rows.map((e) => (
          <tr key={e.id} className="border-b last:border-0">
            <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(e.performedAt)}</td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-1.5"><Link href={`/pasien?id=${e.patient.id}`} className="font-medium">{e.patient.name}</Link><ClinicalTags allergyNote={e.patient.allergyNote} aggressive={e.patient.aggressive} /></div>
              <div className="text-[13px] text-muted-foreground">{e.patient.rmNo} · {e.patient.owner.name}</div>
            </td>
            <td className="px-4 py-3 font-medium">{e.name}</td>
            <td className="max-w-64 px-4 py-3"><div className="truncate">{e.findings ?? <span className="text-muted-foreground">-</span>}</div></td>
            <td className="px-4 py-3 tabular-nums">{e.attachments.length > 0 ? `${e.attachments.length} file` : <span className="text-muted-foreground">-</span>}</td>
            <td className="px-4 py-3 text-right"><Button asChild variant="outline"><Link href={`${config.path}/${e.id}`}>Lihat</Link></Button></td>
          </tr>
        ))}
      </TableCard>
    </ListPage>
  );
}

export async function ExamNew({ type, searchParams }: { type: ExaminationType; searchParams: Promise<{ patient?: string; q?: string }> }) {
  await requireCapability("edit_medical_record");
  const { patient: patientId, q = "" } = await searchParams;
  const config = EXAM[type];
  const patient = patientId && z.guid().safeParse(patientId).success ? await getPatient(patientId) : null;

  if (!patient) {
    const results = q.trim() ? (await searchPatients(q)).patients : [];
    return (
      <div className="space-y-5">
        <h1 className="text-[22px] font-semibold leading-11">{config.title} baru: pilih pasien</h1>
        <form className="flex gap-2">
          <Input name="q" defaultValue={q} autoFocus placeholder="Nama owner/hewan, no. WA, no. RM, microchip" aria-label="Cari pasien" />
          <Button type="submit" variant="outline">Cari</Button>
        </form>
        <div className="overflow-hidden rounded-[10px] border bg-card">
          {q.trim() && results.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Tidak ada pasien ditemukan.</p>}
          {!q.trim() && <p className="p-6 text-center text-sm text-muted-foreground">Cari pasien terlebih dahulu.</p>}
          {results.map((p) => (
            <Link key={p.id} href={`${config.path}/baru?patient=${p.id}`} className="flex flex-col gap-1 border-b px-4 py-3.5 last:border-0">
              <span className="flex flex-wrap items-center gap-1.5"><span className="text-[15px] font-semibold">{p.name}</span><ClinicalTags allergyNote={p.allergyNote} aggressive={p.aggressive} /></span>
              <span className="text-[13.5px] text-muted-foreground">{[p.species, p.breed, p.rmNo].filter(Boolean).join(" · ")} · {p.owner.name}</span>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const records = await listRecordOptions(patient.id);
  return (
    <div className="space-y-5">
      <h1 className="text-[22px] font-semibold leading-11">{config.title} baru</h1>
      <div className="overflow-hidden rounded-[10px] border bg-card">
        <div className="flex flex-wrap items-center gap-2.5 p-4">
          <span className="text-lg font-semibold">{patient.name}</span>
          <span className="text-sm text-muted-foreground tabular-nums">{patient.rmNo}</span>
          <ClinicalTags allergyNote={patient.allergyNote} aggressive={patient.aggressive} />
          <span className="text-sm text-muted-foreground">Owner {patient.owner.name}</span>
        </div>
        <ClinicalNotes allergyNote={patient.allergyNote} aggressive={patient.aggressive} behaviorNote={patient.behaviorNote} />
      </div>
      <ExamForm type={type} patientId={patient.id} defaults={{ name: "", performedAt: today(), findings: "", notes: "", recordId: "" }} records={records} cancelHref={config.path} />
    </div>
  );
}

export async function ExamDetail({ type, id }: { type: ExaminationType; id: string }) {
  const user = await requireCapability("view_medical_record");
  if (!z.guid().safeParse(id).success) notFound();
  const exam = await getExamination(id);
  if (!exam) notFound();
  if (exam.type !== type) redirect(`${EXAM[exam.type].path}/${id}`);
  const config = EXAM[type];
  const canEdit = can(user.role, "edit_medical_record");

  return (
    <div className="space-y-5">
      <PageHeader
        back={{ href: config.path, label: config.title }}
        title={exam.name}
        meta={<p>{formatDate(exam.performedAt)} · <Link href={`/pasien?id=${exam.patient.id}`} className="font-medium text-foreground">{exam.patient.name}</Link> ({exam.patient.rmNo}) · Owner {exam.patient.owner.name} · dicatat {exam.createdBy.name}</p>}
        status={<ClinicalTags allergyNote={exam.patient.allergyNote} aggressive={exam.patient.aggressive} />}
        actions={canEdit && (
          <>
            <Button asChild variant="outline"><Link href={`${config.path}/${exam.id}/ubah`}>Ubah</Link></Button>
            <MoreMenu iconOnly label="Aksi lain">
              <form action={deleteExamAction.bind(null, exam.id)}>
                <ConfirmButton variant="ghost" confirmLabel="Ya, hapus" message={`Hapus ${config.singular} ${exam.name}?`} className={`${menuItemClass} h-auto justify-start rounded-md px-3 font-medium text-destructive`}>Hapus</ConfirmButton>
              </form>
            </MoreMenu>
          </>
        )}
      />

      <section className="space-y-3 rounded-[10px] border bg-card p-5">
        <div><h2 className="text-sm font-semibold">{config.findingsLabel}</h2><p className="mt-1 whitespace-pre-wrap text-[15px]">{exam.findings ?? "-"}</p></div>
        <div><h2 className="text-sm font-semibold">{config.notesLabel}</h2><p className="mt-1 whitespace-pre-wrap text-[15px]">{exam.notes ?? "-"}</p></div>
        {exam.recordId && <p className="text-sm text-muted-foreground">Terkait rekam medis pasien ini.</p>}
      </section>

      <section className="space-y-3 rounded-[10px] border bg-card p-5">
        <h2 className="text-base font-semibold">Lampiran</h2>
        {exam.attachments.length === 0 && <p className="text-sm text-muted-foreground">Belum ada lampiran.</p>}
        {exam.attachments.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-3 border-b pb-2.5 text-[14.5px] last:border-0">
            <a href={`/api/lampiran/${a.id}`} target="_blank" rel="noreferrer" className="min-w-0 truncate font-medium text-primary">{a.fileName}</a>
            <span className="shrink-0 text-[13px] text-muted-foreground">{(a.size / 1024).toFixed(0)} KB · {formatDate(a.createdAt)}</span>
          </div>
        ))}
        {canEdit && <ExamFileForm examId={exam.id} />}
        <p className="text-[13px] text-muted-foreground">PDF, JPG, atau PNG, maksimal 10 MB.</p>
      </section>
    </div>
  );
}

export async function ExamEdit({ type, id }: { type: ExaminationType; id: string }) {
  await requireCapability("edit_medical_record");
  if (!z.guid().safeParse(id).success) notFound();
  const exam = await getExamination(id);
  if (!exam) notFound();
  if (exam.type !== type) redirect(`${EXAM[exam.type].path}/${id}/ubah`);
  const records = await listRecordOptions(exam.patient.id);

  return (
    <div className="space-y-5">
      <h1 className="text-[22px] font-semibold leading-11">Ubah {EXAM[type].singular}: {exam.patient.name}</h1>
      <ExamForm type={type} examId={exam.id} defaults={{ name: exam.name, performedAt: exam.performedAt.toISOString().slice(0, 10), findings: exam.findings ?? "", notes: exam.notes ?? "", recordId: exam.recordId ?? "" }} records={records} cancelHref={`${EXAM[type].path}/${exam.id}`} />
    </div>
  );
}
