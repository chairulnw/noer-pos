import { describe, expect, it } from "vitest";
import { cashClosingSchema, cashDifference, differenceLabel } from "./cash-schema";

describe("cashDifference", () => {
  it("selisih = hitung fisik - (modal awal + tunai sistem)", () => {
    expect(cashDifference({ openingCash: 100_000, cashSales: 400_000, countedCash: 500_000 })).toEqual({ expected: 500_000, difference: 0 });
    expect(cashDifference({ openingCash: 100_000, cashSales: 400_000, countedCash: 495_000 }).difference).toBe(-5_000);
    expect(cashDifference({ openingCash: 0, cashSales: 0, countedCash: 2_000 }).difference).toBe(2_000);
  });

  it("label selisih", () => {
    expect([0, 1, -1].map(differenceLabel)).toEqual(["Sesuai", "Lebih", "Kurang"]);
  });
});

describe("cashClosingSchema", () => {
  const ok = { openingCash: 100_000, countedCash: 500_000, note: "" };

  it("menerima rupiah bulat non-negatif", () => {
    expect(cashClosingSchema.safeParse(ok).success).toBe(true);
    expect(cashClosingSchema.safeParse({ ...ok, countedCash: 0 }).success).toBe(true);
  });

  it("menolak desimal, negatif, dan terlalu besar (uang = integer)", () => {
    expect(cashClosingSchema.safeParse({ ...ok, countedCash: 1000.5 }).success).toBe(false);
    expect(cashClosingSchema.safeParse({ ...ok, openingCash: -1 }).success).toBe(false);
    expect(cashClosingSchema.safeParse({ ...ok, countedCash: 2_000_000_000 }).success).toBe(false);
    expect(cashClosingSchema.safeParse({ ...ok, countedCash: Number.NaN }).success).toBe(false);
  });
});
