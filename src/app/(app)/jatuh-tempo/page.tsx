import Link from "next/link";
import { todayJakarta } from "@/lib/date";
import { formatDate } from "@/lib/format";
import { formatWhatsapp } from "@/lib/patient-schema";
import { listDueVaccinations } from "@/lib/records";
import { requireCapability } from "@/lib/require-role";
import { StatusChip } from "@/components/status-chip";
import { cn } from "@/lib/utils";

const RANGES = [7, 14, 30];

export default async function DuePage({ searchParams }: { searchParams: Promise<{ hari?: string }> }) {
  await requireCapability("view_medical_record");
  const { hari } = await searchParams;
  const days = RANGES.includes(Number(hari)) ? Number(hari) : 14;
  const rows = await listDueVaccinations(days);
  const today = todayJakarta().getTime();

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold leading-11">Jatuh Tempo</h1>
          <p className="text-sm text-muted-foreground">Vaksin yang jatuh tempo dalam {days} hari ke depan, termasuk yang sudah lewat.</p>
        </div>
        <div className="flex gap-1.5">
          {RANGES.map((r) => (
            <Link key={r} href={`/jatuh-tempo?hari=${r}`} className={cn("flex h-11 items-center rounded-lg border px-4 text-sm font-medium", r === days ? "border-primary bg-accent text-primary" : "bg-card")}>
              {r} hari
            </Link>
          ))}
        </div>
      </header>

      <div className="overflow-x-auto rounded-[10px] border bg-card">
        <table className="w-full min-w-[560px] text-[14.5px]">
          <thead>
            <tr className="border-b text-left text-[13px] text-muted-foreground">
              <th className="px-4 py-2.5 font-normal">Pasien</th>
              <th className="px-4 py-2.5 font-normal">Owner</th>
              <th className="px-4 py-2.5 font-normal">No. WA</th>
              <th className="px-4 py-2.5 font-normal">Vaksin</th>
              <th className="px-4 py-2.5 font-normal">Jatuh tempo</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Tidak ada vaksin jatuh tempo.</td>
              </tr>
            )}
            {rows.map((row) => {
              const patient = row.record.visit.patient;
              const late = row.nextDue!.getTime() < today;
              return (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/pasien?id=${patient.id}`} className="font-medium">{patient.name}</Link>
                    <div className="text-[13px] text-muted-foreground">{patient.species}</div>
                  </td>
                  <td className="px-4 py-3">{patient.owner.name}</td>
                  <td className="px-4 py-3 tabular-nums">{formatWhatsapp(patient.owner.whatsapp)}</td>
                  <td className="px-4 py-3">{row.item.name}</td>
                  <td className="px-4 py-3">
                    <StatusChip tone={late ? "danger" : "warning"}>{formatDate(row.nextDue!)}{late && " · lewat"}</StatusChip>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
