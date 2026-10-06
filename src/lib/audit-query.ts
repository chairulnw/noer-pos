import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export const AUDIT_PAGE_SIZE = 50;
const JAKARTA_OFFSET_MS = 7 * 3_600_000;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export type AuditFilter = { userId?: string; entity?: string; from?: string; to?: string; page?: string };

const jakartaDayStart = (ymd: string) => new Date(new Date(`${ymd}T00:00:00Z`).getTime() - JAKARTA_OFFSET_MS);

export function auditWhere({ userId, entity, from, to }: AuditFilter): Prisma.AuditLogWhereInput {
  const createdAt: Prisma.DateTimeFilter = {};
  if (from && DATE.test(from)) createdAt.gte = jakartaDayStart(from);
  if (to && DATE.test(to)) createdAt.lt = new Date(jakartaDayStart(to).getTime() + 24 * 3_600_000);
  return {
    ...(userId && { userId }),
    ...(entity && { entity }),
    ...((createdAt.gte || createdAt.lt) && { createdAt }),
  };
}

export async function listAudit(filter: AuditFilter) {
  const where = auditWhere(filter);
  const page = Math.max(1, Math.floor(Number(filter.page)) || 1);
  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * AUDIT_PAGE_SIZE,
      take: AUDIT_PAGE_SIZE,
      include: { user: { select: { name: true, username: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE)) };
}

export async function getAuditFilterOptions() {
  const [users, entities] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.auditLog.groupBy({ by: ["entity"], orderBy: { entity: "asc" } }),
  ]);
  return { users, entities: entities.map((e) => e.entity) };
}
