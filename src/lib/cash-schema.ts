import { z } from "zod";

const rupiah = (label: string) =>
  z.number({ error: `${label} harus berupa angka` }).int(`${label} harus bilangan bulat`).min(0, `${label} tidak boleh negatif`).max(1_000_000_000, `${label} terlalu besar`);

export const cashClosingSchema = z.object({
  openingCash: rupiah("Modal awal"),
  countedCash: rupiah("Hitung fisik"),
  note: z.string().trim().max(300, "Maksimal 300 karakter"),
});

export type CashClosingInput = z.infer<typeof cashClosingSchema>;

export function cashDifference({ openingCash, cashSales, countedCash }: { openingCash: number; cashSales: number; countedCash: number }) {
  const expected = openingCash + cashSales;
  return { expected, difference: countedCash - expected };
}

export const differenceLabel = (difference: number) => (difference === 0 ? "Sesuai" : difference > 0 ? "Lebih" : "Kurang");
