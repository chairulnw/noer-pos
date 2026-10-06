import { listInvoices } from "@/lib/invoices";
import { pageItems } from "@/lib/items";
import { can, type Role } from "@/lib/permissions";
import { pageOwners, pagePatients } from "@/lib/patients";

const LIMIT = 5;

export async function globalSearch(role: Role, q: string) {
  const [patients, owners, invoices, items] = await Promise.all([
    can(role, "manage_patients") ? pagePatients(q, 0, LIMIT) : null,
    can(role, "manage_patients") ? pageOwners(q, 0, LIMIT) : null,
    can(role, "manage_invoice_payment") ? listInvoices({ q, includePaid: true }, 0, LIMIT) : null,
    can(role, "manage_stock") ? pageItems(role, { q, skip: 0, take: LIMIT }) : null,
  ]);
  return { patients, owners, invoices, items };
}
