import { z } from "zod";

export const COST_CATEGORIES = ["Gaji", "Sewa", "Listrik & Air", "Internet", "Perawatan Alat", "Lainnya"] as const;

export const costSchema = z.object({
  name: z.string().trim().min(1, "Nama pengeluaran wajib diisi").max(150, "Maksimal 150 karakter"),
  amount: z.number({ error: "Isi dengan angka" }).int("Harus bilangan bulat").min(1, "Minimal Rp 1").max(1_000_000_000, "Terlalu besar"),
  category: z.enum(COST_CATEGORIES, { error: "Pilih kategori biaya" }),
  costDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid").refine((v) => !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()), "Tanggal tidak valid"),
  notes: z.string().trim().max(500, "Maksimal 500 karakter"),
});

export type CostInput = z.infer<typeof costSchema>;
