import Link from "next/link";
import { Receipt } from "lucide-react";
import { ListHeader, ListPage, ListToolbar, TableCard } from "@/components/data-table";
import { EmptyState } from "@/components/page-header";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { formatDate, formatRupiah, formatTime } from "@/lib/format";
import { listPayments } from "@/lib/invoices";
import { METHOD_LABEL } from "@/lib/payment-method";
import { parsePaging, type PagingParams } from "@/lib/paging";
import { requireCapability } from "@/lib/require-role";

const KIND = { DP: "DP", PELUNASAN: "Pelunasan", LUNAS: "Lunas" };

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ q?: string } & PagingParams> }) {
  await requireCapability("manage_invoice_payment");
  const params = await searchParams;
  const { page, size, skip, take } = parsePaging(params);
  const { rows, total } = await listPayments(params.q?.trim() || undefined, skip, take);
  const keep = { q: params.q, baris: params.baris };

  return (
    <ListPage>
      <ListHeader icon={Receipt} title="Riwayat Transaksi (Lunas)" subtitle="Arsip seluruh pembayaran transaksi kasir yang telah lunas dan nota cetak" actions={<Button asChild><Link href="/kasir">Ke Kasir (POS)</Link></Button>} />
      <ListToolbar base="/pembayaran" params={keep} placeholder="Cari no. invoice, pasien, atau pelanggan…" total={total} />
      <TableCard
        columns={[{ label: "Waktu transaksi" }, { label: "No. transaksi / nota" }, { label: "Klien / pelanggan" }, { label: "Metode bayar" }, { label: "Total pembayaran", align: "right" }, { label: "Aksi", align: "right" }]}
        total={total}
        page={page}
        size={size}
        base="/pembayaran"
        params={keep}
        minWidth={760}
        empty={<EmptyState>Belum ada transaksi lunas. Semua transaksi kasir yang telah dibayar akan muncul di sini.</EmptyState>}
      >
        {rows.map((p) => (
          <tr key={p.id} className="border-b last:border-0">
            <td className="whitespace-nowrap px-4 py-3 tabular-nums"><div className="font-medium">{formatDate(p.paidAt)}</div><div className="text-[13px] text-muted-foreground">{formatTime(p.paidAt)}</div></td>
            <td className="px-4 py-3"><Link href={`/invoice/${p.invoice.id}`} className="font-medium text-primary tabular-nums">{p.invoice.invoiceNo}</Link></td>
            <td className="px-4 py-3">{(p.invoice.visit ?? p.invoice.admission)?.patient.name ?? p.invoice.owner?.name ?? p.invoice.customerName ?? "Umum / Walk-in"}</td>
            <td className="px-4 py-3">{METHOD_LABEL[p.method]}{p.kind !== "LUNAS" && <span className="text-muted-foreground"> · {KIND[p.kind]}</span>}{p.voided && <span className="ml-2 align-middle"><StatusChip tone="danger">Dibatalkan</StatusChip></span>}</td>
            <td className={`px-4 py-3 text-right font-medium tabular-nums ${p.voided ? "text-muted-foreground line-through" : ""}`}>{formatRupiah(p.amount)}</td>
            <td className="px-4 py-3 text-right">{!p.voided && <Link href={`/invoice/${p.invoice.id}/struk`} className="inline-flex min-h-11 items-center px-2 font-medium text-primary">Struk</Link>}</td>
          </tr>
        ))}
      </TableCard>
    </ListPage>
  );
}
