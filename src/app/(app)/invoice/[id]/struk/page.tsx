import { notFound } from "next/navigation";
import { z } from "zod";
import { getInvoice, lineView } from "@/lib/invoices";
import { requireCapability } from "@/lib/require-role";
import { getSettings } from "@/lib/settings";
import { Receipt } from "./receipt";

const METHOD = { TUNAI: "Tunai", QRIS: "QRIS", TRANSFER: "Transfer", KARTU: "Kartu" };
const PREFIX = { DP: "DP", PELUNASAN: "Pelunasan", LUNAS: "Bayar" };

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCapability("manage_invoice_payment");
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();
  const [invoice, settings] = await Promise.all([getInvoice(id), getSettings()]);
  if (!invoice || invoice.status !== "FINAL") notFound();

  const payments = invoice.payments.filter((p) => !p.voided);
  const paid = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <Receipt
      data={{
        invoiceId: invoice.id,
        paperWidth: settings.paperWidth,
        clinic: { name: settings.clinicName, address: settings.address, phone: settings.phone, npwp: settings.npwp, footer: settings.receiptFooter },
        invoiceNo: invoice.invoiceNo,
        at: (invoice.finalizedAt ?? invoice.createdAt).toISOString(),
        cashier: payments.at(-1)?.receivedBy.name ?? invoice.createdBy.name,
        customer: (invoice.visit ?? invoice.admission)?.patient.name ?? invoice.customerName ?? "Umum",
        copy: invoice.receiptPrints > 0,
        lines: invoice.items.map((item) => ({ name: item.nameSnapshot, qty: Number(item.qty), unitPrice: item.unitPriceSnapshot, discount: lineView(item).discount, total: item.lineTotal })),
        subtotal: invoice.subtotal,
        discountTotal: invoice.discountTotal,
        taxTotal: invoice.taxTotal,
        taxLabel: invoice.taxRate > 0 ? `PPN ${invoice.taxRate}%${invoice.taxIncluded ? " (incl)" : ""}` : null,
        grandTotal: invoice.grandTotal,
        payments: payments.map((p) => ({ label: `${PREFIX[p.kind]} ${METHOD[p.method]}`, amount: p.amount, cashReceived: p.cashReceived })),
        remaining: Math.max(0, invoice.grandTotal - paid),
      }}
    />
  );
}
