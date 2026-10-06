import Link from "next/link";
import { Cat } from "lucide-react";
import { ListHeader, ListPage, ListToolbar, TableCard } from "@/components/data-table";
import { EmptyState } from "@/components/page-header";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { pageSpecies } from "@/lib/animals";
import { formatDate } from "@/lib/format";
import { parsePaging, parseSort, type PagingParams, type SortParams } from "@/lib/paging";
import { requireCapability } from "@/lib/require-role";

export default async function SpeciesPage({ searchParams }: { searchParams: Promise<{ q?: string } & PagingParams & SortParams> }) {
  await requireCapability("manage_users_settings");
  const params = await searchParams;
  const { page, size, skip, take } = parsePaging(params);
  const sort = parseSort(params, { nama: (d) => ({ name: d }), ras: (d) => ({ breeds: { _count: d } }), status: (d) => ({ active: d }), tanggal: (d) => ({ createdAt: d }) });
  const { rows, total } = await pageSpecies(params.q, skip, take, sort.orderBy);
  const keep = { q: params.q, baris: params.baris, ...sort.keep };
  const add = <Button asChild><Link href="/master/jenis-hewan/baru">+ Jenis Baru</Link></Button>;

  return (
    <ListPage>
      <ListHeader icon={Cat} title="Master Jenis Hewan" subtitle="Daftar jenis hewan (kucing, anjing, kelinci, unggas, reptil) untuk form pasien" actions={add} />
      <ListToolbar base="/master/jenis-hewan" params={keep} placeholder="Cari jenis hewan…" total={total} />
      <TableCard
        columns={[{ label: "Nama jenis hewan", sort: "nama" }, { label: "Jumlah ras", sort: "ras", align: "right" }, { label: "Status", sort: "status" }, { label: "Tanggal dibuat", sort: "tanggal" }, { label: "Aksi", align: "right" }]}
        total={total}
        page={page}
        size={size}
        base="/master/jenis-hewan"
        params={keep}
        minWidth={600}
        empty={<EmptyState action={add}>Belum ada jenis hewan.</EmptyState>}
      >
        {rows.map((s) => (
          <tr key={s.id} className="border-b last:border-0">
            <td className="px-4 py-3 font-medium">{s.name}</td>
            <td className="px-4 py-3 text-right tabular-nums">{s._count.breeds}</td>
            <td className="px-4 py-3"><StatusChip tone={s.active ? "success" : "neutral"}>{s.active ? "Aktif" : "Nonaktif"}</StatusChip></td>
            <td className="px-4 py-3 text-muted-foreground">{formatDate(s.createdAt)}</td>
            <td className="px-4 py-3 text-right"><Link href={`/master/jenis-hewan/${s.id}`} className="inline-flex min-h-11 items-center px-2 font-medium text-primary">Ubah</Link></td>
          </tr>
        ))}
      </TableCard>
    </ListPage>
  );
}
