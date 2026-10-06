import Link from "next/link";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/status-chip";
import { paymentStatus } from "@/lib/billing";
import { formatRupiah } from "@/lib/format";
import { getUsableStock } from "@/lib/inventory";
import { getInvoice, lineView, listOpenDrafts, listSellableItems } from "@/lib/invoices";
import { can } from "@/lib/permissions";
import { requireCapability } from "@/lib/require-role";
import { getSettings } from "@/lib/settings";
import { PayPanel } from "../invoice/pay-panel";
import { PosCart } from "./pos-cart";
import { PosCatalog } from "./pos-catalog";

export default async function PosPage({ searchParams }: { searchParams: Promise<{ inv?: string }> }) {
  const user = await requireCapability("manage_invoice_payment");
  const { inv } = await searchParams;
  const found = inv && z.guid().safeParse(inv).success ? await getInvoice(inv) : null;
  const voided = found?.status === "VOID";
  const invoice = voided ? null : found;

  const [catalog, stock, drafts, settings] = await Promise.all([listSellableItems(), getUsableStock(), listOpenDrafts(), getSettings()]);
  const items = catalog.map((c) => ({ ...c, stock: c.type === "PRODUCT" ? (stock[c.id] ?? 0) : null }));

  const paid = invoice ? invoice.payments.filter((p) => !p.voided).reduce((sum, p) => sum + p.amount, 0) : 0;
  const editable = !invoice || invoice.status === "DRAFT";
  const done = invoice?.status === "FINAL" && paymentStatus(paid, invoice.grandTotal) === "LUNAS";
  const canPay = invoice ? invoice.status === "DRAFT" || (invoice.status === "FINAL" && paid < invoice.grandTotal) : false;
  const patient = invoice ? (invoice.visit ?? invoice.admission)?.patient : undefined;
  const customerName = invoice ? (patient ? `${patient.name}${invoice.owner ? ` · ${invoice.owner.name}` : ""}` : (invoice.owner?.name ?? invoice.customerName)) : null;
  const openDrafts = drafts.filter((d) => d._count.items > 0 && d.id !== invoice?.id);
  const lastPayment = invoice?.payments.filter((p) => !p.voided).at(-1);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold leading-11">Kasir (POS)</h1>
          <p className="text-sm text-muted-foreground">
            {invoice ? <span className="tabular-nums">{invoice.invoiceNo}</span> : "Pilih produk atau layanan untuk memulai transaksi."}
            {invoice && invoice.status === "FINAL" && !done && " · Menunggu pelunasan"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {openDrafts.length > 0 && (
            <details className="relative">
              <summary className="flex h-11 cursor-pointer list-none items-center rounded-lg border bg-card px-4 text-sm font-medium">Tagihan menunggu ({openDrafts.length})</summary>
              <div className="absolute right-0 z-20 mt-2 max-h-96 w-80 overflow-y-auto rounded-lg border bg-card shadow-lg">
                {openDrafts.map((d) => (
                  <Link key={d.id} href={`/kasir?inv=${d.id}`} className="flex flex-col gap-0.5 border-b px-4 py-3 last:border-0 hover:bg-muted">
                    <span className="flex justify-between gap-2 text-[14.5px] font-medium">
                      <span className="tabular-nums">{d.invoiceNo}</span>
                      <span className="tabular-nums">{formatRupiah(d.grandTotal)}</span>
                    </span>
                    <span className="text-[13px] text-muted-foreground">{d.visit?.patient.name ?? d.admission?.patient.name ?? d.customerName ?? "Tanpa nama"} · {d._count.items} item</span>
                  </Link>
                ))}
              </div>
            </details>
          )}
          {invoice && (
            <Button asChild variant={done ? "default" : "outline"}>
              <Link href="/kasir">Transaksi baru</Link>
            </Button>
          )}
        </div>
      </header>

      {voided && <p role="alert" className="rounded-lg border border-[#E9CFA6] p-3 text-sm text-warning">Tagihan {found?.invoiceNo} sudah di-void. Mulai transaksi baru di bawah.</p>}

      {done && invoice ? (
        <section className="mx-auto max-w-xl space-y-5 rounded-[10px] border bg-card p-8 text-center">
          <StatusChip tone="success">Pembayaran berhasil</StatusChip>
          <div>
            <div className="text-sm text-muted-foreground">Total dibayar</div>
            <div className="text-4xl font-semibold tabular-nums">{formatRupiah(invoice.grandTotal)}</div>
            {lastPayment?.cashReceived != null && lastPayment.cashReceived > lastPayment.amount && (
              <div className="mt-2 text-lg">Kembalian <b className="tabular-nums">{formatRupiah(lastPayment.cashReceived - lastPayment.amount)}</b></div>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild><Link href={`/invoice/${invoice.id}/struk`}>Cetak struk</Link></Button>
            <Button asChild variant="outline"><a href={`/api/invoice/${invoice.id}/pdf`}>Unduh e-invoice</a></Button>
            <Button asChild variant="outline"><Link href="/kasir">Transaksi baru</Link></Button>
          </div>
        </section>
      ) : (
        <div className="flex flex-wrap items-start gap-5">
          <div className="min-w-0 flex-[999] basis-[460px]">
            <PosCatalog items={items} invoiceId={invoice?.id ?? null} editable={editable} />
          </div>
          <div className="min-w-0 flex-1 basis-[360px] space-y-4 lg:sticky lg:top-4 lg:max-w-md">
            <PosCart
              invoiceId={invoice?.id ?? null}
              editable={editable}
              canDiscount={can(user.role, "apply_discount")}
              customerName={customerName}
              customerLocked={Boolean(invoice?.visitId || invoice?.admissionId)}
              lines={(invoice?.items ?? []).map((item) => ({
                id: item.id,
                name: item.nameSnapshot,
                qty: Number(item.qty),
                unitPrice: item.unitPriceSnapshot,
                discountType: item.discountType,
                discountValue: item.discountValue,
                discountAmount: lineView(item).discount,
                total: item.lineTotal,
              }))}
            />
            {invoice && invoice.items.length > 0 && (
              <PayPanel
                invoiceId={invoice.id}
                editable={editable}
                canPay={canPay}
                paid={paid}
                hasPayments={invoice.payments.some((p) => !p.voided)}
                canDiscount={can(user.role, "apply_discount")}
                hasQris={Boolean(settings.qris)}
                wallet={invoice.owner ? { owner: invoice.owner.name, balance: invoice.owner.walletBalance } : null}
                discount={{ type: invoice.discountType, value: invoice.discountValue }}
                totals={{ subtotal: invoice.subtotal, discountTotal: invoice.discountTotal, taxTotal: invoice.taxTotal, grandTotal: invoice.grandTotal, taxRate: invoice.taxRate, taxIncluded: invoice.taxIncluded }}
              />
            )}
            {invoice && (
              <Link href={`/invoice/${invoice.id}`} className="block text-center text-sm font-medium text-primary">Rincian tagihan, pembatalan, dan koreksi DP</Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
