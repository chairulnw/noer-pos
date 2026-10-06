import Link from "next/link";
import { BedDouble, Hotel } from "lucide-react";
import { ListHeader, ListPage, TableCard } from "@/components/data-table";
import { MoreMenu, menuItemClass } from "@/components/more-menu";
import { EmptyState } from "@/components/page-header";
import { ClinicalTags } from "@/components/clinical-flags";
import { Button } from "@/components/ui/button";
import { stayDay } from "@/lib/admission-calc";
import { admissionBase, type AdmissionType } from "@/lib/admission-paths";
import { listActiveAdmissions } from "@/lib/admissions";
import { formatDate, formatTime } from "@/lib/format";
import { parsePaging, type PagingParams } from "@/lib/paging";
import { can } from "@/lib/permissions";
import { requireCapability } from "@/lib/require-role";

export async function AdmissionsList({ type, searchParams }: { type: AdmissionType; searchParams: Promise<PagingParams> }) {
  const user = await requireCapability("manage_admission");
  const params = await searchParams;
  const canMonitor = can(user.role, "monitor_admission");
  const canInvoice = can(user.role, "manage_invoice_payment");
  const admissions = await listActiveAdmissions(type);
  const base = admissionBase(type);
  const now = new Date();
  const { page, size, skip, take } = parsePaging(params);
  const rows = admissions.slice(skip, skip + take);
  const checkIn = <Button asChild><Link href={`${base}/check-in`}>+ Check-in</Link></Button>;

  return (
    <ListPage>
      <ListHeader
        icon={type === "HOTEL" ? Hotel : BedDouble}
        title={type === "HOTEL" ? "Pet Hotel & Penitipan" : "Rawat Inap (Inpatients)"}
        subtitle={type === "HOTEL" ? "Penitipan hewan, nomor kandang, instruksi pakan, dan check-out" : "Monitoring pasien opname, nomor kandang, dan kepulangan"}
        actions={<>{type === "HOTEL" && can(user.role, "manage_rooms") && <Button asChild variant="outline"><Link href="/master-data/kandang">Master Kandang</Link></Button>}{checkIn}</>}
      />
      <TableCard
        columns={[{ label: "Nomor kandang" }, { label: "Pasien & pemilik" }, { label: "Tgl masuk" }, { label: "Lama" }, { label: "Aksi", align: "right" }]}
        total={admissions.length}
        page={page}
        size={size}
        base={base}
        params={{ baris: params.baris }}
        minWidth={640}
        empty={<EmptyState action={checkIn}>{type === "HOTEL" ? "Tidak ada anabul yang sedang menginap. Klik Check-in untuk mendaftarkan pasien penitipan baru." : "Belum ada pasien rawat inap. Mulai catat pasien rawat inap baru untuk pemantauan intensif."}</EmptyState>}
      >
        {rows.map((a) => (
          <tr key={a.id} className="border-b last:border-0">
            <td className="px-4 py-3 font-medium">{a.room.name}</td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <Link href={`/pasien/${a.patient.id}`} className="font-medium">{a.patient.name}</Link>
                <ClinicalTags allergyNote={a.patient.allergyNote} aggressive={a.patient.aggressive} />
              </div>
              <div className="text-[12.5px] text-muted-foreground">{a.patient.species} · {a.rateItem.name}</div>
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
      </TableCard>
    </ListPage>
  );
}
