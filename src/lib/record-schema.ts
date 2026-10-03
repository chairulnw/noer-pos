import { z } from "zod";

const number = () => z.number({ error: "Isi dengan angka" });
const text = (max: number) => z.string().trim().max(max, `Maksimal ${max} karakter`);

export const vitalsSchema = z.object({
  temp: number().min(30, "Minimal 30").max(45, "Maksimal 45").nullable(),
  hr: number().int("Bilangan bulat").min(10, "Minimal 10").max(400, "Maksimal 400").nullable(),
  rr: number().int("Bilangan bulat").min(1, "Minimal 1").max(200, "Maksimal 200").nullable(),
  weight: number().positive("Harus lebih dari 0").max(999.99, "Terlalu besar").nullable(),
  bcs: number().int("Bilangan bulat").min(1, "Minimal 1").max(9, "Maksimal 9").nullable(),
  crt: number().min(0, "Minimal 0").max(10, "Maksimal 10").nullable(),
});

export const recordSchema = z.object({
  subjective: text(5000),
  objective: text(5000),
  assessment: text(5000),
  plan: text(5000),
  diagnosis: text(200),
  vitals: vitalsSchema,
});

export type RecordInput = z.infer<typeof recordSchema>;

export const isRecordEmpty = (r: RecordInput) =>
  !r.subjective && !r.objective && !r.assessment && !r.plan && !r.diagnosis;

export const addendumSchema = z.object({ note: text(2000).min(1, "Catatan wajib diisi") });

export const vaccinationSchema = z.object({
  itemId: z.uuid({ error: "Pilih vaksin" }),
  batchNo: text(50),
  givenAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid"),
  nextDue: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "Tanggal tidak valid"),
});

export type VaccinationInput = z.infer<typeof vaccinationSchema>;

const DAY_MS = 86_400_000;

export const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY_MS);

export const defaultNextDue = (givenAt: Date, intervalDays: number | null) =>
  intervalDays === null ? null : addDays(givenAt, intervalDays);

export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

const SIGNATURES: { mime: string; ext: string; bytes: number[] }[] = [
  { mime: "application/pdf", ext: "pdf", bytes: [0x25, 0x50, 0x44, 0x46] },
  { mime: "image/png", ext: "png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/jpeg", ext: "jpg", bytes: [0xff, 0xd8, 0xff] },
];

export function detectAttachment(head: Uint8Array, size: number) {
  if (size === 0) return { error: "File kosong" } as const;
  if (size > ATTACHMENT_MAX_BYTES) return { error: "Ukuran maksimal 10 MB" } as const;
  const match = SIGNATURES.find(({ bytes }) => bytes.every((b, i) => head[i] === b));
  return match ? ({ mime: match.mime, ext: match.ext } as const) : ({ error: "Format harus PDF, JPG, atau PNG" } as const);
}

export const recordItemsSchema = z
  .array(
    z.object({
      itemId: z.uuid({ error: "Item tidak valid" }),
      qty: number().gt(0, "Jumlah harus lebih dari 0").max(99999, "Terlalu besar"),
      instruction: text(200),
    }),
  )
  .max(50, "Maksimal 50 item");

export type RecordItemInput = z.infer<typeof recordItemsSchema>[number];
