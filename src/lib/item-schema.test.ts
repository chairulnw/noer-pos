import { describe, expect, it } from "vitest";
import { itemSchema, normalizeItem, toItemView, type ItemInput, type ItemRecord } from "./item-schema";

const product: ItemInput = {
  type: "PRODUCT",
  category: "obat",
  subCategory: "",
  name: "Amoxicillin 100mg",
  sku: " OBT-1 ",
  barcode: "",
  sellPrice: 2000,
  buyPrice: 1200,
  baseUnit: "tablet",
  purchaseUnit: "box",
  conversionFactor: 100,
  lowStockThreshold: 50,
  trackExpiry: true,
  billingUnit: "PER_ITEM",
  vaccineIntervalDays: null,
  active: true,
};

const service: ItemInput = {
  ...product,
  type: "SERVICE",
  category: "hotel",
  name: "Pet Hotel",
  buyPrice: 999,
  purchaseUnit: "box",
  conversionFactor: 5,
  lowStockThreshold: 3,
  trackExpiry: true,
  billingUnit: "PER_DAY",
};

describe("itemSchema", () => {
  it("menerima produk dan layanan yang valid", () => {
    expect(itemSchema.safeParse(product).success).toBe(true);
    expect(itemSchema.safeParse(service).success).toBe(true);
  });

  it.each([
    ["kategori tidak cocok dengan jenis", { category: "hotel" }],
    ["harga jual lebih dari 3 desimal", { sellPrice: 1999.5555 }],
    ["harga jual negatif", { sellPrice: -1 }],
    ["faktor konversi 0", { conversionFactor: 0 }],
    ["nama kosong", { name: "  " }],
    ["satuan dasar kosong", { baseUnit: "" }],
  ])("menolak %s", (_name, patch) => {
    expect(itemSchema.safeParse({ ...product, ...patch }).success).toBe(false);
  });
});

describe("normalizeItem", () => {
  it("mengosongkan field stok/harga beli untuk layanan", () => {
    expect(normalizeItem(service)).toMatchObject({
      buyPrice: 0,
      purchaseUnit: null,
      conversionFactor: 1,
      lowStockThreshold: null,
      trackExpiry: false,
      billingUnit: "PER_DAY",
    });
  });

  it("produk selalu PER_ITEM dan SKU/barcode kosong jadi null", () => {
    const n = normalizeItem({ ...product, billingUnit: "PER_DAY", sku: "", barcode: "" });
    expect(n).toMatchObject({ billingUnit: "PER_ITEM", sku: null, barcode: null, buyPrice: 1200, trackExpiry: true });
  });

  it("interval vaksin hanya disimpan untuk kategori vaksin", () => {
    expect(normalizeItem({ ...product, vaccineIntervalDays: 365 }).vaccineIntervalDays).toBeNull();
    expect(normalizeItem({ ...product, category: "vaksin", vaccineIntervalDays: 365 }).vaccineIntervalDays).toBe(365);
  });
});

describe("toItemView (BR-7)", () => {
  const record: ItemRecord = {
    ...normalizeItem(product),
    id: "i1",
    conversionFactor: { toString: () => "100.000" },
    lowStockThreshold: { toString: () => "50.000" },
  };

  it("Admin menerima harga beli", () => {
    expect(toItemView(record, "ADMIN").buyPrice).toBe(1200);
  });

  it.each(["KARYAWAN"] as const)("%s tidak menerima field buyPrice sama sekali", (role) => {
    const view = toItemView(record, role);
    expect("buyPrice" in view).toBe(false);
    expect(JSON.stringify(view)).not.toContain("1200");
  });

  it("mengubah Decimal jadi number biasa", () => {
    expect(toItemView(record, "KARYAWAN")).toMatchObject({ conversionFactor: 100, lowStockThreshold: 50, sellPrice: 2000 });
  });
});

describe("harga satuan berpecahan", () => {
  it("menerima sampai 3 desimal, menolak lebih", () => {
    expect(itemSchema.safeParse({ ...product, sellPrice: 53.328, buyPrice: 17.776 }).success).toBe(true);
    expect(itemSchema.safeParse({ ...product, sellPrice: 1545.3 }).success).toBe(true);
    expect(itemSchema.safeParse({ ...product, sellPrice: 53.3281 }).success).toBe(false);
    expect(itemSchema.safeParse({ ...product, sellPrice: -1 }).success).toBe(false);
  });

  it("toItemView mengubah Decimal dari database menjadi number", () => {
    const record = { ...normalizeItem(product), id: "1", sellPrice: { toString: () => "53.328" }, buyPrice: { toString: () => "17.776" } } as unknown as ItemRecord;
    expect(toItemView(record, "ADMIN")).toMatchObject({ sellPrice: 53.328, buyPrice: 17.776 });
    expect(toItemView(record, "KARYAWAN")).toMatchObject({ sellPrice: 53.328 });
    expect(toItemView(record, "KARYAWAN")).not.toHaveProperty("buyPrice");
  });
});
