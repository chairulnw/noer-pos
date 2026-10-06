import Link from "next/link";
import { Scissors } from "lucide-react";
import { ClinicalTags } from "@/components/clinical-flags";
import { Chips, ListHeader, ListPage, ListToolbar, TableCard } from "@/components/data-table";
import { EmptyState } from "@/components/page-header";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { GROOMING_STATUS, type GroomingStatus } from "@/lib/grooming-schema";
import { pageGroomings } from "@/lib/groomings";
import { buildHref, parsePaging, type PagingParams } from "@/lib/paging";
import { requireCapability } from "@/lib/require-role";

const STATUSES = Object.keys(GROOMING_STATUS) as GroomingStatus[];

export default async function GroomingPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string } & PagingParams> }) {
  await requireCapability("create_visit");
  const params = await searchParams;
  const active = STATUSES.find((s) => s === params.status);
  const { page, size, skip, take } = parsePaging(params);
  const { rows, total } = await pageGroomings({ q: params.q, status: active }, skip, take);
  const keep = { q: params.q, status: active, baris: params.baris };
  const add = <Button asChild><Link href="/grooming/baru">+ Grooming Baru</Link></Button>;

  return (
    <ListPage>
      <ListHeader icon={Scissors} title="Grooming & Salon" subtitle="Antrean perawatan hewan, status pengerjaan, dan tagihan otomatis saat selesai" actions={add} />
      <ListToolbar base="/grooming" params={keep} placeholder="Cari pasien, pemilik, atau layanan…" total={total} />
      <Chips items={[{ value: "", label: "Semua" }, ...STATUSES.map((s) => ({ value: s, label: GROOMING_STATUS[s].label }))]} active={active ?? ""} hrefFor={(v) => buildHref("/grooming", keep, { status: v || undefined, hal: undefined })} />
      <TableCard
        columns={[{ label: "Tanggal" }, { label: "Pasien" }, { label: "Layanan" }, { label: "Status" }, { label: "Aksi", align: "right" }]}
        total={total}
        page={page}
        size={size}
        base="/grooming"
        params={keep}
        minWidth={720}
        empty={<EmptyState action={add}>Belum ada data grooming.</EmptyState>}
      >
        {rows.map((g) => (
          <tr key={g.id} className="border-b last:border-0">
            <td className="whitespace-nowrap px-4 py-3 tabular-nums">{formatDate(g.groomingDate)}</td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-1.5"><span className="font-medium">{g.patient.name}</span><ClinicalTags allergyNote={g.patient.allergyNote} aggressive={g.patient.aggressive} /></div>
              <div className="text-[12.5px] text-muted-foreground">{g.patient.species} · {g.patient.owner.name}</div>
            </td>
            <td className="px-4 py-3">{g.serviceItem?.name ?? "—"}</td>
            <td className="px-4 py-3"><StatusChip tone={GROOMING_STATUS[g.status].tone}>{GROOMING_STATUS[g.status].label}</StatusChip></td>
            <td className="px-4 py-3 text-right"><Link href={`/grooming/${g.id}`} className="inline-flex min-h-11 items-center px-2 font-medium text-primary">Detail</Link></td>
          </tr>
        ))}
      </TableCard>
    </ListPage>
  );
}
