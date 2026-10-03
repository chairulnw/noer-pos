import Link from "next/link";
import { EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { selectClass } from "@/components/form-fields";
import { StatusChip } from "@/components/status-chip";
import { formatRupiah } from "@/lib/format";
import { listItems } from "@/lib/items";
import { can } from "@/lib/permissions";
import { requireCapability } from "@/lib/require-role";

export default async function ItemsPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const user = await requireCapability("manage_service_price");
  const { q, type } = await searchParams;
  const items = await listItems(user.role, {
    q: q?.trim() || undefined,
    type: type === "SERVICE" || type === "PRODUCT" ? type : undefined,
  });
  const showCost = can(user.role, "manage_product_cost");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <form className="flex flex-1 basis-80 gap-2">
          <Input name="q" defaultValue={q} placeholder="Cari nama, SKU, atau barcode" aria-label="Cari item" />
          <select name="type" defaultValue={type ?? ""} aria-label="Jenis" className={`${selectClass} w-40`}>
            <option value="">Semua</option>
            <option value="SERVICE">Layanan</option>
            <option value="PRODUCT">Produk</option>
          </select>
          <Button type="submit" variant="outline">
            Cari
          </Button>
        </form>
        <Button asChild>
          <Link href="/master-data/item/baru">+ Item baru</Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-[10px] border bg-card">
        <table className="w-full min-w-[600px] text-[14.5px]">
          <thead>
            <tr className="border-b text-left text-[13px] text-muted-foreground">
              <th className="px-4 py-2.5 font-normal">Nama</th>
              <th className="px-4 py-2.5 font-normal">Kategori</th>
              <th className="px-4 py-2.5 font-normal">Satuan</th>
              <th className="px-4 py-2.5 text-right font-normal">Harga jual</th>
              {showCost && <th className="px-4 py-2.5 text-right font-normal">Harga beli</th>}
              <th className="px-4 py-2.5 font-normal">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={showCost ? 7 : 6}>
                  <EmptyState action={<Button asChild><Link href="/master-data/item/baru">+ Item baru</Link></Button>}>Belum ada item.</EmptyState>
                </td>
              </tr>
            )}
            {items.map((item) => (
              <tr key={item.id} className="min-h-14 border-b last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-[13px] text-muted-foreground">
                    {item.type === "SERVICE" ? "Layanan" : "Produk"}
                    {item.sku && ` · ${item.sku}`}
                  </div>
                </td>
                <td className="px-4 py-3 capitalize">{item.category}</td>
                <td className="px-4 py-3">
                  {item.baseUnit}
                  {item.billingUnit === "PER_DAY" && " · per hari"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{formatRupiah(item.sellPrice)}</td>
                {showCost && (
                  <td className="px-4 py-3 text-right tabular-nums">
                    {item.type === "PRODUCT" && item.buyPrice !== undefined ? formatRupiah(item.buyPrice) : "—"}
                  </td>
                )}
                <td className="px-4 py-3">
                  <StatusChip tone={item.active ? "success" : "neutral"}>{item.active ? "Aktif" : "Nonaktif"}</StatusChip>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/master-data/item/${item.id}`} className="inline-flex min-h-11 items-center px-2 font-medium text-primary">
                    Ubah
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
