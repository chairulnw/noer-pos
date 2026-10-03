import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ClinicalNotes, ClinicalTags } from "@/components/clinical-flags";
import { StatusChip } from "@/components/status-chip";
import { dateToJakartaLocal, stayDay } from "@/lib/admission-calc";
import { getAdmission, listAdmissionLogs } from "@/lib/admissions";
import { formatDate, formatTime } from "@/lib/format";
import { requireCapability } from "@/lib/require-role";
import { LogForm } from "../log-form";

export default async function AdmissionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCapability("monitor_admission");
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const admission = await getAdmission(id);
  if (!admission) notFound();
  const logs = await listAdmissionLogs(id);
  const active = admission.status === "AKTIF";
  const { patient } = admission;

  return (
    <div className="space-y-5">
      <header className="overflow-hidden rounded-[10px] border bg-card">
        <div className="flex flex-wrap items-start justify-between gap-3 p-4 px-5">
          <div className="space-y-1">
            <Link href="/rawat-inap" className="text-[13px] font-medium text-primary">← Rawat Inap & Hotel</Link>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[22px] font-semibold leading-11">{patient.name}</h1>
              <span className="text-sm text-muted-foreground tabular-nums">{patient.rmNo}</span>
              <ClinicalTags allergyNote={patient.allergyNote} aggressive={patient.aggressive} />
            </div>
            <p className="text-sm text-muted-foreground">
              {patient.species} · {admission.type === "HOTEL" ? "Hotel" : "Rawat inap"} {admission.room.name} · masuk {formatDate(admission.checkIn)} {formatTime(admission.checkIn)}
              {active && ` · Hari ke-${stayDay(admission.checkIn, new Date())}`}
            </p>
          </div>
          <StatusChip tone={active ? "warning" : "neutral"}>{active ? "Menginap" : "Selesai"}</StatusChip>
        </div>
        <ClinicalNotes allergyNote={patient.allergyNote} aggressive={patient.aggressive} behaviorNote={patient.behaviorNote} />
      </header>

      {active && admission.type === "RAWAT_INAP" && (
        <section className="space-y-3.5 rounded-[10px] border bg-card p-5">
          <h2 className="text-base font-semibold">Tambah monitoring</h2>
          <LogForm admissionId={admission.id} defaultTime={dateToJakartaLocal(new Date())} />
        </section>
      )}

      <section className="overflow-hidden rounded-[10px] border bg-card">
        <h2 className="border-b px-5 py-3 text-base font-semibold">Riwayat monitoring</h2>
        {logs.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Belum ada monitoring.</p>}
        {logs.map((log) => (
          <div key={log.id} className="grid grid-cols-[130px_minmax(0,1fr)] gap-4 border-b px-5 py-3.5 last:border-0">
            <div>
              <div className="text-[14.5px] font-medium">{formatDate(log.loggedAt)}</div>
              <div className="text-[13px] text-muted-foreground tabular-nums">{formatTime(log.loggedAt)} · {log.user.name}</div>
            </div>
            <div className="min-w-0 space-y-0.5 text-[14.5px]">
              {log.tempC !== null && <div>Suhu <span className="font-medium tabular-nums">{Number(log.tempC).toLocaleString("id-ID")} °C</span></div>}
              {log.intake && <div>{log.intake}</div>}
              {log.note && <div className="whitespace-pre-wrap text-muted-foreground">{log.note}</div>}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
