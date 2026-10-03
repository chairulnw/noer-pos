import { expect, it } from "vitest";
import { formatDate, formatRupiah } from "./format";

it("memformat Rupiah dengan titik ribuan", () => {
  expect(formatRupiah(1250000)).toBe("Rp 1.250.000");
  expect(formatRupiah(0)).toBe("Rp 0");
  expect(formatRupiah(-12500)).toBe("-Rp 12.500");
});

it("memformat tanggal DD MMM YYYY dalam zona Jakarta", () => {
  expect(formatDate(new Date("2026-10-03T00:00:00Z"))).toBe("03 Okt 2026");
});
