import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ClinicalTags } from "@/components/clinical-flags";
import { StatusChip } from "@/components/status-chip";
import { formatDate, formatRupiah } from "@/lib/format";
import { INVOICE_STATUS } from "@/lib/invoice-status";
import { getInvoice, lineView } from "@/lib/invoices";
import { requireCapability } from "@/lib/require-role";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireCapability("manage_invoice_payment");
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const invoice = await getInvoice(id);
  if (!invoice) notFound();
  const patient = invoice.visit?.patient;

  return (
    <div className="max-w-5xl space-y-5">
      <header className="space-y-1">
        <Link href="/invoice" className="text-[13px] font-medium text-primary">← Invoice</Link>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-[22px] font-semibold tabular-nums">{invoice.invoiceNo}</h1>
          <StatusChip tone={INVOICE_STATUS[invoice.status].tone}>{INVOICE_STATUS[invoice.status].label}</StatusChip>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>
            {patient ? (
              <>
                <span className="font-medium text-foreground">{patient.name}</span> ({patient.rmNo})
              </>
            ) : (
              <span className="font-medium text-foreground">{invoice.customerName ?? "Retail"}</span>
            )}
            {invoice.owner && ` · ${invoice.owner.name}`} · {formatDate(invoice.createdAt)}
            {invoice.visit && ` · ${invoice.visit.doctor.name}`}
          </span>
          {patient && <ClinicalTags allergyNote={patient.allergyNote} aggressive={patient.aggressive} />}
        </div>
      </header>

      <section className="space-y-3 rounded-[10px] border bg-card p-5">
        <div className="overflow-x-auto">
          <div className="min-w-[560px] text-[14.5px]">
            <div className="grid grid-cols-[minmax(0,2.4fr)_70px_minmax(0,1fr)_80px_minmax(0,1.1fr)] gap-3 border-b px-1 py-2 text-[13px] text-muted-foreground">
              <span>Item</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Harga</span>
              <span className="text-right">Diskon</span>
              <span className="text-right">Subtotal</span>
            </div>
            {invoice.items.length === 0 && <p className="px-1 py-6 text-center text-sm text-muted-foreground">Belum ada item.</p>}
            {invoice.items.map((item) => {
              const line = lineView(item);
              return (
                <div key={item.id} className="grid min-h-14 grid-cols-[minmax(0,2.4fr)_70px_minmax(0,1fr)_80px_minmax(0,1.1fr)] items-center gap-3 border-b px-1 last:border-0">
                  <span className="font-medium">{item.nameSnapshot}</span>
                  <span className="text-right tabular-nums">{Number(item.qty)}</span>
                  <span className="text-right tabular-nums text-muted-foreground">{formatRupiah(item.unitPriceSnapshot)}</span>
                  <span className="text-right tabular-nums text-muted-foreground">
                    {item.discountType === "PERCENT" ? `${item.discountValue}%` : line.discount > 0 ? formatRupiah(line.discount) : "—"}
                  </span>
                  <span className="text-right font-medium tabular-nums">{formatRupiah(item.lineTotal)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="ml-auto max-w-sm space-y-2 rounded-[10px] border bg-card p-5 text-[14.5px]">
        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{formatRupiah(invoice.subtotal)}</span></div>
        {invoice.discountTotal > 0 && (
          <div className="flex justify-between"><span className="text-muted-foreground">Diskon invoice</span><span className="tabular-nums">− {formatRupiah(invoice.discountTotal)}</span></div>
        )}
        {invoice.taxRate > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">PPN {invoice.taxRate}%{invoice.taxIncluded && " (termasuk)"}</span>
            <span className="tabular-nums">{formatRupiah(invoice.taxTotal)}</span>
          </div>
        )}
        <div className="flex items-baseline justify-between border-t pt-3">
          <span className="font-medium">Total</span>
          <span className="text-[28px] font-semibold tabular-nums">{formatRupiah(invoice.grandTotal)}</span>
        </div>
      </section>
    </div>
  );
}
