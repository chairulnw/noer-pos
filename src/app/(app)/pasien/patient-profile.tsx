import Link from "next/link";
import { PawPrint, Printer, Syringe } from "lucide-react";
import { ActivityList, buildActivities } from "./activity";
import { Button } from "@/components/ui/button";
import { ClinicalTags } from "@/components/clinical-flags";
import { StatusChip } from "@/components/status-chip";
import { todayJakarta } from "@/lib/date";
import { formatDate, formatTime } from "@/lib/format";
import type { getPatient, getPatientHistory } from "@/lib/patients";
import type { latestRawatInapLogs, listPatientAdmissions } from "@/lib/admissions";
import type { listPatientGroomings } from "@/lib/groomings";
import type { listPatientSurgeries } from "@/lib/surgeries";
import { EXAM } from "@/lib/examination-schema";
import { formatAge, formatWhatsapp } from "@/lib/patient-schema";
import { cn } from "@/lib/utils";

type Patient = NonNullable<Awaited<ReturnType<typeof getPatient>>>;
type History = Awaited<ReturnType<typeof getPatientHistory>>;
type Admissions = Awaited<ReturnType<typeof listPatientAdmissions>>;
type Monitoring = Awaited<ReturnType<typeof latestRawatInapLogs>>;
type Surgeries = Awaited<ReturnType<typeof listPatientSurgeries>>;
type Groomings = Awaited<ReturnType<typeof listPatientGroomings>>;

const SEX = { JANTAN: "Jantan", BETINA: "Betina" };
const TABS = { info: "Info Medis", rekam: "Rekam Medis", aktivitas: "Riwayat Aktivitas" } as const;
export type ProfileTab = keyof typeof TABS;

function Box({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/50 px-4 py-3 text-center">
      <div className="text-[11.5px] font-bold tracking-wide text-muted-foreground uppercase">{label}</div>
      <div className="mt-0.5 truncate text-[15px] font-semibold">{children}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5">
      <h3 className="mb-2 text-[12.5px] font-bold tracking-wide text-muted-foreground uppercase">{title}</h3>
      {children}
    </section>
  );
}

const Row = ({ href, children }: { href?: string; children: React.ReactNode }) =>
  href ? <Link href={href} className="flex items-center gap-3 border-b py-3 last:border-0 hover:bg-accent/40">{children}</Link> : <div className="flex items-center gap-3 border-b py-3 last:border-0">{children}</div>;

export function PatientProfile({ patient, tab, history, admissions, monitoring, surgeries, groomings, canMedical }: {
  patient: Patient;
  tab: ProfileTab;
  history: History | null;
  admissions: Admissions;
  monitoring: Monitoring;
  surgeries: Surgeries;
  groomings: Groomings;
  canMedical: boolean;
}) {
  const age = patient.birthDate ? formatAge(patient.birthDate, todayJakarta()) : null;
  const activities = buildActivities({ history, surgeries: canMedical ? surgeries : [], groomings, admissions });
  const visible = (Object.keys(TABS) as ProfileTab[]).filter((t) => t !== "rekam" || canMedical);
  const recordCount = (history?.visits.length ?? 0) + (history?.examinations.length ?? 0);
  const staying = admissions.find((a) => a.status === "AKTIF");

  return (
    <section aria-label="Profil pasien" className="flex min-w-0 flex-col gap-4">
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-start gap-5">
          {patient.photoPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/foto-hewan/${patient.id}`} alt={`Foto ${patient.name}`} className="size-32 shrink-0 rounded-2xl border object-cover" />
          ) : (
            <div className="grid size-32 shrink-0 place-items-center rounded-2xl bg-accent text-primary"><PawPrint className="size-12" /></div>
          )}
          <div className="min-w-60 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-[26px] leading-tight font-bold">{patient.name}</h2>
              <span className="text-sm text-muted-foreground tabular-nums">{patient.rmNo}</span>
              <ClinicalTags allergyNote={patient.allergyNote} aggressive={patient.aggressive} />
              {staying && <StatusChip tone="warning">{staying.type === "HOTEL" ? "Di Pet Hotel" : "Rawat inap"}</StatusChip>}
            </div>
            <div className="text-[15px] text-muted-foreground">{patient.species} • {patient.breed || "-"}</div>
            <div className="text-[13px] text-muted-foreground">Terdaftar {formatDate(patient.createdAt)}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild><Link href={`/pasien/${patient.id}/ubah`}>Ubah</Link></Button>
            <Button variant="outline" asChild><Link href={`/pasien/${patient.id}/cetak`} target="_blank"><Printer className="size-4" /> Cetak PDF</Link></Button>
            <Button asChild><Link href={`/kunjungan/baru?patient=${patient.id}`}>+ Buat kunjungan</Link></Button>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 border-t pt-5 md:grid-cols-3 xl:grid-cols-6">
          <Box label="Kelamin">{SEX[patient.sex]}{patient.neutered ? " (steril)" : ""}</Box>
          <Box label="Umur">{age ?? "-"}</Box>
          <Box label="Berat">{patient.lastWeightKg === null ? "-" : `${patient.lastWeightKg.toLocaleString("id-ID")} kg`}</Box>
          <Box label="Warna">{patient.color || "-"}</Box>
          <Box label="Microchip">{patient.microchip || "-"}</Box>
          <Box label="Pemilik"><Link href={`/pemilik/${patient.owner.id}`} className="text-primary">{patient.owner.name}</Link></Box>
        </div>
        <div className="mt-3 text-[13px] text-muted-foreground">WA pemilik {formatWhatsapp(patient.owner.whatsapp)}</div>
      </div>

      <nav className="flex gap-1 rounded-2xl bg-muted/70 p-1" aria-label="Bagian profil">
        {visible.map((t) => (
          <Link key={t} href={`/pasien/${patient.id}${t === "info" ? "" : `?tab=${t}`}`} aria-current={t === tab ? "page" : undefined} className={cn("flex-1 rounded-xl px-4 py-2.5 text-center text-[14px] font-semibold", t === tab ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}>
            {TABS[t]}{t === "rekam" ? ` (${recordCount})` : t === "aktivitas" ? ` (${activities.length})` : ""}
          </Link>
        ))}
      </nav>

      {tab === "info" && (
        <>
          <Card title="Riwayat alergi"><p className={cn("text-[15px]", patient.allergyNote && "font-medium text-destructive")}>{patient.allergyNote || "Tidak ada catatan alergi"}</p></Card>
          <Card title="Catatan khusus / perilaku"><p className="text-[15px]">{[patient.aggressive && "Agresif, perlu penanganan khusus.", patient.behaviorNote].filter(Boolean).join(" ") || "Tidak ada catatan riwayat khusus"}</p></Card>
          {canMedical && (
            <Card title="Vaksinasi">
              {(history?.vaccinations.length ?? 0) === 0 ? <p className="text-[15px] text-muted-foreground">Belum ada vaksinasi.</p> : history!.vaccinations.map((v) => (
                <Row key={v.id}><Syringe className="size-4 text-success" /><span className="flex-1"><b className="font-semibold">{v.item.name}</b><span className="block text-[13px] text-muted-foreground">{formatDate(v.givenAt)}{v.batchNo && ` · Batch ${v.batchNo}`}</span></span>{v.nextDue && <StatusChip tone={v.nextDue < todayJakarta() ? "danger" : "info"}>Ulang {formatDate(v.nextDue)}</StatusChip>}</Row>
              ))}
            </Card>
          )}
          {monitoring && monitoring.logs.length > 0 && (
            <Card title={`Monitoring rawat inap · ${monitoring.admission.room.name}`}>
              {monitoring.logs.map((log) => (
                <Row key={log.id}><span className="w-32 text-[13px] text-muted-foreground tabular-nums">{formatDate(log.loggedAt)} {formatTime(log.loggedAt)}</span><span className="text-[14px]">{log.tempC !== null && <b className="tabular-nums">{Number(log.tempC).toLocaleString("id-ID")} °C </b>}{[log.intake, log.note].filter(Boolean).join(" · ")}</span></Row>
              ))}
              <Link href={`/rawat-inap/${monitoring.admission.id}`} className="mt-2 inline-block text-sm font-medium text-primary">Semua monitoring</Link>
            </Card>
          )}
        </>
      )}

      {tab === "rekam" && canMedical && (
        <>
          <Card title="Rekam medis kunjungan">
            {history!.visits.length === 0 && <p className="text-[15px] text-muted-foreground">Belum ada rekam medis.</p>}
            {history!.visits.map((v) => (
              <Row key={v.id} href={`/rekam-medis/${v.id}`}>
                <span className="w-28 shrink-0"><b className="block text-[13.5px]">{formatDate(v.visitDate)}</b><span className="text-[12.5px] text-muted-foreground">{v.doctor.name}</span></span>
                <span className="min-w-0 flex-1"><span className="block truncate font-medium">{v.medicalRecord?.diagnosis || v.complaint}</span>{v.medicalRecord?.diagnosis && <span className="block truncate text-[13px] text-muted-foreground">Keluhan: {v.complaint}</span>}</span>
                <StatusChip tone={v.medicalRecord?.finalized ? "info" : "neutral"}>{v.medicalRecord?.finalized ? "Final" : v.medicalRecord ? "Draft" : "Belum diisi"}</StatusChip>
              </Row>
            ))}
          </Card>
          <Card title="Hasil lab & radiologi">
            {history!.examinations.length === 0 && <p className="text-[15px] text-muted-foreground">Belum ada hasil lab atau radiologi.</p>}
            {history!.examinations.map((e) => (
              <Row key={e.id} href={`${EXAM[e.type].path}/${e.id}`}>
                <b className="w-28 shrink-0 text-[13.5px]">{formatDate(e.performedAt)}</b>
                <span className="min-w-0 flex-1"><span className="block truncate font-medium">{e.name}</span>{e.findings && <span className="block truncate text-[13px] text-muted-foreground">{e.findings}</span>}</span>
                <StatusChip tone="info">{e.type === "LAB" ? "Lab" : "Radiologi"}</StatusChip>
              </Row>
            ))}
          </Card>
        </>
      )}

      {tab === "aktivitas" && (
        <Card title="Riwayat aktivitas (terbaru di atas)">
          {activities.length === 0 && <p className="text-[15px] text-muted-foreground">Belum ada aktivitas.</p>}
          <ActivityList items={activities} />
        </Card>
      )}
    </section>
  );
}
