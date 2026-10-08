import { z } from "zod";

const COMMON = ["password", "password123", "1234567890", "qwertyuiop", "admin12345", "klinik123", "petshop123", "1q2w3e4r5t"];

const password = z
  .string()
  .min(10, "Minimal 10 karakter.")
  .max(72, "Maksimal 72 karakter.")
  .refine((v) => !COMMON.includes(v.toLowerCase()), "Password terlalu umum, pilih yang lain.")
  .refine((v) => /[a-zA-Z]/.test(v) && /\d/.test(v), "Gunakan kombinasi huruf dan angka.");

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

const MISMATCH = "Konfirmasi password tidak sama.";

export const userCreateFormSchema = userCreateSchema
  .extend({ confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { message: MISMATCH, path: ["confirmPassword"] });

export const passwordResetSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { message: MISMATCH, path: ["confirmPassword"] });

export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
