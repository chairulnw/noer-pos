import { describe, expect, it } from "vitest";
import { EXAM, examTypeFromSlug, examinationSchema } from "./examination-schema";

const base = { name: "Darah lengkap", performedAt: "2026-10-06", findings: "", notes: "", recordId: "" };

describe("examinationSchema", () => {
  it("lab: ringkasan hasil boleh kosong", () => {
    expect(examinationSchema("LAB").safeParse(base).success).toBe(true);
  });

  it("radiologi: temuan wajib diisi", () => {
    expect(examinationSchema("RADIOLOGI").safeParse({ ...base, name: "X-Ray" }).success).toBe(false);
    expect(examinationSchema("RADIOLOGI").safeParse({ ...base, name: "X-Ray", findings: "Fraktur tibia" }).success).toBe(true);
  });

  it("nama wajib, tanggal harus nyata, rekam medis harus guid atau kosong", () => {
    expect(examinationSchema("LAB").safeParse({ ...base, name: " " }).success).toBe(false);
    expect(examinationSchema("LAB").safeParse({ ...base, performedAt: "2026-13-45" }).success).toBe(false);
    expect(examinationSchema("LAB").safeParse({ ...base, recordId: "bukan-guid" }).success).toBe(false);
    expect(examinationSchema("LAB").safeParse({ ...base, recordId: "11111111-1111-1111-1111-111111111111" }).success).toBe(true);
  });

  it("slug rute dipetakan ke jenis", () => {
    expect(examTypeFromSlug("hasil-lab")).toBe("LAB");
    expect(examTypeFromSlug("radiologi")).toBe("RADIOLOGI");
    expect(examTypeFromSlug("lain")).toBeNull();
    expect(EXAM.LAB.path).toBe("/hasil-lab");
  });
});
