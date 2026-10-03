import { z } from "zod";

const password = z.string().min(8, "Minimal 8 karakter.").max(72, "Maksimal 72 karakter.");

export const userCreateSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi.").max(100),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._-]{3,32}$/, "3-32 karakter: huruf kecil, angka, titik, garis bawah, atau strip."),
  role: z.enum(["ADMIN", "DOKTER", "KASIR"], "Pilih role."),
  password,
});

export const userUpdateSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi.").max(100),
  role: z.enum(["ADMIN", "DOKTER", "KASIR"], "Pilih role."),
  active: z.boolean(),
});

export const passwordResetSchema = z.object({ password });

export const passwordChangeSchema = z
  .object({ current: z.string().min(1, "Password saat ini wajib diisi."), next: password, confirm: z.string() })
  .refine((v) => v.next === v.confirm, { path: ["confirm"], message: "Konfirmasi tidak sama." })
  .refine((v) => v.next !== v.current, { path: ["next"], message: "Password baru harus berbeda." });

export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
