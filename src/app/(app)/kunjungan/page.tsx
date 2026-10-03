import Link from "next/link";
import { MoreMenu, menuItemClass } from "@/components/more-menu";
import { EmptyState } from "@/components/page-header";
import { AutoRefresh } from "@/components/auto-refresh";
import { ClinicalTags } from "@/components/clinical-flags";
import { ConfirmButton } from "@/components/confirm-button";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { todayJakarta } from "@/lib/date";
import { formatDate, formatTime } from "@/lib/format";
import { can } from "@/lib/permissions";
import { requireCapability } from "@/lib/require-role";
import { VISIT_STATUS } from "@/lib/visit-status";
import { listTodayVisits } from "@/lib/visits";
import { cancelVisitAction } from "./actions";

export default async function VisitsPage() {
  const user = await requireCapability("create_visit");
  const isDoctor = user.role === "DOKTER";
  const canOpenRecord = can(user.role, "view_medical_record");
  const visits = await listTodayVisits(isDoctor ? user.id : undefined);

  return (
    <div className="space-y-5">
      <AutoRefresh seconds={10} />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold leading-11">{isDoctor ? "Pasien Hari Ini" : "Kunjungan"}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(todayJakarta())}</p>
        </div>
        <Button asChild>
          <Link href="/pasien">+ Kunjungan baru</Link>
        </Button>
      </header>

      <div className="overflow-x-auto rounded-[10px] border bg-card">
        <table className="w-full min-w-[560px] text-[14.5px]">
          <thead>
            <tr className="border-b text-left text-[13px] text-muted-foreground">
              <th className="px-4 py-2.5 font-normal">Jam</th>
              <th className="px-4 py-2.5 font-normal">Pasien</th>
              <th className="px-4 py-2.5 font-normal">Keluhan</th>
              {!isDoctor && <th className="px-4 py-2.5 font-normal">Dokter</th>}
              <th className="px-4 py-2.5 font-normal">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {visits.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <EmptyState action={<Button asChild><Link href="/pasien">+ Kunjungan baru</Link></Button>}>Belum ada kunjungan hari ini.</EmptyState>
                </td>
              </tr>
            )}
            {visits.map((v) => (
              <tr key={v.id} className="border-b last:border-0">
                <td className="px-4 py-3 tabular-nums text-muted-foreground">{formatTime(v.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link href={`/pasien?id=${v.patient.id}`} className="font-medium">
                      {v.patient.name}
                    </Link>
                    <ClinicalTags allergyNote={v.patient.allergyNote} aggressive={v.patient.aggressive} />
                  </div>
                  <div className="text-[13px] text-muted-foreground">
                    {v.patient.species} · {v.patient.rmNo}
                  </div>
                </td>
                <td className="max-w-64 truncate px-4 py-3">{v.complaint}</td>
                {!isDoctor && <td className="px-4 py-3">{v.doctor.name}</td>}
                <td className="px-4 py-3">
                  <StatusChip tone={VISIT_STATUS[v.status].tone}>{VISIT_STATUS[v.status].label}</StatusChip>
                </td>
                <td className="px-4 py-3"><div className="flex items-center justify-end gap-2">
                  {canOpenRecord && v.status !== "BATAL" && (
                    <Button variant={v.status === "DILAYANI" ? "default" : "outline"} asChild>
                      <Link href={`/rekam-medis/${v.id}`}>{v.status === "DILAYANI" ? "Periksa" : "Rekam medis"}</Link>
                    </Button>
                  )}
                  {v.status === "DILAYANI" && (
                    <MoreMenu iconOnly label="Aksi lain">
                      <form action={cancelVisitAction.bind(null, v.id)}>
                        <ConfirmButton variant="ghost" confirmLabel="Ya, batalkan" message={`Batalkan kunjungan ${v.patient.name}?`} className={`${menuItemClass} h-auto justify-start rounded-md px-3 font-medium text-destructive`}>
                          Batalkan kunjungan
                        </ConfirmButton>
                      </form>
                    </MoreMenu>
                  )}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
