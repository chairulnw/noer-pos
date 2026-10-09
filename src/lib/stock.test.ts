import { describe, expect, it } from "vitest";
import { batchExpiryAlert, costPerBaseUnit, fefoAllocate, isExpired, isLowStock, opnameDiff, stockStatus, toBaseQty, weightedCost, type StockBatchInfo } from "./stock";

const day = (iso: string) => new Date(`${iso}T00:00:00Z`);
const today = day("2026-10-03");
const batch = (id: string, expiry: string | null, qty: number, created = "2026-09-01"): StockBatchInfo => ({
  id,
  expiry: expiry ? day(expiry) : null,
  qty,
  createdAt: day(created),
});

describe("konversi satuan (BR-8)", () => {
  it("jumlah satuan beli x faktor = satuan dasar", () => {
    expect(toBaseQty(2, 100)).toBe(200);
    expect(toBaseQty(0.5, 100)).toBe(50);
    expect(toBaseQty(1.5, 0.1)).toBe(0.15);
  });

  it("harga per satuan beli dibagi faktor = HPP per satuan dasar, integer", () => {
    expect(costPerBaseUnit(120000, 100)).toBe(1200);
    expect(costPerBaseUnit(100000, 3)).toBe(33333.333);
    expect(costPerBaseUnit(8888, 500)).toBe(17.776);
  });
});

describe("isExpired", () => {
  it("expired hanya jika tanggalnya sebelum hari ini; hari-H masih bisa dijual", () => {
    expect(isExpired(day("2026-10-02"), today)).toBe(true);
    expect(isExpired(day("2026-10-03"), today)).toBe(false);
    expect(isExpired(null, today)).toBe(false);
  });
});

describe("fefoAllocate (BR-5)", () => {
  it("mengambil batch dengan expired terdekat dulu", () => {
    const result = fefoAllocate([batch("late", "2027-06-01", 100), batch("soon", "2026-12-01", 100)], 30, today);
    expect(result).toEqual({ ok: true, allocations: [{ batchId: "soon", qty: 30 }] });
  });

  it("lintas batch bila batch pertama tidak cukup", () => {
    const result = fefoAllocate([batch("a", "2026-12-01", 20), batch("b", "2027-03-01", 50), batch("c", "2027-09-01", 50)], 60, today);
    expect(result).toEqual({
      ok: true,
      allocations: [
        { batchId: "a", qty: 20 },
        { batchId: "b", qty: 40 },
      ],
    });
  });

  it("batch expired tidak pernah dialokasikan, meski satu-satunya stok", () => {
    expect(fefoAllocate([batch("old", "2026-10-02", 100)], 1, today)).toEqual({ ok: false, available: 0 });
    const mixed = fefoAllocate([batch("old", "2026-09-01", 100), batch("ok", "2027-01-01", 5)], 6, today);
    expect(mixed).toEqual({ ok: false, available: 5 });
  });

  it("batch yang expired hari ini masih dialokasikan", () => {
    expect(fefoAllocate([batch("today", "2026-10-03", 10)], 10, today)).toMatchObject({ ok: true });
  });

  it("stok kurang: ditolak dan melaporkan jumlah tersedia (tanpa alokasi sebagian)", () => {
    expect(fefoAllocate([batch("a", "2026-12-01", 3), batch("b", "2027-01-01", 4)], 10, today)).toEqual({ ok: false, available: 7 });
  });

  it("tepat habis dan batch kosong dilewati", () => {
    const result = fefoAllocate([batch("empty", "2026-11-01", 0), batch("a", "2026-12-01", 10)], 10, today);
    expect(result).toEqual({ ok: true, allocations: [{ batchId: "a", qty: 10 }] });
  });

  it("tanpa expired dipakai paling akhir; sesama tanpa expired urut FIFO", () => {
    const result = fefoAllocate(
      [batch("none-new", null, 10, "2026-09-20"), batch("none-old", null, 10, "2026-09-01"), batch("dated", "2027-05-01", 10)],
      25,
      today,
    );
    expect(result).toEqual({
      ok: true,
      allocations: [
        { batchId: "dated", qty: 10 },
        { batchId: "none-old", qty: 10 },
        { batchId: "none-new", qty: 5 },
      ],
    });
  });

  it("sesama expired sama diurutkan dari yang lebih dulu masuk", () => {
    const result = fefoAllocate([batch("new", "2027-01-01", 10, "2026-09-20"), batch("old", "2027-01-01", 10, "2026-09-01")], 5, today);
    expect(result).toEqual({ ok: true, allocations: [{ batchId: "old", qty: 5 }] });
  });

  it("qty desimal tanpa galat floating point", () => {
    const result = fefoAllocate([batch("a", "2026-12-01", 0.1), batch("b", "2027-01-01", 0.2)], 0.3, today);
    expect(result).toEqual({
      ok: true,
      allocations: [
        { batchId: "a", qty: 0.1 },
        { batchId: "b", qty: 0.2 },
      ],
    });
  });
});

describe("stockStatus", () => {
  const warn = 90;

  it("HABIS jika tidak ada stok yang bisa dijual (expired tidak dihitung)", () => {
    expect(stockStatus([{ expiry: day("2026-01-01"), qty: 50 }], null, today, warn)).toMatchObject({ usable: 0, status: "HABIS" });
  });

  it("MENIPIS di bawah atau sama dengan batas", () => {
    expect(stockStatus([{ expiry: day("2028-01-01"), qty: 10 }], 10, today, warn).status).toBe("MENIPIS");
    expect(stockStatus([{ expiry: day("2028-01-01"), qty: 11 }], 10, today, warn).status).toBe("AMAN");
  });

  it("HAMPIR_EXPIRED jika expired terdekat dalam N hari, dan melaporkan tanggalnya", () => {
    const result = stockStatus([{ expiry: day("2026-12-01"), qty: 5 }, { expiry: day("2027-06-01"), qty: 5 }], 2, today, warn);
    expect(result).toMatchObject({ status: "HAMPIR_EXPIRED", usable: 10, nearestExpiry: day("2026-12-01") });
    expect(stockStatus([{ expiry: day("2027-06-01"), qty: 5 }], 2, today, warn).status).toBe("AMAN");
  });
});

describe("weightedCost", () => {
  it("rata-rata tertimbang HPP batch yang sama", () => {
    expect(weightedCost(100, 1000, 100, 1200)).toBe(1100);
    expect(weightedCost(30, 1000, 10, 2000)).toBe(1250);
  });
});

describe("opnameDiff", () => {
  it("hitung fisik dikurangi stok sistem, tanpa galat floating point", () => {
    expect(opnameDiff(100, 97)).toBe(-3);
    expect(opnameDiff(100, 100)).toBe(0);
    expect(opnameDiff(0.3, 0.1)).toBe(-0.2);
    expect(opnameDiff(2, 2.5)).toBe(0.5);
  });
});

describe("batchExpiryAlert", () => {
  it("expired, hampir expired, aman, dan batch kosong atau tanpa expired", () => {
    expect(batchExpiryAlert(day("2026-10-02"), 5, today, 90)).toBe("EXPIRED");
    expect(batchExpiryAlert(day("2026-10-03"), 5, today, 90)).toBe("HAMPIR_EXPIRED");
    expect(batchExpiryAlert(day("2027-01-01"), 5, today, 90)).toBe("HAMPIR_EXPIRED");
    expect(batchExpiryAlert(day("2027-01-02"), 5, today, 90)).toBeNull();
    expect(batchExpiryAlert(day("2026-10-02"), 0, today, 90)).toBeNull();
    expect(batchExpiryAlert(null, 5, today, 90)).toBeNull();
  });

  it("jendela peringatan mengikuti Pengaturan", () => {
    expect(batchExpiryAlert(day("2026-11-20"), 5, today, 30)).toBeNull();
    expect(batchExpiryAlert(day("2026-11-20"), 5, today, 60)).toBe("HAMPIR_EXPIRED");
  });
});

describe("isLowStock", () => {
  it("hanya produk yang punya batas yang dipantau; sama dengan batas dihitung menipis", () => {
    expect(isLowStock(10, 10)).toBe(true);
    expect(isLowStock(11, 10)).toBe(false);
    expect(isLowStock(0, 5)).toBe(true);
    expect(isLowStock(0, null)).toBe(false);
  });
});
