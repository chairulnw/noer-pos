import Link from "next/link";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, formatRupiah, formatTime } from "@/lib/format";
import { listPayments } from "@/lib/invoices";
import { requireCapability } from "@/lib/require-role";

const METHOD = { TUNAI: "Tunai", QRIS: "QRIS", TRANSFER: "Transfer", KARTU: "Kartu" };
const KIND = { DP: "DP", PELUNASAN: "Pelunasan", LUNAS: "Lunas" };

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireCapability("manage_invoice_payment");
  const { q } = await searchParams;
  const payments = await listPayments(q?.trim() || undefined);

  return (
    <div className="space-y-4">
      <h1 className="text-[22px] font-semibold">Riwayat Pembayaran</h1>
      <form className="flex max-w-xl gap-2">
        <Input name="q" defaultValue={q} placeholder="Cari no. invoice, pasien, atau pelanggan" aria-label="Cari pembayaran" />
        <Button type="submit" variant="outline">Cari</Button>
      </form>

      <div className="overflow-x-auto rounded-[10px] border bg-card">
        <table className="w-full min-w-[640px] text-[14.5px]">
          <thead>
            <tr className="border-b text-left text-[13px] text-muted-foreground">
              <th className="px-4 py-2.5 font-normal">Waktu</th>
              <th className="px-4 py-2.5 font-normal">No. invoice</th>
              <th className="px-4 py-2.5 font-normal">Pasien / pelanggan</th>
              <th className="px-4 py-2.5 font-normal">Metode</th>
              <th className="px-4 py-2.5 text-right font-normal">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Belum ada pembayaran.</td>
              </tr>
            )}
            {payments.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="px-4 py-3 text-muted-foreground tabular-nums">{formatDate(p.paidAt)} · {formatTime(p.paidAt)}</td>
                <td className="px-4 py-3"><Link href={`/invoice/${p.invoice.id}`} className="font-medium text-primary tabular-nums">{p.invoice.invoiceNo}</Link></td>
                <td className="px-4 py-3">{p.invoice.visit?.patient.name ?? p.invoice.customerName ?? "Retail"}</td>
                <td className="px-4 py-3">{METHOD[p.method]}{p.kind !== "LUNAS" && <span className="text-muted-foreground"> · {KIND[p.kind]}</span>}{p.voided && <span className="ml-2 align-middle"><StatusChip tone="danger">Void</StatusChip></span>}</td>
                <td className={`px-4 py-3 text-right font-medium tabular-nums ${p.voided ? "text-muted-foreground line-through" : ""}`}>{formatRupiah(p.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
