import { describe, expect, it } from "vitest";
import {
  ATTACHMENT_MAX_BYTES,
  addendumSchema,
  defaultNextDue,
  detectAttachment,
  isRecordEmpty,
  recordSchema,
  type RecordInput,
} from "./record-schema";

const empty: RecordInput = {
  subjective: "",
  objective: "",
  assessment: "",
  plan: "",
  diagnosis: "",
  vitals: { temp: null, hr: null, rr: null, weight: null, bcs: null, crt: null },
};

describe("recordSchema", () => {
  it("menerima catatan kosong dan vital lengkap", () => {
    expect(recordSchema.safeParse(empty).success).toBe(true);
    expect(recordSchema.safeParse({ ...empty, vitals: { temp: 39.6, hr: 180, rr: 32, weight: 4.2, bcs: 5, crt: 2 } }).success).toBe(true);
  });

  it.each([
    ["suhu 60", { temp: 60 }],
    ["BCS 10", { bcs: 10 }],
    ["BCS desimal", { bcs: 4.5 }],
    ["berat 0", { weight: 0 }],
    ["HR desimal", { hr: 120.5 }],
  ])("menolak %s", (_name, vitals) => {
    expect(recordSchema.safeParse({ ...empty, vitals: { ...empty.vitals, ...vitals } }).success).toBe(false);
  });

  it("isRecordEmpty", () => {
    expect(isRecordEmpty(empty)).toBe(true);
    expect(isRecordEmpty({ ...empty, plan: "kontrol" })).toBe(false);
  });
});

describe("addendumSchema", () => {
  it("menolak catatan kosong", () => {
    expect(addendumSchema.safeParse({ note: "  " }).success).toBe(false);
    expect(addendumSchema.safeParse({ note: "Alergi baru" }).success).toBe(true);
  });
});

describe("defaultNextDue", () => {
  it("tanggal pemberian + interval; null tanpa interval", () => {
    expect(defaultNextDue(new Date("2026-10-03T00:00:00Z"), 365)).toEqual(new Date("2027-10-03T00:00:00Z"));
    expect(defaultNextDue(new Date("2026-10-03T00:00:00Z"), 21)).toEqual(new Date("2026-10-24T00:00:00Z"));
    expect(defaultNextDue(new Date("2026-10-03T00:00:00Z"), null)).toBeNull();
  });
});

describe("detectAttachment", () => {
  const head = (...bytes: number[]) => Uint8Array.from([...bytes, 0, 0, 0, 0]);

  it("mengenali PDF, PNG, JPG dari isi file, bukan nama", () => {
    expect(detectAttachment(head(0x25, 0x50, 0x44, 0x46), 100)).toEqual({ mime: "application/pdf", ext: "pdf" });
    expect(detectAttachment(head(0x89, 0x50, 0x4e, 0x47), 100)).toEqual({ mime: "image/png", ext: "png" });
    expect(detectAttachment(head(0xff, 0xd8, 0xff, 0xe0), 100)).toEqual({ mime: "image/jpeg", ext: "jpg" });
  });

  it("menolak file lain (mis. HTML/EXE menyamar), kosong, dan di atas 10 MB", () => {
    expect(detectAttachment(head(0x3c, 0x68, 0x74, 0x6d), 100)).toHaveProperty("error");
    expect(detectAttachment(head(0x4d, 0x5a), 100)).toHaveProperty("error");
    expect(detectAttachment(head(0x25, 0x50, 0x44, 0x46), 0)).toHaveProperty("error");
    expect(detectAttachment(head(0x25, 0x50, 0x44, 0x46), ATTACHMENT_MAX_BYTES + 1)).toHaveProperty("error");
    expect(detectAttachment(head(0x25, 0x50, 0x44, 0x46), ATTACHMENT_MAX_BYTES)).toHaveProperty("mime");
  });
});
