import { prisma } from "@/lib/db";
import { todayJakarta } from "@/lib/date";
import { formatDate } from "@/lib/format";
import { getStockAlerts } from "@/lib/inventory";
import { can, type Role } from "@/lib/permissions";
import { listDueVaccinations } from "@/lib/records";

export type Notice = { key: string; title: string; detail: string; href: string; tone: "danger" | "warning" | "info" };

export async function collectNotices(role: Role): Promise<Notice[]> {
  const [stock, due] = await Promise.all([
    can(role, "manage_stock") ? getStockAlerts() : null,
    can(role, "view_medical_record") ? listDueVaccinations(7) : [],
  ]);
  const notices: Notice[] = [];

  for (const l of stock?.low ?? []) {
    notices.push({ key: `stok-menipis:${l.id}`, title: l.usable === 0 ? `Stok habis: ${l.name}` : `Stok menipis: ${l.name}`, detail: `Sisa ${l.usable.toLocaleString("id-ID")} ${l.unit}, batas minimum ${l.threshold.toLocaleString("id-ID")}`, href: `/inventaris/${l.id}`, tone: l.usable === 0 ? "danger" : "warning" });
  }
  for (const e of stock?.expiring ?? []) {
    notices.push({ key: `expired:${e.id}:${e.batchNo}`, title: `${e.level === "EXPIRED" ? "Sudah expired" : "Hampir expired"}: ${e.name}`, detail: `Batch ${e.batchNo}, ${formatDate(e.expiry)}, ${e.qty.toLocaleString("id-ID")} ${e.unit}`, href: `/inventaris/${e.id}`, tone: e.level === "EXPIRED" ? "danger" : "warning" });
  }
  const now = todayJakarta().getTime();
  for (const d of due) {
    const patient = d.record.visit.patient;
    notices.push({ key: `vaksin:${d.id}`, title: `Vaksin ulang ${patient.name}`, detail: `${d.item.name}, jatuh tempo ${formatDate(d.nextDue!)} · Pemilik ${patient.owner.name}`, href: "/vaksin?tampilan=jatuh-tempo", tone: d.nextDue!.getTime() < now ? "danger" : "info" });
  }
  return notices;
}

const NOTICE_TTL_MS = 60_000;
const noticeCache = new Map<Role, { at: number; value: Promise<Notice[]> }>();

// ponytail: cache per proses untuk badge sidebar (maks 60 detik basi), pakai cache bersama jika multi-instance
function cachedNotices(role: Role) {
  const hit = noticeCache.get(role);
  if (hit && Date.now() - hit.at < NOTICE_TTL_MS) return hit.value;
  const value = collectNotices(role);
  noticeCache.set(role, { at: Date.now(), value });
  value.catch(() => noticeCache.delete(role));
  return value;
}

export async function listNotices(userId: string, role: Role, notices: Promise<Notice[]> = collectNotices(role)) {
  const [list, reads] = await Promise.all([notices, prisma.notificationRead.findMany({ where: { userId }, select: { key: true } })]);
  const read = new Set(reads.map((r) => r.key));
  return list.map((n) => ({ ...n, unread: !read.has(n.key) }));
}

export async function unreadCount(userId: string, role: Role) {
  return (await listNotices(userId, role, cachedNotices(role))).filter((n) => n.unread).length;
}

export async function markAllRead(userId: string, role: Role) {
  const notices = await collectNotices(role);
  if (notices.length === 0) return 0;
  const { count } = await prisma.notificationRead.createMany({ data: notices.map((n) => ({ userId, key: n.key })), skipDuplicates: true });
  return count;
}
