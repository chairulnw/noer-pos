import { z } from "zod";

export const settingsSchema = z.object({
  clinicName: z.string().trim().min(1, "Nama klinik wajib diisi").max(100, "Maksimal 100 karakter"),
  address: z.string().trim().max(300, "Maksimal 300 karakter"),
  phone: z.string().trim().max(30, "Maksimal 30 karakter"),
  npwp: z.string().trim().max(30, "Maksimal 30 karakter"),
  receiptFooter: z.string().trim().max(200, "Maksimal 200 karakter"),
  taxEnabled: z.boolean(),
  taxRate: z.number().int("Harus bilangan bulat").min(0, "Minimal 0").max(100, "Maksimal 100"),
  taxMode: z.enum(["INCLUDE", "EXCLUDE"]),
  paperWidth: z.union([z.literal(58), z.literal(80)], { error: "Pilih 58 atau 80 mm" }),
  expiryWarningDays: z.number().int("Harus bilangan bulat").min(1, "Minimal 1 hari").max(365, "Maksimal 365 hari"),
  logo: z.string(),
  qris: z.string(),
});

export type Settings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
  clinicName: "NOER Petshop & Vet Clinic",
  address: "",
  phone: "",
  npwp: "",
  receiptFooter: "Terima kasih atas kunjungan Anda",
  taxEnabled: false,
  taxRate: 11,
  taxMode: "EXCLUDE",
  paperWidth: 80,
  expiryWarningDays: 90,
  logo: "",
  qris: "",
};

export const IMAGE_LIMITS = { logo: 200 * 1024, qris: 1024 * 1024 } as const;

export function diffSettings(before: Settings, after: Settings) {
  return (Object.keys(after) as (keyof Settings)[])
    .filter((key) => before[key] !== after[key])
    .map((key) => ({ key, before: before[key], after: after[key] }));
}

// gambar berupa data URL: tidak ikut ke audit log
export function auditValue(key: keyof Settings, value: Settings[keyof Settings]) {
  if (key === "logo" || key === "qris") return value ? "(gambar diunggah)" : "(kosong)";
  return value;
}

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

type ImageResult = { dataUrl: string; error?: undefined } | { error: string; dataUrl?: undefined };

export async function imageToDataUrl(file: File, maxBytes: number): Promise<ImageResult> {
  if (!IMAGE_TYPES.includes(file.type)) return { error: "Format harus PNG, JPG, atau WebP" };
  if (file.size > maxBytes) return { error: `Ukuran maksimal ${Math.round(maxBytes / 1024)} KB` };
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  return { dataUrl: `data:${file.type};base64,${base64}` };
}
