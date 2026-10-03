import { expect, it } from "vitest";
import { formatRupiah } from "./format";

it("memformat Rupiah dengan titik ribuan", () => {
  expect(formatRupiah(1250000)).toBe("Rp 1.250.000");
  expect(formatRupiah(0)).toBe("Rp 0");
  expect(formatRupiah(-12500)).toBe("-Rp 12.500");
});
