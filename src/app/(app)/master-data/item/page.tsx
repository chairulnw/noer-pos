import Link from "next/link";
import { Package } from "lucide-react";
import { Chips, ListHeader, ListPage, ListToolbar, TableCard } from "@/components/data-table";
import { EmptyState } from "@/components/page-header";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { formatDate, formatRupiah } from "@/lib/format";
import { ITEM_GROUPS } from "@/lib/item-groups";
import { pageItems } from "@/lib/items";
import { buildHref, parsePaging, type PagingParams } from "@/lib/paging";
import { can } from "@/lib/permissions";
import { requireCapability } from "@/lib/require-role";

const STOCK_TONE = { AMAN: "success", MENIPIS: "warning", HAMPIR_EXPIRED: "warning", HABIS: "danger" } as const;
const STOCK_LABEL = { AMAN: "", MENIPIS: " · menipis", HAMPIR_EXPIRED: " · hampir expired", HABIS: "" } as const;

export default async function ItemsPage({ searchParams }: { searchParams: Promise<{ q?: string; tipe?: string } & PagingParams> }) {
  const user = await requireCapability("manage_service_price");
  const params = await searchParams;
  const group = ITEM_GROUPS.some((g) => g.value === params.tipe) ? (params.tipe ?? "") : "";
  const { page, size, skip, take } = parsePaging(params);
  const { rows, total } = await pageItems(user.role, { q: params.q?.trim() || undefined, group, skip, take });
  const keep = { q: params.q, tipe: group || undefined, baris: params.baris };
  const canStock = can(user.role, "manage_stock");
  const add = <Button asChild><Link href="/master-data/item/baru">+ Produk Baru</Link></Button>;

  return (
    <ListPage>
      <ListHeader
        icon={Package}
        title="Produk & Inventori"
        subtitle="Katalog obat, pakan, aksesoris, layanan medis, dan monitoring stok barang"
        actions={<>{canStock && <Button asChild variant="outline"><Link href="/inventaris/masuk">Stok Masuk</Link></Button>}{add}</>}
      />
      <ListToolbar base="/master-data/item" params={{ q: params.q, tipe: group || undefined, baris: params.baris }} placeholder="Cari nama barang, barcode, SKU…" total={total} />
      <Chips items={ITEM_GROUPS.map((g) => ({ value: g.value, label: g.label }))} active={group} hrefFor={(value) => buildHref("/master-data/item", keep, { tipe: value || undefined, hal: undefined })} />
      <TableCard
        columns={[{ label: "Nama produk / item" }, { label: "Kategori" }, { label: "Harga jual", align: "right" }, { label: "Sisa stok" }, { label: "Batch & kedaluwarsa (FEFO)" }, { label: "Aksi", align: "right" }]}
        total={total}
        page={page}
        size={size}
        base="/master-data/item"
        params={keep}
        minWidth={820}
        empty={<EmptyState action={add}>{params.q || group ? "Tidak ada produk yang cocok." : "Belum ada produk. Mulai daftarkan obat, pakan, atau layanan klinik pertama."}</EmptyState>}
      >
        {rows.map((item) => (
          <tr key={item.id} className="border-b last:border-0">
            <td className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={item.active ? "font-medium" : "font-medium text-muted-foreground"}>{item.name}</span>
                {!item.active && <StatusChip tone="neutral">Nonaktif</StatusChip>}
              </div>
              <div className="text-[13px] text-muted-foreground">{item.sku ? `SKU: ${item.sku}` : item.type === "SERVICE" ? "Layanan" : "Produk"}{item.billingUnit === "PER_DAY" && " · per hari"}</div>
            </td>
            <td className="px-4 py-3 capitalize">{item.category}</td>
            <td className="px-4 py-3 text-right font-medium tabular-nums">{formatRupiah(item.sellPrice)}</td>
            <td className="px-4 py-3">
              {item.stock ? <StatusChip tone={STOCK_TONE[item.stock.status]}>{item.stock.status === "HABIS" ? "Habis" : `${item.stock.usable.toLocaleString("id-ID")} ${item.baseUnit}${STOCK_LABEL[item.stock.status]}`}</StatusChip> : <span className="text-muted-foreground">—</span>}
            </td>
            <td className="px-4 py-3 text-muted-foreground">{item.stock ? (item.stock.nearestExpiry ? `Exp. terdekat ${formatDate(item.stock.nearestExpiry)}` : "Tanpa batch exp") : "—"}</td>
            <td className="px-4 py-3">
              <div className="flex items-center justify-end gap-1">
                {item.stock && canStock && <Link href={`/inventaris/${item.id}`} className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-primary">Kartu stok</Link>}
                <Link href={`/master-data/item/${item.id}`} className="inline-flex min-h-11 items-center px-2 font-medium text-primary">Ubah</Link>
              </div>
            </td>
          </tr>
        ))}
      </TableCard>
    </ListPage>
  );
}
