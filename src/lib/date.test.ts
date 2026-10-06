import { describe, expect, it } from "vitest";
import { periodToRange } from "./date";

describe("periodToRange", () => {
  const today = new Date("2026-03-10T00:00:00Z");
  it("preset menjadi rentang tanggal", () => {
    expect(periodToRange("hari-ini", today)).toEqual({ period: "hari-ini", from: "2026-03-10", to: "2026-03-10" });
    expect(periodToRange("7-hari", today)).toEqual({ period: "7-hari", from: "2026-03-04", to: "2026-03-10" });
    expect(periodToRange("bulan-ini", today)).toEqual({ period: "bulan-ini", from: "2026-03-01", to: "2026-03-10" });
    expect(periodToRange("bulan-lalu", today)).toEqual({ period: "bulan-lalu", from: "2026-02-01", to: "2026-02-28" });
  });
  it("nilai tak dikenal berarti semua waktu", () => {
    expect(periodToRange("x", today)).toEqual({ period: "" });
    expect(periodToRange(undefined, today)).toEqual({ period: "" });
  });
});
