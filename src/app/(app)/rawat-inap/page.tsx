import Link from "next/link";
import { ClinicalTags } from "@/components/clinical-flags";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { stayDay } from "@/lib/admission-calc";
import { listActiveAdmissions } from "@/lib/admissions";
import { formatDate, formatTime } from "@/lib/format";
import { can } from "@/lib/permissions";
import { requireCapability } from "@/lib/require-role";

export default async function AdmissionsPage() {
  const user = await requireCapability("manage_admission");
  const canMonitor = can(user.role, "monitor_admission");
  const canInvoice = can(user.role, "manage_invoice_payment");
  const admissions = await listActiveAdmissions();
  const now = new Date();

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold leading-11">Rawat Inap & Hotel</h1>
          <p className="text-sm text-muted-foreground">{admissions.length} hewan menginap saat ini</p>
        </div>
        <Button asChild>
          <Link href="/rawat-inap/check-in">+ Check-in</Link>
        </Button>
      </header>

      <div className="overflow-x-auto rounded-[10px] border bg-card">
        <table className="w-full min-w-[720px] text-[14.5px]">
          <thead>
            <tr className="border-b text-left text-[13px] text-muted-foreground">
              <th className="px-4 py-2.5 font-normal">Kandang</th>
              <th className="px-4 py-2.5 font-normal">Pasien</th>
              <th className="px-4 py-2.5 font-normal">Jenis</th>
              <th className="px-4 py-2.5 font-normal">Masuk</th>
              <th className="px-4 py-2.5 font-normal">Lama</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {admissions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Tidak ada hewan yang menginap.</td>
              </tr>
            )}
            {admissions.map((a) => (
              <tr key={a.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{a.room.name}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link href={`/pasien?id=${a.patient.id}`} className="font-medium">{a.patient.name}</Link>
                    <ClinicalTags allergyNote={a.patient.allergyNote} aggressive={a.patient.aggressive} />
                  </div>
                  <div className="text-[13px] text-muted-foreground">{a.patient.species} · {a.rateItem.name}</div>
                </td>
                <td className="px-4 py-3"><StatusChip tone={a.type === "HOTEL" ? "info" : "warning"}>{a.type === "HOTEL" ? "Hotel" : "Rawat inap"}</StatusChip></td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(a.checkIn)} · {formatTime(a.checkIn)}</td>
                <td className="px-4 py-3 tabular-nums">Hari ke-{stayDay(a.checkIn, now)}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/rawat-inap/${a.id}/check-out`} className="inline-flex min-h-11 items-center px-2 font-medium text-primary">Check-out</Link>
                  {canMonitor && <Link href={`/rawat-inap/${a.id}`} className="inline-flex min-h-11 items-center px-2 font-medium text-primary">{a.type === "RAWAT_INAP" ? "Monitoring" : "Detail"}</Link>}
                  {canInvoice && a.invoices[0] && <Link href={`/invoice/${a.invoices[0].id}`} className="inline-flex min-h-11 items-center px-2 font-medium text-primary">Invoice</Link>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
