import { describe, expect, it } from "vitest";
import { discountSchema, lineSchema, paySchema } from "./invoice-schema";

describe("discountSchema", () => {
  it("menerima persen dan nominal; nilai 0 atau tanpa jenis dianggap tanpa diskon", () => {
    expect(discountSchema.parse({ type: "PERCENT", value: 10 })).toEqual({ type: "PERCENT", value: 10 });
    expect(discountSchema.parse({ type: "AMOUNT", value: 12500 })).toEqual({ type: "AMOUNT", value: 12500 });
    expect(discountSchema.parse({ type: "AMOUNT", value: 0 })).toEqual({ type: null, value: 0 });
    expect(discountSchema.parse({ type: null, value: 500 })).toEqual({ type: null, value: 0 });
  });

  it.each([
    ["persen di atas 100", { type: "PERCENT", value: 101 }],
    ["persen desimal (BR-1)", { type: "PERCENT", value: 12.5 }],
    ["nominal negatif", { type: "AMOUNT", value: -1 }],
    ["nominal desimal", { type: "AMOUNT", value: 100.5 }],
  ])("menolak %s", (_name, value) => {
    expect(discountSchema.safeParse(value).success).toBe(false);
  });
});

describe("lineSchema", () => {
  it("menolak jumlah 0 atau negatif", () => {
    expect(lineSchema.safeParse({ qty: 0, discount: { type: null, value: 0 } }).success).toBe(false);
    expect(lineSchema.safeParse({ qty: -1, discount: { type: null, value: 0 } }).success).toBe(false);
    expect(lineSchema.safeParse({ qty: 2.5, discount: { type: null, value: 0 } }).success).toBe(true);
  });
});

describe("paySchema", () => {
  it("uang diterima hanya berlaku untuk tunai; referensi hanya untuk non-tunai", () => {
    expect(paySchema.parse({ method: "TUNAI", cashReceived: 500000, reference: "x" })).toEqual({ method: "TUNAI", cashReceived: 500000, reference: "" });
    expect(paySchema.parse({ method: "KARTU", cashReceived: 500000, reference: "1234 / AP99" })).toEqual({ method: "KARTU", cashReceived: null, reference: "1234 / AP99" });
  });

  it("menolak metode tak dikenal", () => {
    expect(paySchema.safeParse({ method: "KREDIT", cashReceived: null, reference: "" }).success).toBe(false);
  });
});
