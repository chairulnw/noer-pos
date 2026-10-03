import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  auditValue,
  diffSettings,
  imageToDataUrl,
  settingsSchema,
} from "./settings-schema";

describe("settingsSchema", () => {
  it("menerima nilai default", () => {
    expect(settingsSchema.safeParse(DEFAULT_SETTINGS).success).toBe(true);
  });

  it.each([
    ["clinicName kosong", { clinicName: "  " }],
    ["PPN di atas 100", { taxRate: 101 }],
    ["PPN desimal (BR-1: tanpa float)", { taxRate: 11.5 }],
    ["lebar kertas selain 58/80", { paperWidth: 70 }],
    ["hari expired 0", { expiryWarningDays: 0 }],
    ["mode PPN tidak dikenal", { taxMode: "LAIN" }],
  ])("menolak %s", (_name, patch) => {
    expect(settingsSchema.safeParse({ ...DEFAULT_SETTINGS, ...patch }).success).toBe(false);
  });
});

describe("diffSettings", () => {
  it("kosong jika tidak ada perubahan", () => {
    expect(diffSettings(DEFAULT_SETTINGS, { ...DEFAULT_SETTINGS })).toEqual([]);
  });

  it("hanya melaporkan key yang berubah, lengkap dengan nilai sebelum/sesudah", () => {
    const next = { ...DEFAULT_SETTINGS, taxEnabled: true, taxRate: 12 };
    expect(diffSettings(DEFAULT_SETTINGS, next)).toEqual([
      { key: "taxEnabled", before: false, after: true },
      { key: "taxRate", before: 11, after: 12 },
    ]);
  });
});

describe("auditValue", () => {
  it("tidak membocorkan isi gambar ke audit log", () => {
    expect(auditValue("logo", "data:image/png;base64,AAAA")).toBe("(gambar diunggah)");
    expect(auditValue("qris", "")).toBe("(kosong)");
    expect(auditValue("clinicName", "NOER")).toBe("NOER");
  });
});

describe("imageToDataUrl", () => {
  const png = (bytes: number) => new File([new Uint8Array(bytes)], "x.png", { type: "image/png" });

  it("mengubah gambar valid jadi data URL", async () => {
    const result = await imageToDataUrl(png(10), 100);
    expect(result).toHaveProperty("dataUrl");
    expect((result as { dataUrl: string }).dataUrl.startsWith("data:image/png;base64,")).toBe(true);
  });

  it("menolak file melebihi batas ukuran", async () => {
    expect(await imageToDataUrl(png(101), 100)).toHaveProperty("error");
  });

  it("menolak format selain PNG/JPG/WebP (mis. SVG)", async () => {
    const svg = new File(["<svg/>"], "x.svg", { type: "image/svg+xml" });
    expect(await imageToDataUrl(svg, 100)).toHaveProperty("error");
  });
});
