import Link from "next/link";
import { History } from "lucide-react";
import { ListHeader, ListPage, ListToolbar, TableCard } from "@/components/data-table";
import { EmptyState } from "@/components/page-header";
import { StatusChip } from "@/components/status-chip";
import { formatDate, formatTime } from "@/lib/format";
import { pageStockMovements } from "@/lib/inventory";
import { parsePaging, type PagingParams } from "@/lib/paging";
import { requireCapability } from "@/lib/require-role";

const TYPE = { IN: "Stok masuk", OUT: "Penjualan", VOID_RETURN: "Retur (void invoice)", ADJUST: "Penyesuaian opname" } as const;

export default async function StockHistoryPage({ searchParams }: { searchParams: Promise<{ q?: string } & PagingParams> }) {
  await requireCapability("manage_stock");
  const params = await searchParams;
  const { page, size, skip, take } = parsePaging(params);
  const { rows, total } = await pageStockMovements(params.q, skip, take);
  const keep = { q: params.q, baris: params.baris };

  return (
    <ListPage>
      <ListHeader icon={History} title="Mutasi & Riwayat Stok" subtitle="Audit log stok masuk, stok keluar kasir, retur, dan penyesuaian opname inventori" />
      <ListToolbar base="/riwayat-stok" params={keep} placeholder="Cari produk, batch, atau catatan…" total={total} />
      <TableCard
        columns={[{ label: "Waktu transaksi" }, { label: "Nama produk / item" }, { label: "Perubahan stok", align: "center" }, { label: "Jenis mutasi" }, { label: "Keterangan" }, { label: "Oleh" }]}
        total={total}
        page={page}
        size={size}
        base="/riwayat-stok"
        params={keep}
        minWidth={820}
        empty={<EmptyState>Belum ada mutasi stok.</EmptyState>}
      >
        {rows.map((m) => {
          const qty = Number(m.qty);
          return (
            <tr key={m.id} className="border-b last:border-0">
              <td className="whitespace-nowrap px-4 py-3"><div className="font-medium">{formatDate(m.createdAt)}</div><div className="text-[13px] text-muted-foreground">{formatTime(m.createdAt)}</div></td>
              <td className="px-4 py-3"><Link href={`/inventaris/${m.batch.item.id}`} className="font-medium">{m.batch.item.name}</Link><div className="text-[13px] text-muted-foreground">Batch {m.batch.batchNo}</div></td>
              <td className="px-4 py-3 text-center"><StatusChip tone={qty < 0 ? "danger" : "success"}>{qty > 0 ? "+" : ""}{qty.toLocaleString("id-ID")} {m.batch.item.baseUnit}</StatusChip></td>
              <td className="px-4 py-3 font-medium">{TYPE[m.type]}</td>
              <td className="max-w-72 truncate px-4 py-3 text-muted-foreground">{m.note ?? "—"}</td>
              <td className="px-4 py-3">{m.user.name}</td>
            </tr>
          );
        })}
      </TableCard>
    </ListPage>
  );
}
