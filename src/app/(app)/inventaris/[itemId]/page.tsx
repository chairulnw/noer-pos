import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { todayJakarta } from "@/lib/date";
import { formatDate, formatRupiah } from "@/lib/format";
import { getStockCard } from "@/lib/inventory";
import { requireCapability } from "@/lib/require-role";
import { isExpired } from "@/lib/stock";

const TYPE = { IN: "Masuk", OUT: "Keluar", VOID_RETURN: "Kembali (void)", ADJUST: "Penyesuaian" };

export default async function StockCardPage({ params }: { params: Promise<{ itemId: string }> }) {
  await requireCapability("manage_stock");
  const { itemId } = await params;
  if (!z.uuid().safeParse(itemId).success) notFound();
  const card = await getStockCard(itemId);
  if (!card) notFound();
  const today = todayJakarta();
  const { item } = card;

  return (
    <div className="max-w-5xl space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <Link href="/inventaris" className="text-[13px] font-medium text-primary">← Inventaris</Link>
          <h1 className="text-[22px] font-semibold">{item.name}</h1>
          <p className="text-sm text-muted-foreground">Kartu stok · satuan dasar {item.baseUnit}</p>
        </div>
        <Button asChild>
          <Link href={`/inventaris/masuk?item=${item.id}`}>+ Stok masuk</Link>
        </Button>
      </header>

      <section className="overflow-hidden rounded-[10px] border bg-card">
        <h2 className="border-b px-5 py-3 text-base font-semibold">Batch</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-[14.5px]">
            <thead>
              <tr className="border-b text-left text-[13px] text-muted-foreground">
                <th className="px-5 py-2.5 font-normal">No. batch</th>
                <th className="px-5 py-2.5 font-normal">Expired</th>
                <th className="px-5 py-2.5 text-right font-normal">Sisa</th>
                <th className="px-5 py-2.5 text-right font-normal">HPP / {item.baseUnit}</th>
              </tr>
            </thead>
            <tbody>
              {card.batches.length === 0 && <tr><td colSpan={4} className="px-5 py-6 text-center text-muted-foreground">Belum ada batch.</td></tr>}
              {card.batches.map((b) => (
                <tr key={b.id} className="border-b last:border-0">
                  <td className="px-5 py-3 font-medium">{b.batchNo}</td>
                  <td className="px-5 py-3">
                    {b.expiryDate ? (
                      <span className="inline-flex items-center gap-2">
                        {formatDate(b.expiryDate)}
                        {isExpired(b.expiryDate, today) && <StatusChip tone="danger">Expired</StatusChip>}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">{Number(b.qtyOnHand).toLocaleString("id-ID")}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{formatRupiah(b.costPerBaseUnit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-[10px] border bg-card">
        <h2 className="border-b px-5 py-3 text-base font-semibold">Riwayat pergerakan</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-[14.5px]">
            <thead>
              <tr className="border-b text-left text-[13px] text-muted-foreground">
                <th className="px-5 py-2.5 font-normal">Tanggal</th>
                <th className="px-5 py-2.5 font-normal">Jenis</th>
                <th className="px-5 py-2.5 font-normal">Batch</th>
                <th className="px-5 py-2.5 text-right font-normal">Jumlah</th>
                <th className="px-5 py-2.5 font-normal">Keterangan</th>
                <th className="px-5 py-2.5 font-normal">Oleh</th>
              </tr>
            </thead>
            <tbody>
              {card.movements.length === 0 && <tr><td colSpan={6} className="px-5 py-6 text-center text-muted-foreground">Belum ada pergerakan.</td></tr>}
              {card.movements.map((m) => {
                const qty = Number(m.qty);
                return (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="px-5 py-3 text-muted-foreground">{formatDate(m.createdAt)}</td>
                    <td className="px-5 py-3">{TYPE[m.type]}</td>
                    <td className="px-5 py-3">{m.batch.batchNo}</td>
                    <td className={`px-5 py-3 text-right font-medium tabular-nums ${qty < 0 ? "text-destructive" : "text-success"}`}>{qty > 0 ? "+" : ""}{qty.toLocaleString("id-ID")}</td>
                    <td className="px-5 py-3 text-muted-foreground">{m.note ?? "—"}</td>
                    <td className="px-5 py-3">{m.user.name}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
