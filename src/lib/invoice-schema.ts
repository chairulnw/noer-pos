import { z } from "zod";

const intValue = z.number({ error: "Isi dengan angka" }).int("Harus bilangan bulat").min(0, "Minimal 0").max(1_000_000_000, "Terlalu besar");

export const discountSchema = z
  .object({ type: z.enum(["PERCENT", "AMOUNT"]).nullable(), value: intValue })
  .refine((d) => d.type !== "PERCENT" || d.value <= 100, { message: "Persen maksimal 100", path: ["value"] })
  .transform((d) => (d.type === null || d.value === 0 ? { type: null, value: 0 } : d));

export const lineSchema = z.object({
  qty: z.number({ error: "Isi dengan angka" }).gt(0, "Jumlah harus lebih dari 0").max(99_999, "Terlalu besar"),
  discount: discountSchema,
});

export const paySchema = z
  .object({
    method: z.enum(["TUNAI", "QRIS", "TRANSFER", "KARTU"], { error: "Pilih metode pembayaran" }),
    cashReceived: intValue.nullable(),
    reference: z.string().trim().max(100, "Maksimal 100 karakter"),
  })
  .transform((p) => ({ ...p, cashReceived: p.method === "TUNAI" ? p.cashReceived : null, reference: p.method === "TUNAI" ? "" : p.reference }));

export type Discount = z.infer<typeof discountSchema>;
export type PayInput = z.infer<typeof paySchema>;

export const voidSchema = z.object({
  reason: z.string().trim().min(3, "Alasan void wajib diisi (minimal 3 karakter)").max(300, "Maksimal 300 karakter"),
  restockLineIds: z.array(z.uuid()).max(100),
});

export type VoidInput = z.infer<typeof voidSchema>;

export const depositSchema = z
  .object({
    amount: z.number({ error: "Isi dengan angka" }).int("Harus bilangan bulat").min(1, "Minimal Rp 1").max(1_000_000_000, "Terlalu besar"),
    method: z.enum(["TUNAI", "QRIS", "TRANSFER", "KARTU"], { error: "Pilih metode pembayaran" }),
    cashReceived: intValue.nullable(),
    reference: z.string().trim().max(100, "Maksimal 100 karakter"),
  })
  .transform((d) => ({ ...d, cashReceived: d.method === "TUNAI" ? d.cashReceived : null, reference: d.method === "TUNAI" ? "" : d.reference }));

export const correctDepositSchema = z.object({
  amount: z.number({ error: "Isi dengan angka" }).int("Harus bilangan bulat").min(1, "Minimal Rp 1").max(1_000_000_000, "Terlalu besar"),
  reason: z.string().trim().min(3, "Alasan koreksi wajib diisi (minimal 3 karakter)").max(300, "Maksimal 300 karakter"),
});

export type DepositInput = z.infer<typeof depositSchema>;
