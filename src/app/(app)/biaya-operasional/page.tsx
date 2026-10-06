import Link from "next/link";
import { Banknote } from "lucide-react";
import { ConfirmButton } from "@/components/confirm-button";
import { ListHeader, ListPage, ListToolbar, TableCard } from "@/components/data-table";
import { EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { parseYmd } from "@/lib/date";
import { pageCosts } from "@/lib/costs";
import { formatDate, formatRupiah } from "@/lib/format";
import { parsePaging, parseSort, type PagingParams, type SortParams } from "@/lib/paging";
import { requireCapability } from "@/lib/require-role";
import { deleteCostAction } from "./actions";

const field = "h-11 rounded-lg border border-input bg-card px-3 text-sm";

export default async function CostsPage({ searchParams }: { searchParams: Promise<{ q?: string; dari?: string; sampai?: string } & PagingParams & SortParams> }) {
  await requireCapability("view_revenue_reports");
  const params = await searchParams;
  const from = parseYmd(params.dari) ?? undefined;
  const to = parseYmd(params.sampai) ?? undefined;
  const { page, size, skip, take } = parsePaging(params);
  const sort = parseSort(params, { tanggal: (d) => ({ costDate: d }), nama: (d) => ({ name: d }), kategori: (d) => ({ category: d }), nominal: (d) => ({ amount: d }) });
  const { rows, total, sum } = await pageCosts({ q: params.q, from, to }, skip, take, sort.orderBy);
  const keep = { q: params.q, dari: from, sampai: to, baris: params.baris, ...sort.keep };
  const add = <Button asChild><Link href="/biaya-operasional/baru">+ Catat Biaya Baru</Link></Button>;

  return (
    <ListPage>
      <ListHeader icon={Banknote} title="Biaya Operasional" subtitle={<>Total pengeluaran tercatat{from || to || params.q ? " (sesuai filter)" : ""}: <b className="text-foreground tabular-nums">{formatRupiah(sum)}</b></>} actions={add} />
      <ListToolbar base="/biaya-operasional" params={{ q: params.q, baris: params.baris }} placeholder="Cari pengeluaran, kategori, atau keterangan…" total={total}>
        <input type="date" name="dari" defaultValue={from ?? ""} aria-label="Dari tanggal" className={field} />
        <input type="date" name="sampai" defaultValue={to ?? ""} aria-label="Sampai tanggal" className={field} />
        <Button type="submit" variant="outline">Terapkan</Button>
      </ListToolbar>
      <TableCard
        columns={[{ label: "Tanggal", sort: "tanggal" }, { label: "Nama pengeluaran", sort: "nama" }, { label: "Kategori biaya", sort: "kategori" }, { label: "Nominal biaya", sort: "nominal", align: "right" }, { label: "Aksi", align: "right" }]}
        total={total}
        page={page}
        size={size}
        base="/biaya-operasional"
        params={keep}
        minWidth={680}
        empty={<EmptyState action={add}>Belum ada catatan biaya. Mulai catat pengeluaran operasional klinik untuk laporan keuangan.</EmptyState>}
      >
        {rows.map((c) => (
          <tr key={c.id} className="border-b last:border-0">
            <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(c.costDate)}</td>
            <td className="px-4 py-3"><div className="font-medium">{c.name}</div>{c.notes && <div className="max-w-80 truncate text-[12.5px] text-muted-foreground">{c.notes}</div>}</td>
            <td className="px-4 py-3">{c.category}</td>
            <td className="px-4 py-3 text-right font-medium tabular-nums">{formatRupiah(c.amount)}</td>
            <td className="px-4 py-3">
              <div className="flex items-center justify-end gap-1">
                <Link href={`/biaya-operasional/${c.id}/ubah`} className="inline-flex min-h-11 items-center px-2 font-medium text-primary">Ubah</Link>
                <form action={deleteCostAction.bind(null, c.id)}>
                  <ConfirmButton variant="ghost" confirmLabel="Ya, hapus" message={`Hapus biaya "${c.name}" (${formatRupiah(c.amount)})?`} className="h-11 px-2 font-medium text-destructive">Hapus</ConfirmButton>
                </form>
              </div>
            </td>
          </tr>
        ))}
      </TableCard>
    </ListPage>
  );
}
