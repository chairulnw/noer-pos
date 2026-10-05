import Link from "next/link";
import { EmptyState } from "@/components/page-header";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { parseYmd } from "@/lib/appointment-calc";
import { todayJakarta } from "@/lib/date";
import { formatDate } from "@/lib/format";
import { formatWhatsapp } from "@/lib/patient-schema";
import { listDueVaccinations, listVaccinations } from "@/lib/records";
import { requireCapability } from "@/lib/require-role";
import { cn } from "@/lib/utils";

type Params = { tampilan?: string; hari?: string; q?: string; dari?: string; sampai?: string };

const RANGES = [7, 14, 30];
const pill = (active: boolean) => cn("flex h-11 shrink-0 items-center rounded-lg border px-4 text-sm font-medium", active ? "border-primary bg-accent text-primary" : "bg-card");
const field = "h-11 rounded-lg border border-input bg-card px-3 text-sm";

export default async function VaccinesPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireCapability("view_medical_record");
  const params = await searchParams;
  const due = params.tampilan === "jatuh-tempo";

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold leading-11">Vaksinasi Pasien</h1>
          <p className="text-sm text-muted-foreground">Riwayat vaksin, nomor batch, dan jadwal vaksin ulang. Pencatatan dilakukan dari rekam medis kunjungan.</p>
        </div>
        <Button asChild variant="outline"><Link href="/rekam-medis">Buka Rekam Medis</Link></Button>
      </header>

      <div role="tablist" className="flex gap-1.5 overflow-x-auto">
        <Link href="/vaksin" role="tab" aria-selected={!due} className={pill(!due)}>Riwayat Vaksinasi</Link>
        <Link href="/vaksin?tampilan=jatuh-tempo" role="tab" aria-selected={due} className={pill(due)}>Jatuh Tempo</Link>
      </div>

      {due ? <DueView hari={params.hari} /> : <HistoryView params={params} />}
    </div>
  );
}

async function HistoryView({ params }: { params: Params }) {
  const from = parseYmd(params.dari) ?? undefined;
  const to = parseYmd(params.sampai) ?? undefined;
  const rows = await listVaccinations({ q: params.q, from, to });

  return (
    <div className="space-y-4">
      <form className="flex flex-wrap items-end gap-3 rounded-[10px] border bg-card p-4">
        <label className="min-w-56 flex-1 space-y-1 text-[13px] text-muted-foreground">Cari<input name="q" defaultValue={params.q ?? ""} placeholder="Pasien, pemilik, vaksin, atau no. batch" className={`${field} block w-full`} /></label>
        <label className="space-y-1 text-[13px] text-muted-foreground">Dari<input type="date" name="dari" defaultValue={from ?? ""} className={`${field} block`} /></label>
        <label className="space-y-1 text-[13px] text-muted-foreground">Sampai<input type="date" name="sampai" defaultValue={to ?? ""} className={`${field} block`} /></label>
        <Button type="submit">Terapkan</Button>
        <Link href="/vaksin" className="flex h-11 items-center px-2 text-sm font-medium text-primary">Reset</Link>
      </form>

      <div className="overflow-x-auto rounded-[10px] border bg-card">
        <table className="w-full min-w-[680px] text-[14.5px]">
          <thead>
            <tr className="border-b text-left text-[13px] text-muted-foreground">
              <th className="px-4 py-2.5 font-normal">Tanggal diberikan</th>
              <th className="px-4 py-2.5 font-normal">Pasien & pemilik</th>
              <th className="px-4 py-2.5 font-normal">Vaksin & batch</th>
              <th className="px-4 py-2.5 font-normal">Vaksin ulang</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={5}><EmptyState>Belum ada riwayat vaksinasi yang cocok.</EmptyState></td></tr>}
            {rows.map((row) => {
              const { patient, id: visitId } = row.record.visit;
              return (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(row.givenAt)}</td>
                  <td className="px-4 py-3"><Link href={`/pasien?id=${patient.id}`} className="font-medium">{patient.name}</Link><div className="text-[13px] text-muted-foreground">{patient.rmNo} · {patient.owner.name}</div></td>
                  <td className="px-4 py-3">{row.item.name}<div className="text-[13px] text-muted-foreground">{row.batchNo ? `Batch ${row.batchNo}` : "Tanpa batch"}</div></td>
                  <td className="px-4 py-3">{row.nextDue ? formatDate(row.nextDue) : <span className="text-muted-foreground">-</span>}</td>
                  <td className="px-4 py-3 text-right"><Button asChild variant="outline"><Link href={`/rekam-medis/${visitId}`}>Rekam medis</Link></Button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length === 100 && <p className="text-[13px] text-muted-foreground">Menampilkan 100 vaksinasi terbaru. Persempit dengan pencarian atau tanggal.</p>}
    </div>
  );
}

async function DueView({ hari }: { hari?: string }) {
  const days = RANGES.includes(Number(hari)) ? Number(hari) : 14;
  const rows = await listDueVaccinations(days);
  const today = todayJakarta().getTime();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Vaksin yang jatuh tempo dalam {days} hari ke depan, termasuk yang sudah lewat.</p>
        <div className="flex gap-1.5">
          {RANGES.map((r) => <Link key={r} href={`/vaksin?tampilan=jatuh-tempo&hari=${r}`} className={pill(r === days)}>{r} hari</Link>)}
        </div>
      </div>
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
            {rows.length === 0 && <tr><td colSpan={5}><EmptyState>Tidak ada vaksin jatuh tempo.</EmptyState></td></tr>}
            {rows.map((row) => {
              const patient = row.record.visit.patient;
              const late = row.nextDue!.getTime() < today;
              return (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-4 py-3"><Link href={`/pasien?id=${patient.id}`} className="font-medium">{patient.name}</Link><div className="text-[13px] text-muted-foreground">{patient.species}</div></td>
                  <td className="px-4 py-3">{patient.owner.name}</td>
                  <td className="px-4 py-3 tabular-nums">{formatWhatsapp(patient.owner.whatsapp)}</td>
                  <td className="px-4 py-3">{row.item.name}</td>
                  <td className="px-4 py-3"><StatusChip tone={late ? "danger" : "warning"}>{formatDate(row.nextDue!)}{late && " · lewat"}</StatusChip></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
