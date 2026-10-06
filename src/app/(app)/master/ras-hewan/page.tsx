import Link from "next/link";
import { Dog } from "lucide-react";
import { z } from "zod";
import { Chips, ListHeader, ListPage, ListToolbar, TableCard } from "@/components/data-table";
import { EmptyState } from "@/components/page-header";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { listAllSpecies, pageBreeds } from "@/lib/animals";
import { buildHref, parsePaging, parseSort, type PagingParams, type SortParams } from "@/lib/paging";
import { requireCapability } from "@/lib/require-role";

export default async function BreedsPage({ searchParams }: { searchParams: Promise<{ q?: string; jenis?: string } & PagingParams & SortParams> }) {
  await requireCapability("manage_users_settings");
  const params = await searchParams;
  const species = await listAllSpecies();
  const speciesId = params.jenis && z.guid().safeParse(params.jenis).success && species.some((s) => s.id === params.jenis) ? params.jenis : undefined;
  const { page, size, skip, take } = parsePaging(params);
  const sort = parseSort(params, { nama: (d) => ({ name: d }), jenis: (d) => ({ species: { name: d } }), status: (d) => ({ active: d }) });
  const { rows, total } = await pageBreeds({ q: params.q, speciesId }, skip, take, sort.orderBy);
  const keep = { q: params.q, jenis: speciesId, baris: params.baris, ...sort.keep };
  const add = <Button asChild><Link href="/master/ras-hewan/baru">+ Ras Baru</Link></Button>;

  return (
    <ListPage>
      <ListHeader icon={Dog} title="Master Ras Hewan" subtitle="Daftar varietas dan ras hewan, terhubung ke jenis hewan" actions={add} />
      <ListToolbar base="/master/ras-hewan" params={keep} placeholder="Cari ras hewan…" total={total} />
      <Chips items={[{ value: "", label: "Semua jenis" }, ...species.map((s) => ({ value: s.id, label: s.name }))]} active={speciesId ?? ""} hrefFor={(v) => buildHref("/master/ras-hewan", keep, { jenis: v || undefined, hal: undefined })} />
      <TableCard
        columns={[{ label: "Nama ras (breed)", sort: "nama" }, { label: "Jenis hewan terkait", sort: "jenis" }, { label: "Status", sort: "status" }, { label: "Aksi", align: "right" }]}
        total={total}
        page={page}
        size={size}
        base="/master/ras-hewan"
        params={keep}
        minWidth={560}
        empty={<EmptyState action={add}>Belum ada ras hewan.</EmptyState>}
      >
        {rows.map((b) => (
          <tr key={b.id} className="border-b last:border-0">
            <td className="px-4 py-3 font-medium">{b.name}</td>
            <td className="px-4 py-3">{b.species.name}</td>
            <td className="px-4 py-3"><StatusChip tone={b.active ? "success" : "neutral"}>{b.active ? "Aktif" : "Nonaktif"}</StatusChip></td>
            <td className="px-4 py-3 text-right"><Link href={`/master/ras-hewan/${b.id}`} className="inline-flex min-h-11 items-center px-2 font-medium text-primary">Ubah</Link></td>
          </tr>
        ))}
      </TableCard>
    </ListPage>
  );
}
