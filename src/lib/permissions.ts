export type Role = "ADMIN" | "KARYAWAN";

export type Capability =
  | "manage_users_settings"
  | "manage_service_price"
  | "view_service_price"
  | "manage_product_cost"
  | "manage_patients"
  | "create_visit"
  | "edit_medical_record"
  | "view_medical_record"
  | "manage_admission"
  | "monitor_admission"
  | "manage_rooms"
  | "manage_invoice_payment"
  | "apply_discount"
  | "void_invoice"
  | "correct_deposit"
  | "manage_stock"
  | "stock_opname"
  | "view_revenue_reports"
  | "view_audit_log";

// KARYAWAN = gabungan hak Dokter dan Kasir lama
const MATRIX: Record<Capability, Role[]> = {
  manage_users_settings: ["ADMIN"],
  manage_service_price: ["ADMIN"],
  view_service_price: ["ADMIN", "KARYAWAN"],
  manage_product_cost: ["ADMIN"],
  manage_patients: ["ADMIN", "KARYAWAN"],
  create_visit: ["ADMIN", "KARYAWAN"],
  edit_medical_record: ["ADMIN", "KARYAWAN"],
  view_medical_record: ["ADMIN", "KARYAWAN"],
  manage_admission: ["ADMIN", "KARYAWAN"],
  monitor_admission: ["ADMIN", "KARYAWAN"],
  manage_rooms: ["ADMIN"],
  manage_invoice_payment: ["ADMIN", "KARYAWAN"],
  apply_discount: ["ADMIN", "KARYAWAN"],
  void_invoice: ["ADMIN"],
  correct_deposit: ["ADMIN"],
  manage_stock: ["ADMIN"],
  stock_opname: ["ADMIN", "KARYAWAN"],
  view_revenue_reports: ["ADMIN"],
  view_audit_log: ["ADMIN"],
};

export function can(role: Role, capability: Capability): boolean {
  return MATRIX[capability].includes(role);
}
