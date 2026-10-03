import { readFile } from "node:fs/promises";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { lineView, getInvoice } from "@/lib/invoices";
import { renderInvoicePdf } from "@/lib/invoice-pdf";
import { paymentStatus } from "@/lib/billing";
import { can } from "@/lib/permissions";
import { formatWhatsapp } from "@/lib/patient-schema";
import { getSettings } from "@/lib/settings";

const METHOD = { TUNAI: "Tunai", QRIS: "QRIS", TRANSFER: "Transfer", KARTU: "Kartu" };
const PREFIX = { DP: "DP", PELUNASAN: "Pelunasan", LUNAS: "Bayar" };

async function logoSource(stored: string) {
  if (/^data:image\/(png|jpeg);base64,/.test(stored)) return stored;
  if (stored) return null;
  return readFile(`${/* turbopackIgnore: true */ process.cwd()}/public/logo-noer.png`).catch(() => null);
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response(null, { status: 401 });
  if (!can(session.user.role, "manage_invoice_payment")) return new Response(null, { status: 403 });

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return new Response(null, { status: 404 });
  const [invoice, settings] = await Promise.all([getInvoice(id), getSettings()]);
  if (!invoice || invoice.status === "VOID") return new Response(null, { status: 404 });

  const payments = invoice.payments.filter((p) => !p.voided);
  const paid = payments.reduce((sum, p) => sum + p.amount, 0);
  const state = paymentStatus(paid, invoice.grandTotal);
  const patient = (invoice.visit ?? invoice.admission)?.patient;
  const logo = await logoSource(settings.logo);

  const pdf = await renderInvoicePdf({
    clinic: { name: settings.clinicName, address: settings.address, phone: settings.phone, npwp: settings.npwp, footer: settings.receiptFooter, logo: logo as string | null },
    invoiceNo: invoice.invoiceNo,
    date: invoice.finalizedAt ?? invoice.createdAt,
    statusLabel: `${invoice.status === "DRAFT" ? "DRAFT · " : ""}${state === "LUNAS" ? "LUNAS" : state === "SEBAGIAN" ? "DP DITERIMA" : "BELUM BAYAR"}`,
    billedTo: { name: invoice.owner?.name ?? invoice.customerName ?? "Umum", whatsapp: invoice.owner ? formatWhatsapp(invoice.owner.whatsapp) : null },
    patient: patient ? { name: patient.name, species: patient.species, rmNo: patient.rmNo } : null,
    lines: invoice.items.map((item) => {
      const view = lineView(item);
      return {
        name: item.nameSnapshot,
        qty: Number(item.qty),
        unitPrice: item.unitPriceSnapshot,
        discountLabel: item.discountType === "PERCENT" ? `${item.discountValue}%` : view.discount > 0 ? view.discount.toLocaleString("id-ID") : "—",
        total: item.lineTotal,
      };
    }),
    subtotal: invoice.subtotal,
    discountTotal: invoice.discountTotal,
    taxLabel: invoice.taxRate > 0 ? `PPN ${invoice.taxRate}%${invoice.taxIncluded ? " (termasuk)" : ""}` : null,
    taxTotal: invoice.taxTotal,
    grandTotal: invoice.grandTotal,
    payments: payments.map((p) => ({ label: `${PREFIX[p.kind]} ${METHOD[p.method]}`, date: p.paidAt, amount: p.amount })),
    remaining: Math.max(0, invoice.grandTotal - paid),
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoiceNo}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
