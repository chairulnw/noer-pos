import { z } from "zod";
import { todayJakarta } from "@/lib/date";

export function normalizeWhatsapp(input: string) {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  else if (digits.startsWith("8")) digits = `62${digits}`;
  return digits.startsWith("62") && digits.length >= 10 && digits.length <= 15 ? digits : "";
}

export function formatWhatsapp(stored: string) {
  if (!stored.startsWith("62")) return stored;
  const local = `0${stored.slice(2)}`;
  return [local.slice(0, 4), local.slice(4, 8), local.slice(8)].filter(Boolean).join("-");
}

export function birthDateFromAge(years: number, months: number, today: Date) {
  const month = today.getUTCMonth() - (years * 12 + months);
  const year = today.getUTCFullYear();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(today.getUTCDate(), daysInMonth)));
}

export function formatAge(birth: Date, today: Date) {
  let months = (today.getUTCFullYear() - birth.getUTCFullYear()) * 12 + today.getUTCMonth() - birth.getUTCMonth();
  if (today.getUTCDate() < birth.getUTCDate()) months -= 1;
  if (months < 1) return "< 1 bln";
  const [years, rest] = [Math.floor(months / 12), months % 12];
  return [years && `${years} th`, rest && `${rest} bln`].filter(Boolean).join(" ");
}

export const formatRmNo = (year: number, seq: number) => `RM-${year}-${String(seq).padStart(5, "0")}`;

export const nextRmNo = (year: number, lastOfYear: string | null) =>
  formatRmNo(year, lastOfYear ? Number(lastOfYear.slice(-5)) + 1 : 1);

const text = (max: number) => z.string().trim().max(max, `Maksimal ${max} karakter`);
const number = () => z.number({ error: "Isi dengan angka" });

export const ownerSchema = z.object({
  name: text(100).min(1, "Nama wajib diisi"),
  whatsapp: z
    .string()
    .transform(normalizeWhatsapp)
    .refine((value) => value !== "", "Nomor WhatsApp tidak valid (minimal 10 digit)"),
  address: text(300),
  notes: text(500),
});

export const patientSchema = z
  .object({
    name: text(100).min(1, "Nama wajib diisi"),
    species: text(50).min(1, "Spesies wajib diisi"),
    breed: text(50),
    sex: z.enum(["JANTAN", "BETINA"], { error: "Pilih jenis kelamin" }),
    birthDate: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "Tanggal tidak valid"),
    ageYears: number().int("Harus bilangan bulat").min(0, "Minimal 0").max(40, "Maksimal 40").nullable(),
    ageMonths: number().int("Harus bilangan bulat").min(0, "Minimal 0").max(11, "Maksimal 11").nullable(),
    microchip: text(30),
    color: text(50),
    neutered: z.boolean(),
    lastWeightKg: number().positive("Harus lebih dari 0").max(999.99, "Terlalu besar").nullable(),
    allergyNote: text(500),
    aggressive: z.boolean(),
    behaviorNote: text(500),
  })
  .superRefine((patient, ctx) => {
    if (patient.birthDate && new Date(`${patient.birthDate}T00:00:00Z`) > todayJakarta()) {
      ctx.addIssue({ code: "custom", path: ["birthDate"], message: "Tanggal lahir tidak boleh di masa depan" });
    }
  });

export type OwnerInput = z.infer<typeof ownerSchema>;
export type PatientInput = z.infer<typeof patientSchema>;

export function normalizePatient(v: PatientInput, today = todayJakarta()) {
  const hasAge = v.ageYears !== null || v.ageMonths !== null;
  return {
    name: v.name,
    species: v.species,
    breed: v.breed || null,
    sex: v.sex,
    birthDate: v.birthDate
      ? new Date(`${v.birthDate}T00:00:00Z`)
      : hasAge
        ? birthDateFromAge(v.ageYears ?? 0, v.ageMonths ?? 0, today)
        : null,
    color: v.color || null,
    microchip: v.microchip || null,
    neutered: v.neutered,
    lastWeightKg: v.lastWeightKg === null ? null : Math.round(v.lastWeightKg * 100) / 100,
    allergyNote: v.allergyNote || null,
    aggressive: v.aggressive,
    behaviorNote: v.behaviorNote || null,
  };
}
