import { describe, expect, it } from "vitest";
import { barHeights, daysBetween, fillDays, trendRange, groupMonthly, marginPercent, profit, resolveRange, sumRows } from "./report";

const today = new Date("2026-10-04T00:00:00Z");

describe("resolveRange", () => {
  it("default bulan ini, sampai hari ini", () => {
    const r = resolveRange({}, today);
    expect(r).toMatchObject({ from: "2026-10-01", to: "2026-10-04", preset: "bulan-ini" });
  });

  it("bulan lalu mencakup seluruh bulan, termasuk lintas tahun", () => {
    expect(resolveRange({ preset: "bulan-lalu" }, today)).toMatchObject({ from: "2026-09-01", to: "2026-09-30" });
    expect(resolveRange({ preset: "bulan-lalu" }, new Date("2027-01-15T00:00:00Z"))).toMatchObject({ from: "2026-12-01", to: "2026-12-31" });
  });

  it("7 hari termasuk hari ini", () => {
    expect(resolveRange({ preset: "7-hari" }, today)).toMatchObject({ from: "2026-09-28", to: "2026-10-04" });
  });

  it("batas waktu mengikuti hari WIB dan akhir bersifat eksklusif", () => {
    const r = resolveRange({ from: "2026-10-03", to: "2026-10-03" }, today);
    if ("error" in r) throw new Error(r.error);
    expect(r.start.toISOString()).toBe("2026-10-02T17:00:00.000Z");
    expect(r.endExclusive.toISOString()).toBe("2026-10-03T17:00:00.000Z");
  });

  it("menolak rentang terbalik, terlalu panjang, dan tanggal mustahil", () => {
    expect(resolveRange({ from: "2026-10-05", to: "2026-10-01" }, today)).toHaveProperty("error");
    expect(resolveRange({ from: "2025-01-01", to: "2026-10-01" }, today)).toHaveProperty("error");
    expect(resolveRange({ from: "2026-13-45", to: "2026-14-01" }, today)).toHaveProperty("error");
  });
});

describe("agregasi", () => {
  const rows = [
    { day: "2026-09-30", invoices: 2, sales: 300_000, cost: 100_000 },
    { day: "2026-10-01", invoices: 1, sales: 50_000, cost: 0 },
    { day: "2026-10-03", invoices: 3, sales: 200_000, cost: 120_000 },
  ];

  it("laba kotor dan margin", () => {
    expect(profit(rows[0])).toBe(200_000);
    expect(marginPercent(rows[0])).toBe(66.7);
    expect(marginPercent({ sales: 0, cost: 0 })).toBe(0);
  });

  it("rekap bulanan menjumlah per bulan WIB dan terurut", () => {
    expect(groupMonthly(rows)).toEqual([
      { day: "2026-09", invoices: 2, sales: 300_000, cost: 100_000 },
      { day: "2026-10", invoices: 4, sales: 250_000, cost: 120_000 },
    ]);
    expect(sumRows(rows)).toEqual({ invoices: 6, sales: 550_000, cost: 220_000 });
  });

  it("fillDays mengisi hari tanpa transaksi dengan nol", () => {
    const filled = fillDays(rows, "2026-10-01", "2026-10-03");
    expect(filled.map((r) => r.day)).toEqual(["2026-10-01", "2026-10-02", "2026-10-03"]);
    expect(filled[1]).toEqual({ day: "2026-10-02", invoices: 0, sales: 0, cost: 0 });
  });
});

describe("tren", () => {
  it("trendRange menutup n hari termasuk hari ini dan menolak nilai asing", () => {
    expect(trendRange(7, today)).toEqual({ days: 7, from: "2026-09-28", to: "2026-10-04" });
    expect(trendRange(5, today).days).toBe(30);
    expect(daysBetween("2026-09-28", "2026-10-04")).toHaveLength(7);
  });

  it("barHeights: relatif ke nilai terbesar, nol tetap nol, nilai kecil tetap terlihat", () => {
    expect(barHeights([0, 50, 100])).toEqual([0, 0.5, 1]);
    expect(barHeights([0, 0])).toEqual([0, 0]);
    expect(barHeights([1, 1000])[0]).toBe(0.02);
  });
});
