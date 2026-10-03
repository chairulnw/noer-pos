import { describe, expect, it } from "vitest";
import { billedDays, calendarDays, dateToJakartaLocal, jakartaLocalToDate, stayDay } from "./admission-calc";

const at = (local: string) => jakartaLocalToDate(local);

describe("hari kalender Jakarta", () => {
  it("selisih tanggal kalender, bukan 24 jam", () => {
    expect(calendarDays(at("2026-10-01T23:00"), at("2026-10-02T01:00"))).toBe(1);
    expect(calendarDays(at("2026-10-01T01:00"), at("2026-10-01T23:00"))).toBe(0);
    expect(calendarDays(at("2026-10-01T10:00"), at("2026-10-04T09:00"))).toBe(3);
  });

  it("batas hari mengikuti Jakarta (UTC+7), bukan UTC", () => {
    // 2026-10-02 00:30 WIB = 2026-10-01 17:30 UTC
    expect(calendarDays(at("2026-10-01T20:00"), at("2026-10-02T00:30"))).toBe(1);
  });

  it("melewati pergantian bulan dan tahun", () => {
    expect(calendarDays(at("2026-12-30T10:00"), at("2027-01-02T10:00"))).toBe(3);
    expect(calendarDays(at("2026-02-27T10:00"), at("2026-03-02T10:00"))).toBe(3);
  });
});

describe("billedDays (BR-15)", () => {
  it("minimal 1 hari, termasuk check-out di hari yang sama (kasus 0 -> 1)", () => {
    expect(billedDays(at("2026-10-01T08:00"), at("2026-10-01T20:00"))).toBe(1);
    expect(billedDays(at("2026-10-01T08:00"), at("2026-10-01T08:00"))).toBe(1);
  });

  it("menginap n malam = n hari", () => {
    expect(billedDays(at("2026-10-01T15:00"), at("2026-10-04T10:00"))).toBe(3);
  });
});

describe("stayDay", () => {
  it("hari check-in = hari ke-1", () => {
    expect(stayDay(at("2026-10-01T08:00"), at("2026-10-01T20:00"))).toBe(1);
    expect(stayDay(at("2026-10-01T08:00"), at("2026-10-03T07:00"))).toBe(3);
  });
});

describe("konversi input datetime-local", () => {
  it("bolak-balik zona Jakarta", () => {
    expect(at("2026-10-03T14:05").toISOString()).toBe("2026-10-03T07:05:00.000Z");
    expect(dateToJakartaLocal(new Date("2026-10-03T07:05:00.000Z"))).toBe("2026-10-03T14:05");
  });
});
