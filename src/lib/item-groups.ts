export const ITEM_GROUPS = [
  { value: "", label: "Semua Tipe", categories: [] as string[] },
  { value: "petshop", label: "PetShop", categories: ["pet food", "aksesoris"] },
  { value: "obat", label: "Obat & Resep", categories: ["obat"] },
  { value: "vaksin", label: "Vaksin", categories: ["vaksin"] },
  { value: "konsultasi", label: "Konsultasi", categories: ["konsultasi"] },
  { value: "tindakan", label: "Tindakan", categories: ["tindakan"] },
  { value: "operasi", label: "Operasi", categories: ["operasi"] },
  { value: "rawat-inap", label: "Rawat Inap", categories: ["rawat inap"] },
  { value: "hotel", label: "Pet Hotel", categories: ["hotel"] },
  { value: "grooming", label: "Grooming", categories: ["grooming"] },
] as const;

export const groupCategories = (value: string | undefined): string[] | null => {
  const group = ITEM_GROUPS.find((g) => g.value === value);
  return group && group.value ? [...group.categories] : null;
};
