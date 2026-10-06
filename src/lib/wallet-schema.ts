import { z } from "zod";

const rupiah = z.number({ error: "Isi dengan angka" }).int("Harus bilangan bulat");

export const topUpSchema = z.object({
  ownerId: z.guid({ error: "Pilih pemilik" }),
  amount: rupiah.min(1, "Minimal Rp 1").max(1_000_000_000, "Terlalu besar"),
  method: z.enum(["TUNAI", "QRIS", "TRANSFER", "KARTU"], { error: "Pilih metode pembayaran" }),
  note: z.string().trim().max(200, "Maksimal 200 karakter"),
});

export const adjustSchema = z.object({
  ownerId: z.guid({ error: "Pilih pemilik" }),
  delta: rupiah.refine((v) => v !== 0, "Selisih tidak boleh nol").refine((v) => Math.abs(v) <= 1_000_000_000, "Terlalu besar"),
  reason: z.string().trim().min(3, "Alasan koreksi wajib diisi (minimal 3 karakter)").max(300, "Maksimal 300 karakter"),
});

export type TopUpInput = z.infer<typeof topUpSchema>;
export type AdjustInput = z.infer<typeof adjustSchema>;

export const WALLET_TYPE = { TOPUP: "Top-up", PAYMENT: "Pemakaian", RETURN: "Pengembalian (pembatalan)", ADJUST: "Koreksi" } as const;
