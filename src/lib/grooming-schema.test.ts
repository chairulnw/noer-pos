import { describe, expect, it } from "vitest";
import { canTransition, groomingSchema, isEditable } from "./grooming-schema";

describe("grooming", () => {
  it("status hanya maju dan final tak bisa diubah", () => {
    expect(canTransition("MENUNGGU", "PROSES")).toBe(true);
    expect(canTransition("MENUNGGU", "SELESAI")).toBe(false);
    expect(canTransition("SELESAI", "BATAL")).toBe(false);
    expect(isEditable("PROSES")).toBe(true);
    expect(isEditable("BATAL")).toBe(false);
  });

  it("layanan dan tanggal wajib valid", () => {
    const ok = { groomingDate: "2026-10-10", serviceItemId: "11111111-1111-1111-1111-111111111111", notes: "" };
    expect(groomingSchema.safeParse(ok).success).toBe(true);
    expect(groomingSchema.safeParse({ ...ok, serviceItemId: "" }).success).toBe(false);
    expect(groomingSchema.safeParse({ ...ok, groomingDate: "10/10/2026" }).success).toBe(false);
  });
});
