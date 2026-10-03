import type { Prisma } from "@/generated/prisma/client";

type AuditEntry = {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
};

// pakai tx dari $transaction agar audit atomik dengan perubahan datanya (BR-12)
export function logAudit(tx: Prisma.TransactionClient, entry: AuditEntry) {
  return tx.auditLog.create({ data: entry });
}
