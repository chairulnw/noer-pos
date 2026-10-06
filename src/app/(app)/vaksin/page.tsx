import Link from "next/link";
import { Syringe } from "lucide-react";
import { Chips, ListHeader, ListPage, ListToolbar, TableCard } from "@/components/data-table";
import { EmptyState } from "@/components/page-header";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { periodToRange, PERIODS } from "@/lib/date";
import { FilterSelect } from "@/components/filter-select";
import { todayJakarta } from "@/lib/date";
import { formatDate } from "@/lib/format";
import { buildHref, parsePaging, type PagingParams } from "@/lib/paging";
import { formatWhatsapp } from "@/lib/patient-schema";
import { listDueVaccinations, listVaccinations } from "@/lib/records";
import { requireCapability } from "@/lib/require-role";

type Params = { tampilan?: string; hari?: string; q?: string; periode?: string } & PagingParams;

const RANGES = [7, 14, 30];

export default async function VaccinesPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireCapability("view_medical_record");
  const params = await searchParams;
  const due = params.tampilan === "jatuh-tempo";
  const { page, size, skip, take } = parsePaging(params);
  const tabs = [{ value: "riwayat", label: "Riwayat Vaksinasi" }, { value: "jatuh-tempo", label: "Jatuh Tempo" }];
  const tabs$ = <Chips items={tabs} active={due ? "jatuh-tempo" : "riwayat"} hrefFor={(v) => (v === "riwayat" ? "/vaksin" : "/vaksin?tampilan=jatuh-tempo")} />;
  const header = <ListHeader icon={Syringe} title="Vaksinasi Pasien" subtitle="Jadwal vaksinasi, nomor batch, dan jadwal vaksin ulang. Pencatatan dari rekam medis kunjungan" actions={<Button asChild variant="outline"><Link href="/rekam-medis">Buka Rekam Medis</Link></Button>} />;

  if (due) {
    const days = RANGES.includes(Number(params.hari)) ? Number(params.hari) : 14;
    const all = await listDueVaccinations(days);
    const rows = all.slice(skip, skip + take);
    const today = todayJakarta().getTime();
    const keep = { tampilan: "jatuh-tempo", hari: String(days), baris: params.baris };
    return (
      <ListPage>
        {header}
        {tabs$}
        <Chips items={RANGES.map((r) => ({ value: String(r), label: `${r} hari` }))} active={String(days)} hrefFor={(v) => buildHref("/vaksin", keep, { hari: v, hal: undefined })} />
        <TableCard
          columns={[{ label: "Pasien" }, { label: "Pemilik" }, { label: "No. WhatsApp" }, { label: "Vaksin" }, { label: "Jatuh tempo" }]}
          total={all.length}
          page={page}
          size={size}
          base="/vaksin"
          params={keep}
          minWidth={560}
          empty={<EmptyState>Tidak ada vaksin yang jatuh tempo dalam {days} hari.</EmptyState>}
        >
          {rows.map((row) => {
            const patient = row.record.visit.patient;
            const late = row.nextDue!.getTime() < today;
            return (
              <tr key={row.id} className="border-b last:border-0">
                <td className="px-4 py-3"><Link href={`/pasien?id=${patient.id}`} className="font-medium">{patient.name}</Link><div className="text-[12.5px] text-muted-foreground">{patient.species}</div></td>
                <td className="px-4 py-3">{patient.owner.name}</td>
                <td className="px-4 py-3 tabular-nums">{formatWhatsapp(patient.owner.whatsapp)}</td>
                <td className="px-4 py-3">{row.item.name}</td>
                <td className="px-4 py-3"><StatusChip tone={late ? "danger" : "warning"}>{formatDate(row.nextDue!)}{late && " · lewat"}</StatusChip></td>
              </tr>
            );
          })}
        </TableCard>
      </ListPage>
    );
  }

  const { period, from, to } = periodToRange(params.periode);
  const { rows, total } = await listVaccinations({ q: params.q, from, to }, skip, take);
  const keep = { q: params.q, periode: period || undefined, baris: params.baris };

  return (
    <ListPage>
      {header}
      {tabs$}
      <ListToolbar base="/vaksin" params={{ q: params.q, baris: params.baris }} placeholder="Cari pasien, pemilik, vaksin, atau no. batch…" total={total}>
        <FilterSelect name="periode" defaultValue={period} aria-label="Periode">{PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</FilterSelect>
      </ListToolbar>
      <TableCard
        columns={[{ label: "Tgl diberikan" }, { label: "Pasien & pemilik" }, { label: "Nama vaksin & batch" }, { label: "Vaksin ulang (due)" }, { label: "Aksi", align: "right" }]}
        total={total}
        page={page}
        size={size}
        base="/vaksin"
        params={keep}
        minWidth={680}
        empty={<EmptyState>Belum ada riwayat vaksinasi. Mulai catat imunisasi dari rekam medis.</EmptyState>}
      >
        {rows.map((row) => {
          const { patient, id: visitId } = row.record.visit;
          return (
            <tr key={row.id} className="border-b last:border-0">
              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(row.givenAt)}</td>
              <td className="px-4 py-3"><Link href={`/pasien?id=${patient.id}`} className="font-medium">{patient.name}</Link><div className="text-[12.5px] text-muted-foreground">{patient.rmNo} · {patient.owner.name}</div></td>
              <td className="px-4 py-3">{row.item.name}<div className="text-[12.5px] text-muted-foreground">{row.batchNo ? `Batch ${row.batchNo}` : "Tanpa batch"}</div></td>
              <td className="px-4 py-3">{row.nextDue ? formatDate(row.nextDue) : <span className="text-muted-foreground">-</span>}</td>
              <td className="px-4 py-3 text-right"><Button asChild variant="outline"><Link href={`/rekam-medis/${visitId}`}>Rekam medis</Link></Button></td>
            </tr>
          );
        })}
      </TableCard>
    </ListPage>
  );
}
