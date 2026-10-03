import { expect, it } from "vitest";
import { auditWhere } from "./audit-query";

it("tanggal filter dibaca sebagai hari WIB, 'sampai' inklusif", () => {
  const where = auditWhere({ from: "2026-10-03", to: "2026-10-03" });
  expect(where.createdAt).toEqual({ gte: new Date("2026-10-02T17:00:00Z"), lt: new Date("2026-10-03T17:00:00Z") });
});

it("filter kosong atau tanggal rusak diabaikan", () => {
  expect(auditWhere({})).toEqual({});
  expect(auditWhere({ from: "kemarin", userId: "", entity: "invoice" })).toEqual({ entity: "invoice" });
});
