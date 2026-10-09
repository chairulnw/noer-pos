import { describe, expect, it } from "vitest";
import { can, type Capability, type Role } from "./permissions";

// Transkrip SPEC bagian 5, sengaja terpisah dari MATRIX di permissions.ts.
// KARYAWAN = gabungan hak Dokter dan Kasir lama.
const EXPECTED: Record<Capability, Record<Role, boolean>> = {
  manage_users_settings: { ADMIN: true, KARYAWAN: false },
  manage_service_price: { ADMIN: true, KARYAWAN: false },
  view_service_price: { ADMIN: true, KARYAWAN: true },
  manage_product_cost: { ADMIN: true, KARYAWAN: false },
  manage_patients: { ADMIN: true, KARYAWAN: true },
  create_visit: { ADMIN: true, KARYAWAN: true },
  edit_medical_record: { ADMIN: true, KARYAWAN: true },
  view_medical_record: { ADMIN: true, KARYAWAN: true },
  manage_admission: { ADMIN: true, KARYAWAN: true },
  monitor_admission: { ADMIN: true, KARYAWAN: true },
  manage_rooms: { ADMIN: true, KARYAWAN: false },
  manage_invoice_payment: { ADMIN: true, KARYAWAN: true },
  apply_discount: { ADMIN: true, KARYAWAN: true },
  void_invoice: { ADMIN: true, KARYAWAN: false },
  correct_deposit: { ADMIN: true, KARYAWAN: false },
  manage_stock: { ADMIN: true, KARYAWAN: false },
  stock_opname: { ADMIN: true, KARYAWAN: true },
  view_revenue_reports: { ADMIN: true, KARYAWAN: false },
  view_audit_log: { ADMIN: true, KARYAWAN: false },
};

describe("permission matrix (SPEC bagian 5)", () => {
  for (const [capability, roles] of Object.entries(EXPECTED) as [Capability, Record<Role, boolean>][]) {
    for (const [role, expected] of Object.entries(roles) as [Role, boolean][]) {
      it(`${role} ${expected ? "bisa" : "tidak bisa"} ${capability}`, () => {
        expect(can(role, capability)).toBe(expected);
      });
    }
  }

  it("karyawan tidak pernah mendapat capability harga beli/margin/omzet (BR-7)", () => {
    expect(can("KARYAWAN", "manage_product_cost")).toBe(false);
    expect(can("KARYAWAN", "view_revenue_reports")).toBe(false);
  });
});
