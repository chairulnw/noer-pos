import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, formatRupiah } from "@/lib/format";
import { listRetailDrafts } from "@/lib/invoices";
import { requireCapability } from "@/lib/require-role";
import { createRetailAction } from "../invoice/actions";

export default async function RetailPage() {
  await requireCapability("manage_invoice_payment");
  const drafts = await listRetailDrafts();

  return (
    <div className="max-w-3xl space-y-5">
      <h1 className="text-[22px] font-semibold">Retail Walk-in</h1>
      <form action={createRetailAction} className="flex flex-wrap items-end gap-3 rounded-[10px] border bg-card p-5">
        <div className="min-w-60 flex-1 space-y-1.5">
          <label htmlFor="customerName" className="text-sm font-medium">Nama pelanggan (opsional)</label>
          <Input id="customerName" name="customerName" maxLength={100} />
        </div>
        <Button type="submit">Mulai invoice retail</Button>
      </form>

      <section className="overflow-hidden rounded-[10px] border bg-card">
        <h2 className="border-b px-5 py-3 text-base font-semibold">Draft retail belum dibayar</h2>
        {drafts.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Tidak ada draft.</p>}
        {drafts.map((d) => (
          <Link key={d.id} href={`/invoice/${d.id}`} className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3.5 last:border-0">
            <div>
              <div className="font-medium tabular-nums">{d.invoiceNo}</div>
              <div className="text-[13px] text-muted-foreground">{d.customerName ?? "Tanpa nama"} · {formatDate(d.createdAt)}</div>
            </div>
            <span className="tabular-nums">{formatRupiah(d.grandTotal)}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
