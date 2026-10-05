import { describe, expect, it } from "vitest";
import { groupCategories, ITEM_GROUPS } from "./item-groups";
import { PRODUCT_CATEGORIES, SERVICE_CATEGORIES } from "./item-schema";

describe("kelompok produk", () => {
  it("tanpa kelompok atau kelompok asing berarti semua", () => {
    expect(groupCategories(undefined)).toBeNull();
    expect(groupCategories("")).toBeNull();
    expect(groupCategories("ngawur")).toBeNull();
  });

  it("PetShop mencakup pakan, aksesoris, dan consumable", () => {
    expect(groupCategories("petshop")).toEqual(["pet food", "aksesoris", "consumable"]);
  });

  it("setiap kategori item masuk tepat satu kelompok (tidak ada yang hilang dari filter)", () => {
    for (const category of [...PRODUCT_CATEGORIES, ...SERVICE_CATEGORIES]) {
      expect(ITEM_GROUPS.filter((g) => (g.categories as readonly string[]).includes(category))).toHaveLength(1);
    }
  });
});
