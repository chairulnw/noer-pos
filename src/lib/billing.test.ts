import { describe, expect, it } from "vitest";
import { allergyMatch, changeDue, formatInvoiceNo, paymentStatus, invoiceTotals, lineTotals, nextInvoiceNo, type Discount, type LineInput } from "./billing";

const none: Discount = { type: null, value: 0 };
const line = (qty: number, unitPrice: number, discount: Discount = none): LineInput => ({ qty, unitPrice, discount });

describe("lineTotals", () => {
  it("qty x harga tanpa diskon", () => {
    expect(lineTotals(line(2, 98000))).toEqual({ gross: 196000, discount: 0, total: 196000 });
  });

  it("diskon persen: 10 tablet x 3.500, diskon 10% = 31.500 (contoh desain)", () => {
    expect(lineTotals(line(10, 3500, { type: "PERCENT", value: 10 }))).toEqual({ gross: 35000, discount: 3500, total: 31500 });
  });

  it("diskon nominal tidak boleh melebihi harga", () => {
    expect(lineTotals(line(1, 10000, { type: "AMOUNT", value: 50000 })).total).toBe(0);
    expect(lineTotals(line(1, 10000, { type: "AMOUNT", value: 2500 })).total).toBe(7500);
  });

  it("persen dijepit 0-100", () => {
    expect(lineTotals(line(1, 1000, { type: "PERCENT", value: 150 })).total).toBe(0);
    expect(lineTotals(line(1, 1000, { type: "PERCENT", value: -5 })).total).toBe(1000);
  });

  it("qty desimal dibulatkan ke Rupiah terdekat, hasil selalu integer", () => {
    expect(lineTotals(line(0.5, 3333)).gross).toBe(1667);
    expect(lineTotals(line(1.333, 1000)).gross).toBe(1333);
    expect(Number.isInteger(lineTotals(line(0.333, 777, { type: "PERCENT", value: 7 })).total)).toBe(true);
  });
});

describe("invoiceTotals", () => {
  const items = [line(1, 150000), line(1, 85000), line(10, 3500, { type: "PERCENT", value: 10 }), line(2, 98000)];
  const exclude = { rate: 11, included: false };

  it("contoh desain: subtotal 462.500, diskon 12.500, PPN 11% = 49.500, total 499.500", () => {
    expect(invoiceTotals(items, { type: "AMOUNT", value: 12500 }, exclude)).toEqual({
      subtotal: 462500,
      discountTotal: 12500,
      taxTotal: 49500,
      grandTotal: 499500,
    });
  });

  it("tanpa PPN", () => {
    expect(invoiceTotals(items, none, { rate: 0, included: false })).toEqual({ subtotal: 462500, discountTotal: 0, taxTotal: 0, grandTotal: 462500 });
  });

  it("diskon invoice persen dipotong sebelum PPN", () => {
    expect(invoiceTotals([line(1, 100000)], { type: "PERCENT", value: 10 }, exclude)).toEqual({
      subtotal: 100000,
      discountTotal: 10000,
      taxTotal: 9900,
      grandTotal: 99900,
    });
  });

  it("PPN include: total tetap, pajak = bagian dari harga", () => {
    expect(invoiceTotals([line(1, 111000)], none, { rate: 11, included: true })).toEqual({
      subtotal: 111000,
      discountTotal: 0,
      taxTotal: 11000,
      grandTotal: 111000,
    });
  });

  it("PPN dibulatkan ke Rupiah terdekat (0,5 naik)", () => {
    expect(invoiceTotals([line(1, 50)], none, exclude).taxTotal).toBe(6);
    expect(invoiceTotals([line(1, 4)], none, exclude).taxTotal).toBe(0);
  });

  it("diskon invoice nominal tidak melebihi subtotal, total tidak negatif", () => {
    expect(invoiceTotals([line(1, 5000)], { type: "AMOUNT", value: 99999 }, exclude)).toMatchObject({ discountTotal: 5000, grandTotal: 0 });
  });

  it("invoice kosong bernilai 0", () => {
    expect(invoiceTotals([], none, exclude)).toEqual({ subtotal: 0, discountTotal: 0, taxTotal: 0, grandTotal: 0 });
  });
});

describe("nomor invoice (BR-10)", () => {
  it("format dan urutan harian", () => {
    expect(formatInvoiceNo("20261003", 7)).toBe("INV-20261003-007");
    expect(nextInvoiceNo("20261003", null)).toBe("INV-20261003-001");
    expect(nextInvoiceNo("20261003", "INV-20261003-009")).toBe("INV-20261003-010");
    expect(nextInvoiceNo("20261003", "INV-20261003-999")).toBe("INV-20261003-1000");
  });
});

describe("allergyMatch", () => {
  const note = "Amoxicillin (gatal & bengkak), daging ayam";

  it("mencocokkan nama obat di catatan alergi, tidak peka huruf besar-kecil", () => {
    expect(allergyMatch(note, "Amoxicillin 250 mg tablet")).toBe(true);
    expect(allergyMatch("AMOXICILLIN", "amoxicillin 100mg")).toBe(true);
  });

  it("tidak cocok untuk obat lain atau tanpa catatan alergi", () => {
    expect(allergyMatch(note, "Metronidazole 250 mg")).toBe(false);
    expect(allergyMatch(null, "Amoxicillin")).toBe(false);
    expect(allergyMatch(note, "Injeksi Cefotaxime 1 g")).toBe(false);
  });
});

describe("status pembayaran (BR-9, diturunkan)", () => {
  it("belum bayar, sebagian, lunas", () => {
    expect(paymentStatus(0, 499500)).toBe("BELUM_BAYAR");
    expect(paymentStatus(200000, 499500)).toBe("SEBAGIAN");
    expect(paymentStatus(499500, 499500)).toBe("LUNAS");
  });

  it("invoice bernilai 0 langsung lunas", () => {
    expect(paymentStatus(0, 0)).toBe("LUNAS");
  });

  it("kembalian tunai tidak pernah negatif", () => {
    expect(changeDue(500000, 499500)).toBe(500);
    expect(changeDue(499500, 499500)).toBe(0);
    expect(changeDue(100, 499500)).toBe(0);
  });
});
