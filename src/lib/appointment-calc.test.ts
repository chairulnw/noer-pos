import { describe, expect, it } from "vitest";
import { addDays, appointmentSchema, dayWindow, isClose, isNoShow, jakartaYmd, monthGrid, parseMonth, parseYmd, shiftMonth } from "./appointment-calc";

const ok = { doctorId: "11111111-1111-1111-1111-111111111111", scheduledAt: "2026-10-07T09:30", purpose: "Vaksin", notes: "" };

describe("appointmentSchema", () => {
  it("menerima isian lengkap dan menolak keperluan kosong atau waktu rusak", () => {
    expect(appointmentSchema.safeParse(ok).success).toBe(true);
    expect(appointmentSchema.safeParse({ ...ok, purpose: "  " }).success).toBe(false);
    expect(appointmentSchema.safeParse({ ...ok, scheduledAt: "besok" }).success).toBe(false);
    expect(appointmentSchema.safeParse({ ...ok, doctorId: "x" }).success).toBe(false);
  });
});

describe("hari WIB", () => {
  it("dayWindow memakai batas tengah malam WIB", () => {
    const { start, end } = dayWindow("2026-10-07");
    expect(start.toISOString()).toBe("2026-10-06T17:00:00.000Z");
    expect(end.toISOString()).toBe("2026-10-07T17:00:00.000Z");
  });

  it("jakartaYmd: 17:30 UTC sudah hari berikutnya di WIB", () => {
    expect(jakartaYmd(new Date("2026-10-06T16:59:00Z"))).toBe("2026-10-06");
    expect(jakartaYmd(new Date("2026-10-06T17:30:00Z"))).toBe("2026-10-07");
  });

  it("parseYmd menolak tanggal rusak, addDays lintas bulan", () => {
    expect(parseYmd("2026-10-07")).toBe("2026-10-07");
    expect(parseYmd("2026-13-40")).toBeNull();
    expect(parseYmd("abc")).toBeNull();
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
  });
});

describe("bentrok dan tidak datang", () => {
  it("bentrok bila selisih kurang dari 30 menit", () => {
    const t = new Date("2026-10-07T02:00:00Z");
    expect(isClose(t, new Date("2026-10-07T02:29:00Z"))).toBe(true);
    expect(isClose(t, new Date("2026-10-07T02:30:00Z"))).toBe(false);
    expect(isClose(t, new Date("2026-10-07T01:31:00Z"))).toBe(true);
  });

  it("tidak datang: hanya TERJADWAL pada hari yang sudah lewat", () => {
    const past = new Date("2026-10-05T03:00:00Z");
    expect(isNoShow("TERJADWAL", past, "2026-10-06")).toBe(true);
    expect(isNoShow("TERJADWAL", past, "2026-10-05")).toBe(false);
    expect(isNoShow("SELESAI", past, "2026-10-06")).toBe(false);
    expect(isNoShow("BATAL", past, "2026-10-06")).toBe(false);
  });
});

describe("kalender bulanan", () => {
  it("Oktober 2026 mulai Kamis: 5 minggu, Senin pertama, hari luar bulan ditandai", () => {
    const grid = monthGrid("2026-10");
    expect(grid).toHaveLength(5);
    expect(grid[0][0]).toEqual({ ymd: "2026-09-28", inMonth: false });
    expect(grid[0][3]).toEqual({ ymd: "2026-10-01", inMonth: true });
    expect(grid[4][6].ymd).toBe("2026-11-01");
    expect(grid.flat().filter((d) => d.inMonth)).toHaveLength(31);
  });

  it("bulan yang mulai Senin tanpa hari pembuka (Juni 2026)", () => {
    const grid = monthGrid("2026-06");
    expect(grid[0][0]).toEqual({ ymd: "2026-06-01", inMonth: true });
  });

  it("shiftMonth dan parseMonth", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(parseMonth("2026-13", "2026-10-06")).toBe("2026-10");
    expect(parseMonth("2026-03", "2026-10-06")).toBe("2026-03");
  });
});
