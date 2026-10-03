import Link from "next/link";
import { ClinicalTags } from "@/components/clinical-flags";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { paymentStatus } from "@/lib/billing";
import { formatDate, formatRupiah } from "@/lib/format";
import { INVOICE_STATUS } from "@/lib/invoice-status";
import { listInvoices } from "@/lib/invoices";
import { requireCapability } from "@/lib/require-role";
import { cn } from "@/lib/utils";

const STATUSES = ["DRAFT", "FINAL", "VOID"] as const;

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  await requireCapability("manage_invoice_payment");
  const { q, status } = await searchParams;
  const active = STATUSES.find((s) => s === status);
  const invoices = await listInvoices({ q: q?.trim() || undefined, status: active });
  const href = (s?: string) => `/invoice?${new URLSearchParams({ ...(q && { q }), ...(s && { status: s }) })}`;

  return (
    <div className="space-y-4">
      <h1 className="text-[22px] font-semibold leading-11">Invoice</h1>
      <div className="flex flex-wrap items-center gap-3">
        <form className="flex flex-1 basis-80 gap-2">
          {active && <input type="hidden" name="status" value={active} />}
          <Input name="q" data-search defaultValue={q} placeholder="Cari no. invoice, pasien, atau owner" aria-label="Cari invoice" />
          <Button type="submit" variant="outline">Cari</Button>
        </form>
        <div className="flex gap-1.5">
          {[undefined, ...STATUSES].map((s) => (
            <Link key={s ?? "all"} href={href(s)} className={cn("flex h-11 items-center rounded-lg border px-4 text-sm font-medium", s === active ? "border-primary bg-accent text-primary" : "bg-card")}>
              {s ? INVOICE_STATUS[s].label : "Semua"}
            </Link>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-[10px] border bg-card">
        <table className="w-full min-w-[560px] text-[14.5px]">
          <thead>
            <tr className="border-b text-left text-[13px] text-muted-foreground">
              <th className="px-4 py-2.5 font-normal">No. invoice</th>
              <th className="px-4 py-2.5 font-normal">Pasien / pelanggan</th>
              <th className="px-4 py-2.5 font-normal">Tanggal</th>
              <th className="px-4 py-2.5 text-right font-normal">Total</th>
              <th className="px-4 py-2.5 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Belum ada invoice.</td>
              </tr>
            )}
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/invoice/${inv.id}`} className="font-medium text-primary tabular-nums">{inv.invoiceNo}</Link>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium">{(inv.visit ?? inv.admission)?.patient.name ?? inv.customerName ?? "Retail"}</span>
                    {(inv.visit ?? inv.admission) && <ClinicalTags allergyNote={(inv.visit ?? inv.admission)!.patient.allergyNote} aggressive={(inv.visit ?? inv.admission)!.patient.aggressive} />}
                  </div>
                  {inv.owner && <div className="text-[13px] text-muted-foreground">{inv.owner.name}</div>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(inv.createdAt)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatRupiah(inv.grandTotal)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <StatusChip tone={INVOICE_STATUS[inv.status].tone}>{INVOICE_STATUS[inv.status].label}</StatusChip>
                    {inv.status !== "VOID" && (inv.status === "FINAL" || inv.payments.length > 0) && (() => {
                      const state = paymentStatus(inv.payments.reduce((sum, p) => sum + p.amount, 0), inv.grandTotal);
                      return <StatusChip tone={state === "LUNAS" ? "success" : "warning"}>{state === "LUNAS" ? "Lunas" : state === "SEBAGIAN" ? "DP" : "Belum bayar"}</StatusChip>;
                    })()}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
