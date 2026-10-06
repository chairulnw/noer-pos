import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export function describeAgent(ua: string | null) {
  if (!ua) return "Perangkat tidak dikenal";
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser lain";
  const os = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "OS lain";
  return `${browser} · ${os}`;
}

export const listSessions = (includeEnded: boolean) =>
  prisma.userSession.findMany({
    where: includeEnded ? {} : { revokedAt: null, lastSeenAt: { gte: new Date(Date.now() - MAX_AGE_MS) } },
    select: { id: true, userAgent: true, ip: true, createdAt: true, lastSeenAt: true, revokedAt: true, user: { select: { id: true, name: true, username: true, role: true } } },
    orderBy: { lastSeenAt: "desc" },
    take: 200,
  });

export const isExpired = (lastSeenAt: Date) => Date.now() - lastSeenAt.getTime() > MAX_AGE_MS;

export async function revokeSessions(adminId: string, where: { id?: string; userId?: string }) {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.userSession.updateMany({ where: { ...where, revokedAt: null }, data: { revokedAt: new Date() } });
    if (count > 0) await logAudit(tx, { userId: adminId, action: "session.revoke", entity: "user_session", entityId: where.id ?? where.userId ?? "", after: { ...where, count } });
    return count;
  });
}
