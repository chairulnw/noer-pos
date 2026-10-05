import { describe, expect, it } from "vitest";
import { appendPick, MAX_PICKS, parsePicks } from "./quick-picks";

describe("parsePicks", () => {
  it("satu pilihan per baris, rapikan spasi, buang kosong dan duplikat (tanpa beda huruf)", () => {
    expect(parsePicks(" Muntah \n\nDiare\nmuntah\n  \nLesu")).toEqual(["Muntah", "Diare", "Lesu"]);
  });

  it("dibatasi jumlah dan panjang", () => {
    const many = Array.from({ length: 30 }, (_, i) => `Item ${i}`).join("\n");
    expect(parsePicks(many)).toHaveLength(MAX_PICKS);
    expect(parsePicks("x".repeat(200))[0]).toHaveLength(80);
  });
});

describe("appendPick", () => {
  it("kolom kosong diisi pilihan", () => {
    expect(appendPick("", "Muntah")).toBe("Muntah");
    expect(appendPick("  \n", "Muntah")).toBe("Muntah");
  });

  it("ditambahkan di belakang teks yang sudah ada dengan koma", () => {
    expect(appendPick("Muntah", "Diare")).toBe("Muntah, Diare");
    expect(appendPick("Lesu sejak kemarin.  ", "Demam")).toBe("Lesu sejak kemarin., Demam");
  });

  it("pilihan yang sudah ada tidak ditambahkan dua kali", () => {
    expect(appendPick("Muntah, Diare", "diare")).toBe("Muntah, Diare");
    expect(appendPick("Diare\nMuntah", "Muntah")).toBe("Diare\nMuntah");
  });
});
