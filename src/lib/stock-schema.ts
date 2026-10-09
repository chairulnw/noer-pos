import { z } from "zod";
import { unitPrice } from "@/lib/item-schema";

export const stockInSchema = z.object({
  itemId: z.guid({ error: "Pilih produk" }),
  qty: z.number({ error: "Isi dengan angka" }).gt(0, "Jumlah harus lebih dari 0").max(1_000_000, "Terlalu besar"),
  batchNo: z.string().trim().min(1, "No. batch wajib diisi").max(50, "Maksimal 50 karakter"),
  expiry: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "Tanggal tidak valid"),
  price: unitPrice,
  note: z.string().trim().max(300, "Maksimal 300 karakter"),
});

export type StockInInput = z.infer<typeof stockInSchema>;
