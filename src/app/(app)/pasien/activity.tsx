import Link from "next/link";
import { BedDouble, FlaskConical, HeartPulse, Scissors, Stethoscope, Syringe, type LucideIcon } from "lucide-react";
import { StatusChip } from "@/components/status-chip";
import { formatDate } from "@/lib/format";
import { EXAM } from "@/lib/examination-schema";
import { GROOMING_STATUS } from "@/lib/grooming-schema";
import { SURGERY_STATUS } from "@/lib/surgery-schema";
import type { getPatientHistory } from "@/lib/patients";
import type { listPatientAdmissions } from "@/lib/admissions";
import type { listPatientGroomings } from "@/lib/groomings";
import type { listPatientSurgeries } from "@/lib/surgeries";
import { cn } from "@/lib/utils";

export type Activity = { key: string; date: Date; icon: LucideIcon; tone: string; title: string; detail?: string; href?: string; chip?: { label: string; tone: "info" | "success" | "warning" | "neutral" | "danger" } };

type Sources = {
  history: Awaited<ReturnType<typeof getPatientHistory>> | null;
  surgeries: Awaited<ReturnType<typeof listPatientSurgeries>>;
  groomings: Awaited<ReturnType<typeof listPatientGroomings>>;
  admissions: Awaited<ReturnType<typeof listPatientAdmissions>>;
  petName?: string;
};

export function buildActivities({ history, surgeries, groomings, admissions, petName }: Sources): Activity[] {
  const pet = petName ? `${petName} · ` : "";
  const items: Activity[] = [
    ...(history?.visits ?? []).map((v) => ({ key: `v${v.id}`, date: v.visitDate, icon: Stethoscope, tone: "bg-info/10 text-info", title: `${pet}Kunjungan · ${v.medicalRecord?.diagnosis || v.complaint}`, detail: `${v.doctor.name}${v.medicalRecord?.diagnosis ? ` · Keluhan: ${v.complaint}` : ""}`, href: `/rekam-medis/${v.id}`, chip: v.medicalRecord?.finalized ? { label: "Final", tone: "info" as const } : { label: v.medicalRecord ? "Draft" : "Belum diisi", tone: "neutral" as const } })),
    ...(history?.vaccinations ?? []).map((v) => ({ key: `x${v.id}`, date: v.givenAt, icon: Syringe, tone: "bg-success/10 text-success", title: `${pet}Vaksin ${v.item.name}`, detail: [v.batchNo && `Batch ${v.batchNo}`, v.nextDue && `ulang ${formatDate(v.nextDue)}`].filter(Boolean).join(" · ") })),
    ...(history?.examinations ?? []).map((e) => ({ key: `e${e.id}`, date: e.performedAt, icon: FlaskConical, tone: "bg-accent text-primary", title: `${pet}${e.type === "LAB" ? "Hasil lab" : "Radiologi"} · ${e.name}`, detail: e.findings ?? undefined, href: `${EXAM[e.type].path}/${e.id}` })),
    ...surgeries.map((s) => ({ key: `s${s.id}`, date: s.surgeryDate, icon: HeartPulse, tone: "bg-destructive/10 text-destructive", title: `${pet}Operasi · ${s.procedure}`, detail: s.doctor.name, href: `/operasi/${s.id}`, chip: { label: SURGERY_STATUS[s.status].label, tone: SURGERY_STATUS[s.status].tone } })),
    ...groomings.map((g) => ({ key: `g${g.id}`, date: g.groomingDate, icon: Scissors, tone: "bg-warning/10 text-warning", title: `${pet}Grooming · ${g.serviceItem?.name ?? "Layanan"}`, detail: g.notes ?? undefined, href: `/grooming/${g.id}`, chip: { label: GROOMING_STATUS[g.status].label, tone: GROOMING_STATUS[g.status].tone } })),
    ...admissions.map((a) => ({ key: `a${a.id}`, date: a.checkIn, icon: BedDouble, tone: "bg-info/10 text-info", title: `${pet}${a.type === "HOTEL" ? "Pet Hotel" : "Rawat inap"} · Kandang ${a.room.name}`, detail: `${formatDate(a.checkIn)}${a.checkOut ? ` – ${formatDate(a.checkOut)}` : " – sekarang"}${a.billedDays !== null ? ` · ${a.billedDays} hari` : ""}`, href: `${a.type === "HOTEL" ? "/pet-hotel" : "/rawat-inap"}/${a.id}`, chip: a.status === "AKTIF" ? { label: "Menginap", tone: "warning" as const } : { label: "Selesai", tone: "neutral" as const } })),
  ];
  return items.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function ActivityList({ items }: { items: Activity[] }) {
  if (items.length === 0) return <p className="text-[14px] text-muted-foreground">Belum ada aktivitas.</p>;
  return (
    <ol>
      {items.map((a) => {
        const inner = (
          <>
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-primary"><a.icon className="size-4" /></span>
            <span className="w-24 shrink-0 text-[13px] text-muted-foreground tabular-nums">{formatDate(a.date)}</span>
            <span className="min-w-0 flex-1"><span className="block truncate font-medium">{a.title}</span>{a.detail && <span className="block truncate text-[13px] text-muted-foreground">{a.detail}</span>}</span>
            {a.chip && <StatusChip tone={a.chip.tone}>{a.chip.label}</StatusChip>}
          </>
        );
        return (
          <li key={a.key}>
            {a.href ? <Link href={a.href} className={cn("flex items-center gap-3 border-b py-3 last:border-0 hover:bg-accent/40")}>{inner}</Link> : <div className="flex items-center gap-3 border-b py-3 last:border-0">{inner}</div>}
          </li>
        );
      })}
    </ol>
  );
}
