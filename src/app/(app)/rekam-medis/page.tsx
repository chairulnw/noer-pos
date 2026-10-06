import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { ClinicalTags } from "@/components/clinical-flags";
import { ListHeader, ListPage, ListToolbar, TableCard } from "@/components/data-table";
import { EmptyState } from "@/components/page-header";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { periodToRange, PERIODS } from "@/lib/date";
import { FilterSelect } from "@/components/filter-select";
import { formatDate } from "@/lib/format";
import { parsePaging, parseSort, type PagingParams, type SortParams } from "@/lib/paging";
import { listRecords } from "@/lib/records";
import { requireCapability } from "@/lib/require-role";
import { listDoctors } from "@/lib/visits";

type Params = { q?: string; status?: string; dokter?: string; periode?: string } & PagingParams & SortParams;

export default async function RecordsPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireCapability("view_medical_record");
  const params = await searchParams;
  const doctors = await listDoctors();
  const status = params.status === "BELUM" || params.status === "DRAFT" || params.status === "FINAL" ? params.status : undefined;
  const doctorId = doctors.some((d) => d.id === params.dokter) ? params.dokter : undefined;
  const { period, from, to } = periodToRange(params.periode);
  const { page, size, skip, take } = parsePaging(params);
  const sort = parseSort(params, { tanggal: (d) => ({ visitDate: d }), pasien: (d) => ({ patient: { name: d } }), dokter: (d) => ({ doctor: { name: d } }) });
  const { rows, total } = await listRecords({ q: params.q, status, doctorId, from, to }, skip, take, sort.orderBy);
  const keep = { q: params.q, status, dokter: doctorId, periode: period || undefined, baris: params.baris, ...sort.keep };

  return (
    <ListPage>
      <ListHeader icon={Stethoscope} title="Rekam Medis (EMR)" subtitle="Riwayat pemeriksaan SOAP, catatan klinis, dan diagnosis pasien" actions={<Button asChild><Link href="/pasien">+ Rekam Medis Baru</Link></Button>} />
      <ListToolbar base="/rekam-medis" params={{ q: params.q, baris: params.baris }} placeholder="Cari pasien, pemilik, no. RM, keluhan, diagnosis…" total={total}>
        <FilterSelect name="status" defaultValue={status ?? ""} aria-label="Status"><option value="">Semua status</option><option value="BELUM">Belum diisi</option><option value="DRAFT">Draft</option><option value="FINAL">Final</option></FilterSelect>
        {doctors.length > 1 && <FilterSelect name="dokter" defaultValue={doctorId ?? ""} aria-label="Dokter"><option value="">Semua dokter</option>{doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</FilterSelect>}
        <FilterSelect name="periode" defaultValue={period} aria-label="Periode">{PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</FilterSelect>
      </ListToolbar>
      <TableCard
        columns={[{ label: "Tanggal", sort: "tanggal" }, { label: "Pasien & pemilik", sort: "pasien" }, { label: "Dokter", sort: "dokter" }, { label: "Keluhan & diagnosis" }, { label: "Status" }, { label: "Aksi", align: "right" }]}
        total={total}
        page={page}
        size={size}
        base="/rekam-medis"
        params={keep}
        minWidth={760}
        empty={<EmptyState>Belum ada rekam medis. Mulai dari kunjungan pasien.</EmptyState>}
      >
        {rows.map((v) => {
          const record = v.medicalRecord;
          const state = !record ? { label: "Belum diisi", tone: "neutral" as const } : record.finalized ? { label: "Final", tone: "info" as const } : { label: "Draft", tone: "warning" as const };
          return (
            <tr key={v.id} className="border-b last:border-0">
              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(v.visitDate)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Link href={`/pasien/${v.patient.id}`} className="font-medium">{v.patient.name}</Link>
                  <ClinicalTags allergyNote={v.patient.allergyNote} aggressive={v.patient.aggressive} />
                </div>
                <div className="text-[12.5px] text-muted-foreground">{v.patient.rmNo} · {v.patient.owner.name}</div>
              </td>
              <td className="px-4 py-3">{v.doctor.name}</td>
              <td className="max-w-72 px-4 py-3"><div className="truncate">{v.complaint}</div>{record?.diagnosis && <div className="truncate text-[12.5px] text-muted-foreground">Dx: {record.diagnosis}</div>}</td>
              <td className="px-4 py-3"><StatusChip tone={state.tone}>{state.label}</StatusChip></td>
              <td className="px-4 py-3 text-right"><Button asChild variant={record ? "outline" : "default"}><Link href={`/rekam-medis/${v.id}`}>{record?.finalized ? "Lihat" : "Periksa"}</Link></Button></td>
            </tr>
          );
        })}
      </TableCard>
    </ListPage>
  );
}
