import { describe, expect, it } from "vitest";
import { breedSchema, breedsOf, speciesSchema } from "./animal-schema";

describe("master hewan", () => {
  it("nama wajib dan dirapikan", () => {
    expect(speciesSchema.parse({ name: "  Kucing ", active: true }).name).toBe("Kucing");
    expect(speciesSchema.safeParse({ name: " ", active: true }).success).toBe(false);
    expect(speciesSchema.safeParse({ name: "x".repeat(51), active: true }).success).toBe(false);
  });

  it("ras harus terhubung ke jenis hewan (guid)", () => {
    expect(breedSchema.safeParse({ speciesId: "11111111-1111-1111-1111-111111111111", name: "Persia", active: true }).success).toBe(true);
    expect(breedSchema.safeParse({ speciesId: "", name: "Persia", active: true }).success).toBe(false);
  });

  it("breedsOf menyaring ras per jenis tanpa beda huruf", () => {
    const breeds = [{ species: "Kucing", name: "Persia" }, { species: "Anjing", name: "Husky" }, { species: "Kucing", name: "Siam" }];
    expect(breedsOf(breeds, "kucing")).toEqual(["Persia", "Siam"]);
    expect(breedsOf(breeds, " Anjing ")).toEqual(["Husky"]);
    expect(breedsOf(breeds, "Ikan")).toEqual([]);
  });
});
