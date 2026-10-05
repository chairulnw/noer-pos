import Link from "next/link";
import { MoreMenu, menuItemClass } from "@/components/more-menu";
import { EmptyState } from "@/components/page-header";
import { ClinicalTags } from "@/components/clinical-flags";
import { Button } from "@/components/ui/button";
import { stayDay } from "@/lib/admission-calc";
import { admissionBase, admissionLabel, type AdmissionType } from "@/lib/admission-paths";
import { listActiveAdmissions } from "@/lib/admissions";
import { formatDate, formatTime } from "@/lib/format";
import { can } from "@/lib/permissions";
import { requireCapability } from "@/lib/require-role";

export async function AdmissionsList({ type }: { type: AdmissionType }) {
  const user = await requireCapability("manage_admission");
  const canMonitor = can(user.role, "monitor_admission");
  const canInvoice = can(user.role, "manage_invoice_payment");
  const admissions = await listActiveAdmissions(type);
  const base = admissionBase(type);
  const title = admissionLabel(type);
  const now = new Date();

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold leading-11">{title}</h1>
          <p className="text-sm text-muted-foreground">{admissions.length} hewan {type === "HOTEL" ? "dititipkan" : "dirawat"} saat ini</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {type === "HOTEL" && can(user.role, "manage_rooms") && <Button asChild variant="outline"><Link href="/master-data/kandang">Master Kandang</Link></Button>}
          <Button asChild>
            <Link href={`${base}/check-in`}>+ Check-in</Link>
          </Button>
        </div>
      </header>

      <div className="overflow-x-auto rounded-[10px] border bg-card">
        <table className="w-full min-w-[600px] text-[14.5px]">
          <thead>
            <tr className="border-b text-left text-[13px] text-muted-foreground">
              <th className="px-4 py-2.5 font-normal">Kandang</th>
              <th className="px-4 py-2.5 font-normal">Pasien</th>
                            <th className="px-4 py-2.5 font-normal">Masuk</th>
              <th className="px-4 py-2.5 font-normal">Lama</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {admissions.length === 0 && (
              <tr>
                <td colSpan={5}><EmptyState action={<Button asChild><Link href={`${base}/check-in`}>+ Check-in</Link></Button>}>Tidak ada hewan yang sedang menginap.</EmptyState></td>
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
                <td className="px-4 py-3 text-muted-foreground">{formatDate(a.checkIn)} · {formatTime(a.checkIn)}</td>
                <td className="px-4 py-3 tabular-nums">Hari ke-{stayDay(a.checkIn, now)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {canMonitor ? (
                      <Button asChild variant="outline"><Link href={`${base}/${a.id}`}>{type === "RAWAT_INAP" ? "Monitoring" : "Detail"}</Link></Button>
                    ) : (
                      <Button asChild variant="outline"><Link href={`${base}/${a.id}/check-out`}>Check-out</Link></Button>
                    )}
                    <MoreMenu iconOnly label="Aksi lain">
                      {canMonitor && <Link role="menuitem" href={`${base}/${a.id}/check-out`} className={menuItemClass}>Check-out</Link>}
                      {canInvoice && a.invoices[0] && <Link role="menuitem" href={`/invoice/${a.invoices[0].id}`} className={menuItemClass}>Invoice</Link>}
                    </MoreMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
