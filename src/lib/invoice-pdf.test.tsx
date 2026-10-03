import { expect, it } from "vitest";
import { renderInvoicePdf, type InvoicePdfData } from "./invoice-pdf";

const data: InvoicePdfData = {
  clinic: { name: "NOER Petshop & Vet Clinic", address: "Jl. Mawar 12", phone: "0812", npwp: "", footer: "Terima kasih", logo: null },
  invoiceNo: "INV-20261003-001",
  date: new Date("2026-10-03T07:00:00Z"),
  statusLabel: "LUNAS",
  billedTo: { name: "Rina Kartika", whatsapp: "0812-3456-7781" },
  patient: { name: "Mochi", species: "Kucing", rmNo: "RM-2026-00142" },
  lines: [{ name: "Konsultasi Umum", qty: 1, unitPrice: 50000, discountLabel: "—", total: 50000 }],
  subtotal: 50000,
  discountTotal: 0,
  taxLabel: "PPN 11%",
  taxTotal: 5500,
  grandTotal: 55500,
  payments: [{ label: "Tunai", date: new Date("2026-10-03T07:00:00Z"), amount: 55500 }],
  remaining: 0,
};

it("menghasilkan PDF valid, termasuk invoice banyak item yang melewati satu halaman", async () => {
  const pdf = await renderInvoicePdf(data);
  expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  expect(pdf.length).toBeGreaterThan(1000);

  const many = await renderInvoicePdf({ ...data, lines: Array.from({ length: 80 }, (_, i) => ({ ...data.lines[0], name: `Item ${i + 1}` })) });
  expect(many.subarray(0, 5).toString()).toBe("%PDF-");
  expect(many.length).toBeGreaterThan(pdf.length);
});
