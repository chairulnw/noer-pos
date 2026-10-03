import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ClinicalTags } from "@/components/clinical-flags";
import { StatusChip } from "@/components/status-chip";
import { paymentStatus } from "@/lib/billing";
import { formatDate, formatRupiah } from "@/lib/format";
import { INVOICE_STATUS } from "@/lib/invoice-status";
import { activeInvoiceForVisit, getInvoice, lineView, listSellableItems } from "@/lib/invoices";
import { can } from "@/lib/permissions";
import { requireCapability } from "@/lib/require-role";
import { getSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { replacementAction } from "../actions";
import { InvoiceEditor } from "../invoice-editor";
import { PayPanel } from "../pay-panel";
import { CorrectDeposit } from "../correct-deposit";
import { VoidPanel } from "../void-panel";

const METHOD = { TUNAI: "Tunai", QRIS: "QRIS", TRANSFER: "Transfer", KARTU: "Kartu" };
const KIND = { DP: "DP", PELUNASAN: "Pelunasan", LUNAS: "Lunas" };
const PAYMENT = { BELUM_BAYAR: { label: "Belum bayar", tone: "warning" }, SEBAGIAN: { label: "DP", tone: "warning" }, LUNAS: { label: "Lunas", tone: "success" } } as const;

export default async function InvoicePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const user = await requireCapability("manage_invoice_payment");
  const { id } = await params;
  const { error } = await searchParams;
  if (!z.uuid().safeParse(id).success) notFound();
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const patient = (invoice.visit ?? invoice.admission)?.patient;
  const paid = invoice.payments.filter((p) => !p.voided).reduce((sum, p) => sum + p.amount, 0);
  const status = paymentStatus(paid, invoice.grandTotal);
  const editable = invoice.status === "DRAFT";
  const activePayments = invoice.payments.filter((p) => !p.voided);
  const canPay = invoice.status === "DRAFT" || (invoice.status === "FINAL" && paid < invoice.grandTotal);
  const canCorrectDeposit = can(user.role, "correct_deposit") && invoice.status !== "VOID" && activePayments.length === 1 && activePayments[0].kind === "DP";
  const canVoid = can(user.role, "void_invoice") && invoice.status !== "VOID";
  const canReplace = invoice.status === "VOID" && invoice.visit && !(await activeInvoiceForVisit(invoice.visit.id));
  const [catalog, settings] = editable || canPay ? await Promise.all([editable ? listSellableItems() : [], getSettings()]) : [[], null];

  return (
    <div className="max-w-6xl space-y-5">
      <header className="space-y-1">
        <Link href="/invoice" className="text-[13px] font-medium text-primary">← Invoice</Link>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-[22px] font-semibold tabular-nums">{invoice.invoiceNo}</h1>
          <StatusChip tone={INVOICE_STATUS[invoice.status].tone}>{INVOICE_STATUS[invoice.status].label}</StatusChip>
          {(invoice.status === "FINAL" || paid > 0) && invoice.status !== "VOID" && <StatusChip tone={PAYMENT[status].tone}>{PAYMENT[status].label}</StatusChip>}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>
            {patient ? (
              <>
                <span className="font-medium text-foreground">{patient.name}</span> ({patient.rmNo})
              </>
            ) : (
              <span className="font-medium text-foreground">{invoice.customerName ?? "Retail walk-in"}</span>
            )}
            {invoice.owner && ` · ${invoice.owner.name}`} · {formatDate(invoice.createdAt)}
            {invoice.visit && ` · ${invoice.visit.doctor.name}`}{invoice.admission && ` · ${invoice.admission.type === "HOTEL" ? "Hotel" : "Rawat inap"} ${invoice.admission.room.name}`}
          </span>
          {patient && <ClinicalTags allergyNote={patient.allergyNote} aggressive={patient.aggressive} />}
        </div>
        {invoice.status === "VOID" && invoice.voidReason && <p className="text-sm text-destructive">Void: {invoice.voidReason}</p>}
        {invoice.status !== "VOID" && (
          <div className="flex flex-wrap gap-2 pt-1">
            {invoice.status === "FINAL" && (
              <Button variant="outline" asChild>
                <Link href={`/invoice/${invoice.id}/struk`}>Cetak struk</Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <a href={`/api/invoice/${invoice.id}/pdf`}>Unduh e-invoice (PDF)</a>
            </Button>
          </div>
        )}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {canReplace && (
          <form action={replacementAction.bind(null, invoice.id)} className="pt-1">
            <Button type="submit" variant="outline">Buat invoice baru dari kunjungan</Button>
          </form>
        )}
      </header>

      <div className="flex flex-wrap items-start gap-5">
        <div className="min-w-0 flex-[999] basis-[520px] space-y-4">
          <InvoiceEditor
            invoiceId={invoice.id}
            editable={editable}
            canDiscount={can(user.role, "apply_discount")}
            catalog={catalog.map((c) => ({ ...c }))}
            lines={invoice.items.map((item) => {
              const line = lineView(item);
              return {
                id: item.id,
                name: item.nameSnapshot,
                qty: Number(item.qty),
                unitPrice: item.unitPriceSnapshot,
                discountType: item.discountType,
                discountValue: item.discountValue,
                discountAmount: line.discount,
                total: item.lineTotal,
              };
            })}
          />

          {canVoid && (
            <VoidPanel
              invoiceId={invoice.id}
              invoiceNo={invoice.invoiceNo}
              products={invoice.status === "FINAL" ? invoice.items.filter((i) => i.item.type === "PRODUCT").map((i) => ({ id: i.id, name: i.nameSnapshot, qty: Number(i.qty) })) : []}
            />
          )}

          {invoice.payments.length > 0 && (
            <section className="space-y-3 rounded-[10px] border bg-card p-5">
              <h2 className="text-base font-semibold">Pembayaran</h2>
              {invoice.payments.map((p) => (
                <div key={p.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-2.5 text-[14.5px] last:border-0 last:pb-0">
                  <div>
                    <span className="font-medium">{METHOD[p.method]}</span>
                    {p.kind !== "LUNAS" && <span className="text-muted-foreground"> · {KIND[p.kind]}</span>}
                    {p.voided && <span className="ml-2 align-middle"><StatusChip tone="danger">Void</StatusChip></span>}
                    <span className="text-muted-foreground"> · {formatDate(p.paidAt)} · {p.receivedBy.name}</span>
                    {p.reference && <div className="text-[13px] text-muted-foreground">{p.reference}</div>}
                    {p.cashReceived !== null && <div className="text-[13px] text-muted-foreground">Diterima {formatRupiah(p.cashReceived)} · kembalian {formatRupiah(p.cashReceived - p.amount)}</div>}
                  </div>
                  <span className="font-semibold tabular-nums">{formatRupiah(p.amount)}</span>
                  {canCorrectDeposit && !p.voided && p.kind === "DP" && <div className="basis-full"><CorrectDeposit invoiceId={invoice.id} current={p.amount} /></div>}
                </div>
              ))}
            </section>
          )}
        </div>

        <div className="min-w-0 flex-1 basis-[340px] md:max-w-sm">
          <PayPanel
            invoiceId={invoice.id}
            editable={editable}
            canPay={canPay}
            paid={paid}
            hasPayments={activePayments.length > 0}
            canDiscount={can(user.role, "apply_discount")}
            hasQris={Boolean(settings?.qris)}
            discount={{ type: invoice.discountType, value: invoice.discountValue }}
            totals={{ subtotal: invoice.subtotal, discountTotal: invoice.discountTotal, taxTotal: invoice.taxTotal, grandTotal: invoice.grandTotal, taxRate: invoice.taxRate, taxIncluded: invoice.taxIncluded }}
          />
        </div>
      </div>
    </div>
  );
}
