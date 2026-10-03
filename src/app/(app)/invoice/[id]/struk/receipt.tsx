"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { formatDate, formatRupiah, formatTime } from "@/lib/format";
import { markReceiptPrintedAction } from "../../actions";

export type ReceiptData = {
  invoiceId: string;
  paperWidth: 58 | 80;
  clinic: { name: string; address: string; phone: string; npwp: string; footer: string };
  invoiceNo: string;
  at: string;
  cashier: string;
  customer: string;
  copy: boolean;
  lines: { name: string; qty: number; unitPrice: number; discount: number; total: number }[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  taxLabel: string | null;
  grandTotal: number;
  payments: { label: string; amount: number; cashReceived: number | null }[];
  remaining: number;
};

const Row = ({ left, right, bold }: { left: string; right: string; bold?: boolean }) => (
  <div className={`flex justify-between gap-2 ${bold ? "font-bold" : ""}`}>
    <span>{left}</span>
    <span className="tabular-nums">{right}</span>
  </div>
);

const Rule = () => <div className="my-1.5 border-t border-dashed border-black" />;

export function Receipt({ data }: { data: ReceiptData }) {
  const [pending, startTransition] = useTransition();
  const at = new Date(data.at);
  const width = data.paperWidth === 58 ? "58mm" : "80mm";

  return (
    <div>
      <style>{`
        @page { size: ${width} auto; margin: 0; }
        @media print {
          body * { visibility: hidden; }
          #receipt, #receipt * { visibility: visible; }
          #receipt { position: absolute; left: 0; top: 0; margin: 0; box-shadow: none; border: 0; width: ${width}; }
        }
      `}</style>

      <div className="mb-4 flex flex-wrap items-center gap-3 print:hidden">
        <Link href={`/invoice/${data.invoiceId}`} className="text-[13px] font-medium text-primary">← Invoice</Link>
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await markReceiptPrintedAction(data.invoiceId);
              window.print();
            })
          }
        >
          {data.copy ? "Cetak ulang (salinan)" : "Cetak struk"}
        </Button>
        <span className="text-[13px] text-muted-foreground">Kertas {data.paperWidth} mm (ubah di Pengaturan)</span>
      </div>

      <div
        id="receipt"
        style={{ width }}
        className="bg-white px-3 py-3 font-mono text-[12px] leading-snug text-black shadow-sm ring-1 ring-border"
      >
        <div className="text-center">
          <div className="text-[14px] font-bold">{data.clinic.name}</div>
          {data.clinic.address && <div>{data.clinic.address}</div>}
          {data.clinic.phone && <div>Telp {data.clinic.phone}</div>}
          {data.clinic.npwp && <div>NPWP {data.clinic.npwp}</div>}
        </div>
        <Rule />
        {data.copy && <div className="mb-1 text-center text-[13px] font-bold tracking-widest">*** SALINAN ***</div>}
        <Row left="No" right={data.invoiceNo} />
        <Row left="Tgl" right={`${formatDate(at)} ${formatTime(at)}`} />
        <Row left="Kasir" right={data.cashier} />
        <Row left="Pelanggan" right={data.customer} />
        <Rule />
        {data.lines.map((line, i) => (
          <div key={i} className="mb-1">
            <div>{line.name}</div>
            <Row left={`${line.qty} x ${line.unitPrice.toLocaleString("id-ID")}`} right={(line.total + line.discount).toLocaleString("id-ID")} />
            {line.discount > 0 && <Row left="  Diskon" right={`-${line.discount.toLocaleString("id-ID")}`} />}
          </div>
        ))}
        <Rule />
        <Row left="Subtotal" right={formatRupiah(data.subtotal)} />
        {data.discountTotal > 0 && <Row left="Diskon" right={`-${formatRupiah(data.discountTotal)}`} />}
        {data.taxLabel && <Row left={data.taxLabel} right={formatRupiah(data.taxTotal)} />}
        <Row left="TOTAL" right={formatRupiah(data.grandTotal)} bold />
        <Rule />
        {data.payments.map((p, i) => (
          <div key={i}>
            <Row left={p.label} right={formatRupiah(p.amount)} />
            {p.cashReceived !== null && (
              <>
                <Row left="Diterima" right={formatRupiah(p.cashReceived)} />
                <Row left="Kembali" right={formatRupiah(p.cashReceived - p.amount)} />
              </>
            )}
          </div>
        ))}
        {data.remaining > 0 && <Row left="SISA" right={formatRupiah(data.remaining)} bold />}
        {data.clinic.footer && (
          <>
            <Rule />
            <div className="text-center">{data.clinic.footer}</div>
          </>
        )}
      </div>
    </div>
  );
}
