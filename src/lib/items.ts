import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import type { Role } from "@/lib/permissions";
import { todayJakarta } from "@/lib/date";
import { groupCategories } from "@/lib/item-groups";
import { normalizeItem, toItemView, type ItemInput } from "@/lib/item-schema";
import { getSettings } from "@/lib/settings";
import { stockStatus } from "@/lib/stock";

const SELECT = {
  id: true,
  type: true,
  category: true,
  subCategory: true,
  sku: true,
  barcode: true,
  name: true,
  sellPrice: true,
  buyPrice: true,
  baseUnit: true,
  purchaseUnit: true,
  conversionFactor: true,
  lowStockThreshold: true,
  trackExpiry: true,
  billingUnit: true,
  vaccineIntervalDays: true,
  active: true,
} satisfies Prisma.ItemSelect;

export async function listItems(role: Role, filter: { q?: string; type?: "SERVICE" | "PRODUCT" } = {}) {
  const { q, type } = filter;
  const rows = await prisma.item.findMany({
    where: {
      deletedAt: null,
      ...(type && { type }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } }, { subCategory: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
          { barcode: { contains: q } },
        ],
      }),
    },
    select: SELECT,
    orderBy: [{ type: "asc" }, { category: "asc" }, { name: "asc" }],
  });
  return rows.map((row) => toItemView(row, role));
}

export async function pageItems(role: Role, { q, group, skip, take, orderBy }: { q?: string; group?: string; skip: number; take: number; orderBy?: Prisma.ItemOrderByWithRelationInput | Prisma.ItemOrderByWithRelationInput[] }) {
  const categories = groupCategories(group);
  const where: Prisma.ItemWhereInput = {
    deletedAt: null,
    ...(categories && { category: { in: categories } }),
    ...(q && { OR: [{ name: { contains: q, mode: "insensitive" } }, { subCategory: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }, { barcode: { contains: q } }] }),
  };
  const [rows, total, settings] = await Promise.all([
    prisma.item.findMany({ where, select: SELECT, orderBy: orderBy ?? [{ type: "asc" }, { category: "asc" }, { name: "asc" }], skip, take }),
    prisma.item.count({ where }),
    getSettings(),
  ]);
  const productIds = rows.filter((r) => r.type === "PRODUCT").map((r) => r.id);
  const batches = productIds.length ? await prisma.stockBatch.findMany({ where: { itemId: { in: productIds } }, select: { itemId: true, expiryDate: true, qtyOnHand: true } }) : [];
  const today = todayJakarta();

  return {
    total,
    rows: rows.map((row) => {
      const view = toItemView(row, role);
      if (row.type !== "PRODUCT") return { ...view, stock: null };
      const own = batches.filter((b) => b.itemId === row.id).map((b) => ({ expiry: b.expiryDate, qty: Number(b.qtyOnHand) }));
      return { ...view, stock: stockStatus(own, view.lowStockThreshold, today, settings.expiryWarningDays) };
    }),
  };
}

export async function getItem(id: string, role: Role) {
  const row = await prisma.item.findFirst({ where: { id, deletedAt: null }, select: SELECT });
  return row ? toItemView(row, role) : null;
}

const pick = <T extends object>(obj: T, keys: (keyof T)[]) => Object.fromEntries(keys.map((key) => [key, obj[key]]));

export async function saveItem(userId: string, id: string | null, input: ItemInput) {
  const data = normalizeItem(input);

  try {
    return await prisma.$transaction(async (tx) => {
      if (id === null) {
        const created = await tx.item.create({ data, select: { id: true } });
        await logAudit(tx, { userId, action: "item.create", entity: "item", entityId: created.id, after: data });
        return { id: created.id };
      }

      const row = await tx.item.findFirst({ where: { id, deletedAt: null }, select: SELECT });
      if (!row) return { error: "Item tidak ditemukan." };
      if (row.type !== data.type) return { error: "Jenis item tidak bisa diubah." };

      const before = toItemView(row, "ADMIN");
      const changed = (Object.keys(data) as (keyof typeof data)[]).filter((key) => before[key] !== data[key]);
      if (changed.length === 0) return { id };

      await tx.item.update({ where: { id }, data });
      await logAudit(tx, {
        userId,
        action: "item.update",
        entity: "item",
        entityId: id,
        before: pick(before, changed) as Prisma.InputJsonObject,
        after: pick(data, changed) as Prisma.InputJsonObject,
      });
      return { id };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "SKU atau barcode sudah dipakai item lain." };
    }
    throw error;
  }
}
