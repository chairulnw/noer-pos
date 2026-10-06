import Link from "next/link";
import { FileText } from "lucide-react";
import { ClinicalTags } from "@/components/clinical-flags";
import { Chips, ListHeader, ListPage, ListToolbar, TableCard } from "@/components/data-table";
import { EmptyState } from "@/components/page-header";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { paymentStatus } from "@/lib/billing";
import { formatDate, formatRupiah } from "@/lib/format";
import { INVOICE_STATUS } from "@/lib/invoice-status";
import { listInvoices } from "@/lib/invoices";
import { buildHref, parsePaging, type PagingParams } from "@/lib/paging";
import { requireCapability } from "@/lib/require-role";

const STATUSES = ["DRAFT", "VOID"] as const;

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string } & PagingParams> }) {
  await requireCapability("manage_invoice_payment");
  const params = await searchParams;
  const active = STATUSES.find((s) => s === params.status);
  const { page, size, skip, take } = parsePaging(params);
  const { rows, total } = await listInvoices({ q: params.q?.trim() || undefined, status: active }, skip, take);
  const keep = { q: params.q, status: active, baris: params.baris };

  return (
    <ListPage>
      <ListHeader icon={FileText} title="Tagihan" subtitle="Tagihan yang belum lunas dari kunjungan, rawat inap, dan kasir. Yang sudah lunas pindah ke Transaksi (Lunas)" actions={<Button asChild><Link href="/kasir">Ke Kasir (POS)</Link></Button>} />
      <ListToolbar base="/invoice" params={keep} placeholder="Cari no. invoice, pasien, atau pemilik…" total={total} />
      <Chips items={[{ value: "", label: "Semua" }, ...STATUSES.map((s) => ({ value: s, label: INVOICE_STATUS[s].label }))]} active={active ?? ""} hrefFor={(v) => buildHref("/invoice", keep, { status: v || undefined, hal: undefined })} />
      <TableCard
        columns={[{ label: "No. invoice" }, { label: "Klien / pasien" }, { label: "Tanggal tagihan" }, { label: "Total", align: "right" }, { label: "Sisa tagihan", align: "right" }, { label: "Status" }]}
        total={total}
        page={page}
        size={size}
        base="/invoice"
        params={keep}
        minWidth={800}
        empty={<EmptyState>Belum ada tagihan. Tagihan terbentuk dari kunjungan, rawat inap, atau transaksi kasir.</EmptyState>}
      >
        {rows.map((inv) => {
          const paid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
          const state = paymentStatus(paid, inv.grandTotal);
          const patient = (inv.visit ?? inv.admission)?.patient;
          return (
            <tr key={inv.id} className="border-b last:border-0">
              <td className="px-4 py-3"><Link href={`/invoice/${inv.id}`} className="font-medium text-primary tabular-nums">{inv.invoiceNo}</Link></td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium">{patient?.name ?? inv.customerName ?? "Umum / Walk-in"}</span>
                  {patient && <ClinicalTags allergyNote={patient.allergyNote} aggressive={patient.aggressive} />}
                </div>
                {inv.owner && <div className="text-[13px] text-muted-foreground">{inv.owner.name}</div>}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(inv.createdAt)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatRupiah(inv.grandTotal)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{inv.status === "VOID" ? "—" : formatRupiah(Math.max(inv.grandTotal - paid, 0))}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  <StatusChip tone={INVOICE_STATUS[inv.status].tone}>{INVOICE_STATUS[inv.status].label}</StatusChip>
                  {inv.status !== "VOID" && (inv.status === "FINAL" || paid > 0) && <StatusChip tone={state === "LUNAS" ? "success" : "warning"}>{state === "LUNAS" ? "Lunas" : state === "SEBAGIAN" ? "DP" : "Belum bayar"}</StatusChip>}
                </div>
              </td>
            </tr>
          );
        })}
      </TableCard>
    </ListPage>
  );
}
