import { z } from "zod";

export const stockInSchema = z.object({
  itemId: z.uuid({ error: "Pilih produk" }),
  qty: z.number({ error: "Isi dengan angka" }).gt(0, "Jumlah harus lebih dari 0").max(1_000_000, "Terlalu besar"),
  batchNo: z.string().trim().min(1, "No. batch wajib diisi").max(50, "Maksimal 50 karakter"),
  expiry: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "Tanggal tidak valid"),
  price: z.number({ error: "Isi dengan angka" }).int("Harus bilangan bulat").min(0, "Minimal 0").max(1_000_000_000, "Terlalu besar"),
  note: z.string().trim().max(300, "Maksimal 300 karakter"),
});

export type StockInInput = z.infer<typeof stockInSchema>;
