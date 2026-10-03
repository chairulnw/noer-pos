import Link from "next/link";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";
import { listStockSummary } from "@/lib/inventory";
import { requireCapability } from "@/lib/require-role";
import type { StockStatus } from "@/lib/stock";

const STATUS: Record<StockStatus, { label: string; tone: "danger" | "warning" | "info" | "success" }> = {
  HABIS: { label: "Habis", tone: "danger" },
  MENIPIS: { label: "Menipis", tone: "warning" },
  HAMPIR_EXPIRED: { label: "Hampir expired", tone: "info" },
  AMAN: { label: "Aman", tone: "success" },
};

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireCapability("manage_stock");
  const { q } = await searchParams;
  const rows = await listStockSummary(q?.trim() || undefined);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[22px] font-semibold leading-11">Inventaris</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/inventaris/opname">Stok opname</Link>
          </Button>
          <Button asChild>
            <Link href="/inventaris/masuk">+ Stok masuk</Link>
          </Button>
        </div>
      </header>
      <form className="flex gap-2">
        <Input name="q" defaultValue={q} placeholder="Cari nama, SKU, atau barcode" aria-label="Cari produk" />
        <Button type="submit" variant="outline">Cari</Button>
      </form>

      <div className="overflow-x-auto rounded-[10px] border bg-card">
        <table className="w-full min-w-[680px] text-[14.5px]">
          <thead>
            <tr className="border-b text-left text-[13px] text-muted-foreground">
              <th className="px-4 py-2.5 font-normal">Produk</th>
              <th className="px-4 py-2.5 text-right font-normal">Stok</th>
              <th className="px-4 py-2.5 font-normal">Expired terdekat</th>
              <th className="px-4 py-2.5 font-normal">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Belum ada produk.</td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/inventaris/${row.id}`} className="font-medium">{row.name}</Link>
                  <div className="text-[13px] capitalize text-muted-foreground">{row.category}{!row.active && " · nonaktif"}</div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{row.usable.toLocaleString("id-ID")} {row.baseUnit}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.nearestExpiry ? formatDate(row.nearestExpiry) : "—"}</td>
                <td className="px-4 py-3"><StatusChip tone={STATUS[row.status].tone}>{STATUS[row.status].label}</StatusChip></td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/inventaris/masuk?item=${row.id}`} className="inline-flex min-h-11 items-center px-2 font-medium text-primary">Stok masuk</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
