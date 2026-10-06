import { describe, expect, it } from "vitest";
import { buildHref, pageRange, parsePaging } from "./paging";

describe("parsePaging", () => {
  it("default halaman 1 dan 10 baris", () => {
    expect(parsePaging({})).toEqual({ page: 1, size: 10, skip: 0, take: 10 });
  });

  it("ukuran hanya 10/25/50 dan halaman minimal 1", () => {
    expect(parsePaging({ baris: "25", hal: "3" })).toEqual({ page: 3, size: 25, skip: 50, take: 25 });
    expect(parsePaging({ baris: "999", hal: "-4" })).toEqual({ page: 1, size: 10, skip: 0, take: 10 });
    expect(parsePaging({ hal: "abc" }).page).toBe(1);
  });
});

describe("pageRange", () => {
  it("menampilkan a - b dari n", () => {
    expect(pageRange(0, 1, 10)).toEqual({ from: 0, to: 0, pages: 1 });
    expect(pageRange(1, 1, 10)).toEqual({ from: 1, to: 1, pages: 1 });
    expect(pageRange(23, 3, 10)).toEqual({ from: 21, to: 23, pages: 3 });
    expect(pageRange(23, 1, 10)).toEqual({ from: 1, to: 10, pages: 3 });
  });
});

describe("buildHref", () => {
  it("gabung parameter, buang yang kosong", () => {
    expect(buildHref("/x", { q: "kucing", hal: "2" }, { hal: "3", baris: "" })).toBe("/x?q=kucing&hal=3");
    expect(buildHref("/x", {})).toBe("/x");
  });
});

describe("sort", () => {
  it("parseSort hanya menerima kunci yang diizinkan", async () => {
    const { parseSort } = await import("./paging");
    const sorts = { nama: (d: "asc" | "desc") => ({ name: d }) };
    expect(parseSort({ urut: "nama", arah: "desc" }, sorts)).toMatchObject({ key: "nama", dir: "desc", orderBy: { name: "desc" } });
    expect(parseSort({ urut: "constructor" }, sorts)).toMatchObject({ key: undefined, orderBy: undefined });
  });
  it("sortRows mengurutkan angka dan teks, null di akhir", async () => {
    const { sortRows } = await import("./paging");
    const rows = [{ n: 3, s: "b" }, { n: null, s: "a" }, { n: 1, s: "c" }];
    expect(sortRows(rows, "n", "asc", { n: (r) => r.n }).map((r) => r.n)).toEqual([1, 3, null]);
    expect(sortRows(rows, "s", "desc", { s: (r) => r.s }).map((r) => r.s)).toEqual(["c", "b", "a"]);
  });
});
