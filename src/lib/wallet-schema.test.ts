import { describe, expect, it } from "vitest";
import { adjustSchema, topUpSchema } from "./wallet-schema";

const owner = "11111111-1111-1111-1111-111111111111";

describe("topUpSchema", () => {
  it("rupiah bulat positif dengan metode non-saldo", () => {
    expect(topUpSchema.safeParse({ ownerId: owner, amount: 100_000, method: "TUNAI", note: "" }).success).toBe(true);
    expect(topUpSchema.safeParse({ ownerId: owner, amount: 0, method: "TUNAI", note: "" }).success).toBe(false);
    expect(topUpSchema.safeParse({ ownerId: owner, amount: 1000.5, method: "TUNAI", note: "" }).success).toBe(false);
    expect(topUpSchema.safeParse({ ownerId: owner, amount: 1000, method: "WALLET", note: "" }).success).toBe(false);
  });
});

describe("adjustSchema", () => {
  it("alasan wajib dan selisih tidak boleh nol, boleh negatif", () => {
    expect(adjustSchema.safeParse({ ownerId: owner, delta: -5000, reason: "Salah input" }).success).toBe(true);
    expect(adjustSchema.safeParse({ ownerId: owner, delta: 0, reason: "Salah input" }).success).toBe(false);
    expect(adjustSchema.safeParse({ ownerId: owner, delta: 5000, reason: "x" }).success).toBe(false);
  });
});
