import { describe, expect, it } from "vitest";
import { checkInSchema, logSchema } from "./admission-schema";

const log = { loggedAt: "2026-10-03T08:00", temp: 38.54, intake: "Makan 1/2 porsi, minum cukup", note: "" };

describe("logSchema", () => {
  it("menerima log lengkap dan membulatkan suhu ke 1 desimal", () => {
    expect(logSchema.parse(log).temp).toBe(38.5);
  });

  it("boleh hanya salah satu isian", () => {
    expect(logSchema.safeParse({ ...log, temp: null, intake: "", note: "Tenang" }).success).toBe(true);
    expect(logSchema.safeParse({ ...log, intake: "", temp: 39 }).success).toBe(true);
  });

  it.each([
    ["semua kosong", { temp: null, intake: "", note: "" }],
    ["suhu 50", { temp: 50 }],
    ["suhu 20", { temp: 20 }],
    ["waktu tidak valid", { loggedAt: "kemarin" }],
  ])("menolak %s", (_name, patch) => {
    expect(logSchema.safeParse({ ...log, ...patch }).success).toBe(false);
  });
});

describe("checkInSchema", () => {
  const base = {
    patientId: "6761ad44-e35c-423e-80ce-83d4108917e1",
    type: "RAWAT_INAP",
    roomId: "74cfd265-af3a-45d5-9b48-64949303e613",
    rateItemId: "5aa86703-47ba-47e9-9551-e82be304fc3b",
    checkIn: "2026-10-03T14:05",
    visitId: "",
    notes: "",
  };

  it("menerima isian valid dan menolak jenis atau waktu tak dikenal", () => {
    expect(checkInSchema.safeParse(base).success).toBe(true);
    expect(checkInSchema.safeParse({ ...base, type: "SPA" }).success).toBe(false);
    expect(checkInSchema.safeParse({ ...base, checkIn: "03/10/2026" }).success).toBe(false);
  });
});
