import { describe, expect, it } from "vitest";
import { addendumSchema, canTransition, completeSchema, isEditable, nextStatuses, surgerySchema } from "./surgery-schema";

const ok = { procedure: "Steril kucing betina", anesthesia: "Ketamin + Xylazine", surgeryDate: "2026-10-10", doctorId: "11111111-1111-1111-1111-111111111111", serviceItemId: "", preNotes: "" };

describe("alur status operasi", () => {
  it("hanya maju: dijadwalkan → berjalan → selesai, batal sebelum selesai", () => {
    expect(nextStatuses("DIJADWALKAN")).toEqual(["BERJALAN", "BATAL"]);
    expect(nextStatuses("BERJALAN")).toEqual(["SELESAI", "BATAL"]);
    expect(canTransition("DIJADWALKAN", "SELESAI")).toBe(false);
    expect(canTransition("SELESAI", "BATAL")).toBe(false);
    expect(canTransition("BATAL", "BERJALAN")).toBe(false);
  });

  it("selesai dan batal tidak bisa diubah lagi", () => {
    expect(isEditable("DIJADWALKAN")).toBe(true);
    expect(isEditable("BERJALAN")).toBe(true);
    expect(isEditable("SELESAI")).toBe(false);
    expect(isEditable("BATAL")).toBe(false);
  });
});

describe("skema operasi", () => {
  it("prosedur, tanggal, dan dokter wajib valid", () => {
    expect(surgerySchema.safeParse(ok).success).toBe(true);
    expect(surgerySchema.safeParse({ ...ok, procedure: " " }).success).toBe(false);
    expect(surgerySchema.safeParse({ ...ok, surgeryDate: "2026-02-30x" }).success).toBe(false);
    expect(surgerySchema.safeParse({ ...ok, doctorId: "" }).success).toBe(false);
  });

  it("catatan pasca-operasi wajib untuk menyelesaikan; addendum wajib berisi", () => {
    expect(completeSchema.safeParse({ postNotes: "  " }).success).toBe(false);
    expect(completeSchema.safeParse({ postNotes: "Pemulihan baik" }).success).toBe(true);
    expect(addendumSchema.safeParse({ note: "" }).success).toBe(false);
  });
});
