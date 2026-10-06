export type Role = "ADMIN" | "DOKTER" | "KASIR";

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
  | "view_revenue_reports"
  | "view_audit_log";

const MATRIX: Record<Capability, Role[]> = {
  manage_users_settings: ["ADMIN"],
  manage_service_price: ["ADMIN"],
  view_service_price: ["ADMIN", "KASIR"],
  manage_product_cost: ["ADMIN"],
  manage_patients: ["ADMIN", "DOKTER", "KASIR"],
  create_visit: ["ADMIN", "DOKTER", "KASIR"],
  edit_medical_record: ["ADMIN", "DOKTER"],
  view_medical_record: ["ADMIN", "DOKTER"],
  manage_admission: ["ADMIN", "DOKTER", "KASIR"],
  monitor_admission: ["ADMIN", "DOKTER"],
  manage_rooms: ["ADMIN"],
  manage_invoice_payment: ["ADMIN", "KASIR"],
  apply_discount: ["ADMIN", "KASIR"],
  void_invoice: ["ADMIN"],
  correct_deposit: ["ADMIN"],
  manage_stock: ["ADMIN"],
  view_revenue_reports: ["ADMIN"],
  view_audit_log: ["ADMIN"],
};

export function can(role: Role, capability: Capability): boolean {
  return MATRIX[capability].includes(role);
}
