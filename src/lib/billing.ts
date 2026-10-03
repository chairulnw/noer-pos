export type DiscountKind = "PERCENT" | "AMOUNT";
export type Discount = { type: DiscountKind | null; value: number };

export type LineInput = { qty: number; unitPrice: number } & { discount: Discount };

export const discountAmount = (base: number, { type, value }: Discount) => {
  if (type === "PERCENT") return Math.round((base * Math.min(Math.max(value, 0), 100)) / 100);
  if (type === "AMOUNT") return Math.min(Math.max(value, 0), base);
  return 0;
};

export function lineTotals({ qty, unitPrice, discount }: LineInput) {
  const gross = Math.round((Math.round(qty * 1000) * unitPrice) / 1000);
  const off = discountAmount(gross, discount);
  return { gross, discount: off, total: gross - off };
}

export function invoiceTotals(lines: LineInput[], invoiceDiscount: Discount, tax: { rate: number; included: boolean }) {
  const subtotal = lines.reduce((sum, line) => sum + lineTotals(line).total, 0);
  const discountTotal = discountAmount(subtotal, invoiceDiscount);
  const base = subtotal - discountTotal;

  if (tax.rate === 0) return { subtotal, discountTotal, taxTotal: 0, grandTotal: base };
  if (tax.included) return { subtotal, discountTotal, taxTotal: Math.round((base * tax.rate) / (100 + tax.rate)), grandTotal: base };

  const taxTotal = Math.round((base * tax.rate) / 100);
  return { subtotal, discountTotal, taxTotal, grandTotal: base + taxTotal };
}

export const formatInvoiceNo = (datePart: string, seq: number) => `INV-${datePart}-${String(seq).padStart(3, "0")}`;

export function nextInvoiceNo(datePart: string, lastOfDay: string | null) {
  return formatInvoiceNo(datePart, lastOfDay ? Number(lastOfDay.slice(`INV-${datePart}-`.length)) + 1 : 1);
}

export function allergyMatch(allergyNote: string | null, itemName: string) {
  if (!allergyNote) return false;
  const note = allergyNote.toLowerCase();
  return itemName
    .toLowerCase()
    .split(/[^a-z]+/)
    .some((word) => word.length >= 5 && note.includes(word));
}

export type PaymentStatus = "BELUM_BAYAR" | "SEBAGIAN" | "LUNAS";

export const paymentStatus = (paid: number, grandTotal: number): PaymentStatus =>
  paid >= grandTotal ? "LUNAS" : paid > 0 ? "SEBAGIAN" : "BELUM_BAYAR";

export const changeDue = (cashReceived: number, grandTotal: number) => Math.max(0, cashReceived - grandTotal);
