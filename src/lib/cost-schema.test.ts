import { describe, expect, it } from "vitest";
import { costSchema } from "./cost-schema";

const ok = { name: "Listrik Oktober", amount: 750_000, category: "Listrik & Air", costDate: "2026-10-05", notes: "" };

describe("costSchema", () => {
  it("menerima biaya lengkap", () => {
    expect(costSchema.safeParse(ok).success).toBe(true);
  });

  it("nominal rupiah bulat positif (uang = integer)", () => {
    expect(costSchema.safeParse({ ...ok, amount: 0 }).success).toBe(false);
    expect(costSchema.safeParse({ ...ok, amount: -1 }).success).toBe(false);
    expect(costSchema.safeParse({ ...ok, amount: 1500.5 }).success).toBe(false);
    expect(costSchema.safeParse({ ...ok, amount: 2_000_000_000 }).success).toBe(false);
  });

  it("kategori hanya dari daftar, nama dan tanggal wajib valid", () => {
    expect(costSchema.safeParse({ ...ok, category: "Pembelian Stok" }).success).toBe(false);
    expect(costSchema.safeParse({ ...ok, name: " " }).success).toBe(false);
    expect(costSchema.safeParse({ ...ok, costDate: "2026-02-31x" }).success).toBe(false);
  });
});
