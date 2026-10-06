import Link from "next/link";
import { Receipt } from "lucide-react";
import { ListHeader, ListPage, ListToolbar, TableCard } from "@/components/data-table";
import { EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { formatDate, formatRupiah, formatTime } from "@/lib/format";
import { listPaidInvoices } from "@/lib/invoices";
import { METHOD_LABEL } from "@/lib/payment-method";
import { parsePaging, parseSort, type PagingParams, type SortParams } from "@/lib/paging";
import { requireCapability } from "@/lib/require-role";

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ q?: string } & PagingParams & SortParams> }) {
  await requireCapability("manage_invoice_payment");
  const params = await searchParams;
  const { page, size, skip, take } = parsePaging(params);
  const sort = parseSort(params, { waktu: (d) => ({ finalizedAt: d }), nomor: (d) => ({ invoiceNo: d }), total: (d) => ({ grandTotal: d }) });
  const { rows, total } = await listPaidInvoices(params.q?.trim() || undefined, skip, take, sort.orderBy);
  const keep = { q: params.q, baris: params.baris, ...sort.keep };

  return (
    <ListPage>
      <ListHeader icon={Receipt} title="Riwayat Transaksi (Lunas)" subtitle="Arsip seluruh pembayaran transaksi kasir yang telah lunas dan nota cetak" actions={<Button asChild><Link href="/kasir">Ke Kasir (POS)</Link></Button>} />
      <ListToolbar base="/pembayaran" params={keep} placeholder="Cari no. invoice, pasien, atau pelanggan…" total={total} />
      <TableCard
        columns={[{ label: "Waktu lunas", sort: "waktu" }, { label: "No. transaksi / nota", sort: "nomor" }, { label: "Klien / pelanggan" }, { label: "Metode bayar" }, { label: "Total pembayaran", sort: "total", align: "right" }, { label: "Aksi", align: "right" }]}
        total={total}
        page={page}
        size={size}
        base="/pembayaran"
        params={keep}
        minWidth={760}
        empty={<EmptyState>Belum ada transaksi lunas. Semua transaksi kasir yang telah dibayar akan muncul di sini.</EmptyState>}
      >
        {rows.map((inv) => {
          const at = inv.finalizedAt ?? inv.createdAt;
          const methods = [...new Set(inv.payments.map((p) => METHOD_LABEL[p.method]))].join(", ");
          return (
            <tr key={inv.id} className="border-b last:border-0">
              <td className="whitespace-nowrap px-4 py-3 tabular-nums"><div className="font-medium">{formatDate(at)}</div><div className="text-[12.5px] text-muted-foreground">{formatTime(at)}</div></td>
              <td className="px-4 py-3"><Link href={`/invoice/${inv.id}`} className="font-medium text-primary tabular-nums">{inv.invoiceNo}</Link></td>
              <td className="px-4 py-3">{(inv.visit ?? inv.admission)?.patient.name ?? inv.owner?.name ?? inv.customerName ?? "Umum / Walk-in"}</td>
              <td className="px-4 py-3">{methods || "—"}</td>
              <td className="px-4 py-3 text-right font-medium tabular-nums">{formatRupiah(inv.grandTotal)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right"><Link href={`/invoice/${inv.id}/struk`} className="inline-flex min-h-11 items-center px-2 font-medium text-primary">Struk</Link><a href={`/api/invoice/${inv.id}/pdf`} className="inline-flex min-h-11 items-center px-2 font-medium text-primary">Invoice PDF</a></td>
            </tr>
          );
        })}
      </TableCard>
    </ListPage>
  );
}
