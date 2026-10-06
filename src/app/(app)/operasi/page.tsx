import Link from "next/link";
import { Scissors } from "lucide-react";
import { ClinicalTags } from "@/components/clinical-flags";
import { Chips, ListHeader, ListPage, ListToolbar, TableCard } from "@/components/data-table";
import { EmptyState } from "@/components/page-header";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { buildHref, parsePaging, type PagingParams } from "@/lib/paging";
import { requireCapability } from "@/lib/require-role";
import { pageSurgeries } from "@/lib/surgeries";
import { SURGERY_STATUS, type SurgeryStatus } from "@/lib/surgery-schema";

const STATUSES = Object.keys(SURGERY_STATUS) as SurgeryStatus[];

export default async function SurgeriesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string } & PagingParams> }) {
  await requireCapability("view_medical_record");
  const params = await searchParams;
  const active = STATUSES.find((s) => s === params.status);
  const { page, size, skip, take } = parsePaging(params);
  const { rows, total } = await pageSurgeries({ q: params.q, status: active }, skip, take);
  const keep = { q: params.q, status: active, baris: params.baris };
  const add = <Button asChild><Link href="/operasi/baru">+ Jadwal Operasi</Link></Button>;

  return (
    <ListPage>
      <ListHeader icon={Scissors} title="Bedah & Operasi" subtitle="Jadwal tindakan bedah, catatan pra dan pasca-operasi, serta tagihan otomatis" actions={add} />
      <ListToolbar base="/operasi" params={keep} placeholder="Cari prosedur, pasien, atau pemilik…" total={total} />
      <Chips items={[{ value: "", label: "Semua" }, ...STATUSES.map((s) => ({ value: s, label: SURGERY_STATUS[s].label }))]} active={active ?? ""} hrefFor={(v) => buildHref("/operasi", keep, { status: v || undefined, hal: undefined })} />
      <TableCard
        columns={[{ label: "Tanggal" }, { label: "Pasien" }, { label: "Prosedur" }, { label: "Dokter operator" }, { label: "Status" }, { label: "Aksi", align: "right" }]}
        total={total}
        page={page}
        size={size}
        base="/operasi"
        params={keep}
        minWidth={820}
        empty={<EmptyState action={add}>Belum ada jadwal operasi.</EmptyState>}
      >
        {rows.map((s) => (
          <tr key={s.id} className="border-b last:border-0">
            <td className="whitespace-nowrap px-4 py-3 tabular-nums">{formatDate(s.surgeryDate)}</td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-medium">{s.patient.name}</span>
                <ClinicalTags allergyNote={s.patient.allergyNote} aggressive={s.patient.aggressive} />
              </div>
              <div className="text-[12.5px] text-muted-foreground">{s.patient.species} · {s.patient.owner.name}</div>
            </td>
            <td className="max-w-64 px-4 py-3"><div className="truncate">{s.procedure}</div>{s.anesthesia && <div className="truncate text-[12.5px] text-muted-foreground">{s.anesthesia}</div>}</td>
            <td className="px-4 py-3">{s.doctor.name}</td>
            <td className="px-4 py-3"><StatusChip tone={SURGERY_STATUS[s.status].tone}>{SURGERY_STATUS[s.status].label}</StatusChip></td>
            <td className="px-4 py-3 text-right"><Link href={`/operasi/${s.id}`} className="inline-flex min-h-11 items-center px-2 font-medium text-primary">Detail</Link></td>
          </tr>
        ))}
      </TableCard>
    </ListPage>
  );
}
