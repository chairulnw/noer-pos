import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClinicalNotes, ClinicalTags } from "@/components/clinical-flags";
import { todayJakarta } from "@/lib/date";
import { formatDate, formatTime } from "@/lib/format";
import { StatusChip } from "@/components/status-chip";
import type { getPatient, getPatientHistory } from "@/lib/patients";
import type { latestRawatInapLogs, listPatientAdmissions } from "@/lib/admissions";
import { formatAge, formatWhatsapp } from "@/lib/patient-schema";

type Patient = NonNullable<Awaited<ReturnType<typeof getPatient>>>;
type History = Awaited<ReturnType<typeof getPatientHistory>>;
type Admissions = Awaited<ReturnType<typeof listPatientAdmissions>>;
type Monitoring = Awaited<ReturnType<typeof latestRawatInapLogs>>;

const SEX = { JANTAN: "Jantan", BETINA: "Betina" };

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-[10px] border bg-card px-4 py-3.5">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className="text-xl font-semibold tabular-nums">{value}</span>
    </div>
  );
}

export function PatientProfile({ patient, history, admissions, monitoring }: { patient: Patient; history: History | null; admissions: Admissions; monitoring: Monitoring }) {
  const details = [
    patient.species,
    patient.breed,
    `${SEX[patient.sex]}${patient.neutered ? " (steril)" : ""}`,
    patient.birthDate && formatAge(patient.birthDate, todayJakarta()),
    patient.microchip && `Microchip ${patient.microchip}`,
  ].filter(Boolean);

  return (
    <section aria-label="Profil pasien" className="flex min-w-0 flex-col gap-4">
      <div className="overflow-hidden rounded-[10px] border bg-card">
        <div className="flex flex-wrap items-center gap-4 p-5">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent text-[22px] font-semibold leading-11 text-accent-foreground">
            {patient.name[0]?.toUpperCase()}
          </div>
          <div className="flex min-w-60 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-baseline gap-2.5">
              <h2 className="text-xl font-semibold">{patient.name}</h2>
              <span className="text-sm text-muted-foreground tabular-nums">{patient.rmNo}</span>
              <span className="flex gap-1.5">
                <ClinicalTags allergyNote={patient.allergyNote} aggressive={patient.aggressive} />
              </span>
            </div>
            <div className="text-[14.5px] text-muted-foreground">{details.join(" · ")}</div>
            <div className="text-[14.5px] text-muted-foreground">
              Owner{" "}
              <Link href={`/pemilik/${patient.owner.id}`} className="font-medium text-primary">
                {patient.owner.name}
              </Link>{" "}
              · WA {formatWhatsapp(patient.owner.whatsapp)}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/pasien/${patient.id}/ubah`}>Ubah</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/rawat-inap/check-in?patient=${patient.id}`}>Check-in</Link>
            </Button>
            <Button asChild>
              <Link href={`/kunjungan/baru?patient=${patient.id}`}>+ Buat kunjungan</Link>
            </Button>
          </div>
        </div>
        <ClinicalNotes allergyNote={patient.allergyNote} aggressive={patient.aggressive} behaviorNote={patient.behaviorNote} />
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
        <Stat label="Berat terakhir" value={patient.lastWeightKg === null ? "—" : `${patient.lastWeightKg.toLocaleString("id-ID")} kg`} />
        <Stat label="Terdaftar" value={formatDate(patient.createdAt)} />
      </div>

      {admissions.length > 0 && (
        <div className="overflow-hidden rounded-[10px] border bg-card">
          <h3 className="border-b px-5 py-3 text-base font-semibold">Rawat inap & hotel</h3>
          {admissions.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3.5 last:border-0">
              <div>
                <div className="text-[14.5px] font-medium">{a.type === "HOTEL" ? "Hotel" : "Rawat inap"} · {a.room.name}</div>
                <div className="text-[13.5px] text-muted-foreground">
                  {formatDate(a.checkIn)}{a.checkOut && ` – ${formatDate(a.checkOut)}`}{a.billedDays !== null && ` · ${a.billedDays} hari`}
                </div>
              </div>
              <StatusChip tone={a.status === "AKTIF" ? "warning" : "neutral"}>{a.status === "AKTIF" ? "Menginap" : "Selesai"}</StatusChip>
            </div>
          ))}
        </div>
      )}

      {monitoring && monitoring.logs.length > 0 && (
        <div className="overflow-hidden rounded-[10px] border bg-card">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <h3 className="text-base font-semibold">Monitoring rawat inap · {monitoring.admission.room.name}</h3>
            <Link href={`/rawat-inap/${monitoring.admission.id}`} className="text-sm font-medium text-primary">Semua</Link>
          </div>
          {monitoring.logs.map((log) => (
            <div key={log.id} className="grid grid-cols-[130px_minmax(0,1fr)] gap-4 border-b px-5 py-3 text-[14.5px] last:border-0">
              <span className="text-muted-foreground tabular-nums">{formatDate(log.loggedAt)} · {formatTime(log.loggedAt)}</span>
              <span>
                {log.tempC !== null && <span className="font-medium tabular-nums">{Number(log.tempC).toLocaleString("id-ID")} °C </span>}
                {[log.intake, log.note].filter(Boolean).join(" · ")}
              </span>
            </div>
          ))}
        </div>
      )}

      {history && (
        <>
          <div className="overflow-hidden rounded-[10px] border bg-card">
            <h3 className="border-b px-5 py-3 text-base font-semibold">Riwayat kunjungan</h3>
            {history.visits.length === 0 && <p className="p-5 text-sm text-muted-foreground">Belum ada kunjungan.</p>}
            {history.visits.map((v) => (
              <Link key={v.id} href={`/rekam-medis/${v.id}`} className="grid grid-cols-[116px_minmax(0,1fr)_auto] items-center gap-4 border-b px-5 py-3.5 last:border-0">
                <div>
                  <div className="text-[14.5px] font-medium">{formatDate(v.visitDate)}</div>
                  <div className="text-[13px] text-muted-foreground">{v.doctor.name}</div>
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[14.5px] font-medium">{v.medicalRecord?.diagnosis || v.complaint}</div>
                  {v.medicalRecord?.diagnosis && <div className="truncate text-[13.5px] text-muted-foreground">{v.complaint}</div>}
                </div>
                <StatusChip tone={v.medicalRecord?.finalized ? "info" : "neutral"}>{v.medicalRecord?.finalized ? "Final" : "Draft"}</StatusChip>
              </Link>
            ))}
          </div>
          <div className="overflow-hidden rounded-[10px] border bg-card">
            <h3 className="border-b px-5 py-3 text-base font-semibold">Vaksinasi</h3>
            {history.vaccinations.length === 0 && <p className="p-5 text-sm text-muted-foreground">Belum ada vaksinasi.</p>}
            {history.vaccinations.map((v) => (
              <div key={v.id} className="border-b px-5 py-3.5 last:border-0">
                <div className="text-[14.5px] font-medium">{v.item.name}</div>
                <div className="text-[13.5px] text-muted-foreground">
                  {formatDate(v.givenAt)}
                  {v.batchNo && ` · Batch ${v.batchNo}`}
                  {v.nextDue && ` · berikutnya ${formatDate(v.nextDue)}`}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
