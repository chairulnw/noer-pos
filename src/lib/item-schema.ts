import { z } from "zod";
import { can, type Capability, type Role } from "@/lib/permissions";

export const SERVICE_CATEGORIES = ["konsultasi", "tindakan", "operasi", "rawat inap", "hotel", "grooming"] as const;
// Kategori petshop mengikuti sheet pemilik toko; kelompok "ibu"-nya ada di item-groups.ts
export const PETSHOP_CATEGORIES = [
  "accessories",
  "dry food cat",
  "dry food dog",
  "kandang",
  "pasir gumpal",
  "pasir tofu",
  "pewangi/pembersih",
  "Royal canin vet",
  "shampoo",
  "susu cat",
  "treats cat",
  "wet food can/box",
  "wet food pouch",
] as const;
export const PETSHOP_MEDICINE_CATEGORIES = ["tetes kutu", "vitamin/obat"] as const;
export const PRODUCT_CATEGORIES = ["obat", "vaksin", "pet food", "aksesoris", ...PETSHOP_CATEGORIES, ...PETSHOP_MEDICINE_CATEGORIES] as const;

const number = (message = "Isi dengan angka") => z.number({ error: message });
const rupiah = number().int("Harus bilangan bulat").min(0, "Minimal 0").max(1_000_000_000, "Terlalu besar");

export const itemSchema = z
  .object({
    type: z.enum(["SERVICE", "PRODUCT"]),
    category: z.string(),
    subCategory: z.string().trim().max(50, "Maksimal 50 karakter"),
    name: z.string().trim().min(1, "Nama wajib diisi").max(150, "Maksimal 150 karakter"),
    sku: z.string().trim().max(50, "Maksimal 50 karakter"),
    barcode: z.string().trim().max(50, "Maksimal 50 karakter"),
    sellPrice: rupiah,
    buyPrice: rupiah,
    baseUnit: z.string().trim().min(1, "Satuan wajib diisi").max(30, "Maksimal 30 karakter"),
    purchaseUnit: z.string().trim().max(30, "Maksimal 30 karakter"),
    conversionFactor: number().gt(0, "Harus lebih dari 0").max(1_000_000, "Terlalu besar"),
    lowStockThreshold: number().min(0, "Minimal 0").nullable(),
    trackExpiry: z.boolean(),
    billingUnit: z.enum(["PER_ITEM", "PER_DAY"]),
    vaccineIntervalDays: number().int("Harus bilangan bulat").min(1, "Minimal 1 hari").max(3650, "Maksimal 3650 hari").nullable(),
    active: z.boolean(),
  })
  .superRefine((item, ctx) => {
    const allowed: readonly string[] = item.type === "SERVICE" ? SERVICE_CATEGORIES : PRODUCT_CATEGORIES;
    if (!allowed.includes(item.category)) {
      ctx.addIssue({ code: "custom", path: ["category"], message: "Pilih kategori yang sesuai jenis item" });
    }
  });

export type ItemInput = z.infer<typeof itemSchema>;

export function normalizeItem(v: ItemInput) {
  const isProduct = v.type === "PRODUCT";
  return {
    type: v.type,
    category: v.category,
    subCategory: v.subCategory || null,
    name: v.name,
    sku: v.sku || null,
    barcode: v.barcode || null,
    sellPrice: v.sellPrice,
    buyPrice: isProduct ? v.buyPrice : 0,
    baseUnit: v.baseUnit,
    purchaseUnit: isProduct && v.purchaseUnit ? v.purchaseUnit : null,
    conversionFactor: isProduct ? v.conversionFactor : 1,
    lowStockThreshold: isProduct ? v.lowStockThreshold : null,
    trackExpiry: isProduct && v.trackExpiry,
    billingUnit: isProduct ? ("PER_ITEM" as const) : v.billingUnit,
    vaccineIntervalDays: v.category === "vaksin" ? v.vaccineIntervalDays : null,
    active: v.active,
  };
}

export type NormalizedItem = ReturnType<typeof normalizeItem>;

export const capabilityFor = (type: ItemInput["type"]): Capability =>
  type === "SERVICE" ? "manage_service_price" : "manage_product_cost";

type Numeric = number | { toString(): string };
export type ItemRecord = Omit<NormalizedItem, "conversionFactor" | "lowStockThreshold"> & {
  id: string;
  conversionFactor: Numeric;
  lowStockThreshold: Numeric | null;
};

export type ItemView = Omit<NormalizedItem, "buyPrice"> & { id: string; buyPrice?: number };

// BR-7: Kasir/Dokter tidak pernah menerima `buyPrice`
export function toItemView(item: ItemRecord, role: Role): ItemView {
  const { buyPrice, ...rest } = item;
  const view = {
    ...rest,
    conversionFactor: Number(item.conversionFactor),
    lowStockThreshold: item.lowStockThreshold === null ? null : Number(item.lowStockThreshold),
  };
  return can(role, "manage_product_cost") ? { ...view, buyPrice } : view;
}
