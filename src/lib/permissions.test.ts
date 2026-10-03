import { describe, expect, it } from "vitest";
import { can, type Capability, type Role } from "./permissions";

// Transkrip SPEC bagian 5, sengaja terpisah dari MATRIX di permissions.ts
const EXPECTED: Record<Capability, Record<Role, boolean>> = {
  manage_users_settings: { ADMIN: true, DOKTER: false, KASIR: false },
  manage_service_price: { ADMIN: true, DOKTER: false, KASIR: false },
  view_service_price: { ADMIN: true, DOKTER: false, KASIR: true },
  manage_product_cost: { ADMIN: true, DOKTER: false, KASIR: false },
  manage_patients: { ADMIN: true, DOKTER: true, KASIR: true },
  create_visit: { ADMIN: true, DOKTER: true, KASIR: true },
  edit_medical_record: { ADMIN: true, DOKTER: true, KASIR: false },
  view_medical_record: { ADMIN: true, DOKTER: true, KASIR: false },
  manage_admission: { ADMIN: true, DOKTER: true, KASIR: true },
  monitor_admission: { ADMIN: true, DOKTER: true, KASIR: false },
  manage_rooms: { ADMIN: true, DOKTER: false, KASIR: false },
  manage_invoice_payment: { ADMIN: true, DOKTER: false, KASIR: true },
  apply_discount: { ADMIN: true, DOKTER: false, KASIR: true },
  void_invoice: { ADMIN: true, DOKTER: false, KASIR: false },
  manage_stock: { ADMIN: true, DOKTER: false, KASIR: false },
  view_revenue_reports: { ADMIN: true, DOKTER: false, KASIR: false },
  view_audit_log: { ADMIN: true, DOKTER: false, KASIR: false },
};

describe("permission matrix (SPEC bagian 5)", () => {
  for (const [capability, roles] of Object.entries(EXPECTED) as [Capability, Record<Role, boolean>][]) {
    for (const [role, expected] of Object.entries(roles) as [Role, boolean][]) {
      it(`${role} ${expected ? "bisa" : "tidak bisa"} ${capability}`, () => {
        expect(can(role, capability)).toBe(expected);
      });
    }
  }

  it("kasir tidak pernah mendapat capability harga beli/margin/omzet (BR-7)", () => {
    expect(can("KASIR", "manage_product_cost")).toBe(false);
    expect(can("KASIR", "view_revenue_reports")).toBe(false);
  });
});
