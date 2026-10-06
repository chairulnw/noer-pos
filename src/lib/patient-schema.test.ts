import { describe, expect, it } from "vitest";
import {
  birthDateFromAge,
  formatAge,
  formatRmNo,
  formatWhatsapp,
  nextRmNo,
  normalizePatient,
  normalizeWhatsapp,
  ownerSchema,
  patientSchema,
  type PatientInput,
} from "./patient-schema";

const day = (iso: string) => new Date(`${iso}T00:00:00Z`);

describe("normalizeWhatsapp", () => {
  it.each([
    ["0812-3456-7890", "6281234567890"],
    ["+62 812 3456 7890", "6281234567890"],
    ["6281234567890", "6281234567890"],
    ["81234567890", "6281234567890"],
  ])("%s -> %s", (input, expected) => {
    expect(normalizeWhatsapp(input)).toBe(expected);
  });

  it.each(["0812-33", "abc", "", "+1 415 555 0100", "0812345678901234567"])("menolak %s", (input) => {
    expect(normalizeWhatsapp(input)).toBe("");
  });

  it("formatWhatsapp kembali ke format lokal", () => {
    expect(formatWhatsapp("6281234567781")).toBe("0812-3456-7781");
  });
});

describe("umur", () => {
  const today = day("2026-10-03");

  it("formatAge", () => {
    expect(formatAge(day("2023-08-03"), today)).toBe("3 th 2 bln");
    expect(formatAge(day("2023-08-04"), today)).toBe("3 th 1 bln");
    expect(formatAge(day("2026-05-03"), today)).toBe("5 bln");
    expect(formatAge(day("2026-09-20"), today)).toBe("< 1 bln");
    expect(formatAge(day("2024-10-03"), today)).toBe("2 th");
  });

  it("birthDateFromAge", () => {
    expect(birthDateFromAge(3, 2, today)).toEqual(day("2023-08-03"));
    expect(birthDateFromAge(0, 8, day("2026-10-31"))).toEqual(day("2026-02-28"));
  });
});

describe("nomor RM", () => {
  it("format dan urutan per tahun", () => {
    expect(formatRmNo(2026, 142)).toBe("RM-2026-00142");
    expect(nextRmNo(2026, null)).toBe("RM-2026-00001");
    expect(nextRmNo(2026, "RM-2026-00009")).toBe("RM-2026-00010");
    expect(nextRmNo(2026, "RM-2026-99999")).toBe("RM-2026-100000");
  });
});

describe("ownerSchema", () => {
  const valid = { name: "Rina", whatsapp: "0812-3456-7781", address: "Jl. A", notes: "" };

  it("menormalkan WhatsApp", () => {
    expect(ownerSchema.parse(valid).whatsapp).toBe("6281234567781");
  });

  it.each([
    ["nama kosong", { name: " " }],
    ["WA terlalu pendek", { whatsapp: "0812-33" }],
  ])("menolak %s", (_name, patch) => {
    expect(ownerSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });

  it("alamat boleh kosong", () => {
    expect(ownerSchema.safeParse({ ...valid, address: "" }).success).toBe(true);
  });
});

describe("patientSchema", () => {
  const valid: PatientInput = {
    name: "Mochi",
    species: "Kucing",
    breed: "",
    sex: "BETINA",
    birthDate: "",
    ageYears: null,
    ageMonths: null,
    microchip: "",
    color: "",
    neutered: true,
    lastWeightKg: 4.2,
    allergyNote: "Amoxicillin",
    aggressive: false,
    behaviorNote: "",
  };

  it("menerima data valid, menolak tanggal lahir di masa depan", () => {
    expect(patientSchema.safeParse(valid).success).toBe(true);
    expect(patientSchema.safeParse({ ...valid, birthDate: "2999-01-01" }).success).toBe(false);
  });

  it("normalizePatient: kosong jadi null, umur jadi tanggal lahir, berat dibulatkan 2 desimal", () => {
    const n = normalizePatient({ ...valid, ageYears: 3, ageMonths: 2, lastWeightKg: 4.2349 }, day("2026-10-03"));
    expect(n).toMatchObject({ breed: null, microchip: null, behaviorNote: null, lastWeightKg: 4.23 });
    expect(n.birthDate).toEqual(day("2023-08-03"));
  });

  it("tanggal lahir eksplisit menang atas umur", () => {
    const n = normalizePatient({ ...valid, birthDate: "2020-01-15", ageYears: 1, ageMonths: 0 });
    expect(n.birthDate).toEqual(day("2020-01-15"));
  });
});
