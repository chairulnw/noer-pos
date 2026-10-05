import Link from "next/link";
import { ClinicalTags } from "@/components/clinical-flags";
import { EmptyState } from "@/components/page-header";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { parseYmd } from "@/lib/appointment-calc";
import { formatDate } from "@/lib/format";
import { listRecords } from "@/lib/records";
import { requireCapability } from "@/lib/require-role";
import { listDoctors } from "@/lib/visits";

type Params = { q?: string; status?: string; dokter?: string; dari?: string; sampai?: string };

const field = "h-11 rounded-lg border border-input bg-card px-3 text-sm";

export default async function RecordsPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireCapability("view_medical_record");
  const params = await searchParams;
  const doctors = await listDoctors();
  const status = params.status === "BELUM" || params.status === "DRAFT" || params.status === "FINAL" ? params.status : undefined;
  const doctorId = doctors.some((d) => d.id === params.dokter) ? params.dokter : undefined;
  const from = parseYmd(params.dari) ?? undefined;
  const to = parseYmd(params.sampai) ?? undefined;
  const rows = await listRecords({ q: params.q, status, doctorId, from, to });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold leading-11">Rekam Medis</h1>
          <p className="text-sm text-muted-foreground">Riwayat pemeriksaan SOAP, catatan klinis, dan diagnosis pasien.</p>
        </div>
        <Button asChild><Link href="/pasien">+ Kunjungan baru</Link></Button>
      </header>

      <form className="flex flex-wrap items-end gap-3 rounded-[10px] border bg-card p-4">
        <label className="min-w-56 flex-1 space-y-1 text-[13px] text-muted-foreground">Cari<input name="q" defaultValue={params.q ?? ""} placeholder="Pasien, pemilik, no. RM, keluhan, diagnosis" className={`${field} block w-full`} /></label>
        <label className="space-y-1 text-[13px] text-muted-foreground">Dokter
          <select name="dokter" defaultValue={doctorId ?? ""} className={`${field} block`}><option value="">Semua</option>{doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
        </label>
        <label className="space-y-1 text-[13px] text-muted-foreground">Status
          <select name="status" defaultValue={status ?? ""} className={`${field} block`}><option value="">Semua</option><option value="BELUM">Belum diisi</option><option value="DRAFT">Draft</option><option value="FINAL">Final</option></select>
        </label>
        <label className="space-y-1 text-[13px] text-muted-foreground">Dari<input type="date" name="dari" defaultValue={from ?? ""} className={`${field} block`} /></label>
        <label className="space-y-1 text-[13px] text-muted-foreground">Sampai<input type="date" name="sampai" defaultValue={to ?? ""} className={`${field} block`} /></label>
        <Button type="submit">Terapkan</Button>
        <Link href="/rekam-medis" className="flex h-11 items-center px-2 text-sm font-medium text-primary">Reset</Link>
      </form>

      <div className="overflow-x-auto rounded-[10px] border bg-card">
        <table className="w-full min-w-[760px] text-[14.5px]">
          <thead>
            <tr className="border-b text-left text-[13px] text-muted-foreground">
              <th className="px-4 py-2.5 font-normal">Tanggal</th>
              <th className="px-4 py-2.5 font-normal">Pasien & pemilik</th>
              <th className="px-4 py-2.5 font-normal">Dokter</th>
              <th className="px-4 py-2.5 font-normal">Keluhan & diagnosis</th>
              <th className="px-4 py-2.5 font-normal">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6}><EmptyState>Belum ada rekam medis yang cocok.</EmptyState></td></tr>}
            {rows.map((v) => {
              const record = v.medicalRecord;
              const state = !record ? { label: "Belum diisi", tone: "neutral" as const } : record.finalized ? { label: "Final", tone: "info" as const } : { label: "Draft", tone: "warning" as const };
              return (
                <tr key={v.id} className="border-b last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(v.visitDate)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Link href={`/pasien?id=${v.patient.id}`} className="font-medium">{v.patient.name}</Link>
                      <ClinicalTags allergyNote={v.patient.allergyNote} aggressive={v.patient.aggressive} />
                    </div>
                    <div className="text-[13px] text-muted-foreground">{v.patient.rmNo} · {v.patient.owner.name}</div>
                  </td>
                  <td className="px-4 py-3">{v.doctor.name}</td>
                  <td className="max-w-72 px-4 py-3"><div className="truncate">{v.complaint}</div>{record?.diagnosis && <div className="truncate text-[13px] text-muted-foreground">Dx: {record.diagnosis}</div>}</td>
                  <td className="px-4 py-3"><StatusChip tone={state.tone}>{state.label}</StatusChip></td>
                  <td className="px-4 py-3 text-right"><Button asChild variant={record ? "outline" : "default"}><Link href={`/rekam-medis/${v.id}`}>{record?.finalized ? "Lihat" : "Periksa"}</Link></Button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length === 100 && <p className="text-[13px] text-muted-foreground">Menampilkan 100 rekam medis terbaru. Persempit dengan pencarian atau filter.</p>}
    </div>
  );
}
