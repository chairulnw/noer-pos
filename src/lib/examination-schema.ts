import { z } from "zod";

export type ExaminationType = "LAB" | "RADIOLOGI";

export const EXAM = {
  LAB: {
    title: "Hasil Laboratorium",
    singular: "hasil lab",
    path: "/hasil-lab",
    nameLabel: "Nama pengujian",
    findingsLabel: "Ringkasan hasil / nilai uji",
    notesLabel: "Catatan / kesimpulan",
    suggestions: ["Darah lengkap (CBC)", "Kimia darah", "Urinalisis", "Pemeriksaan feses", "Kerokan kulit", "Tes cepat (rapid test)"],
  },
  RADIOLOGI: {
    title: "Pemeriksaan Radiologi",
    singular: "radiologi",
    path: "/radiologi",
    nameLabel: "Jenis radiologi",
    findingsLabel: "Temuan / interpretasi",
    notesLabel: "Catatan lanjutan",
    suggestions: ["X-Ray (Rontgen)", "USG Abdomen", "Echocardiography"],
  },
} as const satisfies Record<ExaminationType, object>;

export const examTypeFromSlug = (slug: string): ExaminationType | null => (slug === "hasil-lab" ? "LAB" : slug === "radiologi" ? "RADIOLOGI" : null);

const optionalGuid = z.union([z.guid(), z.literal("")]);

export const examinationSchema = (type: ExaminationType) =>
  z.object({
    name: z.string().trim().min(1, "Wajib diisi").max(150, "Maksimal 150 karakter"),
    performedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid").refine((v) => !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()), "Tanggal tidak valid"),
    findings: type === "RADIOLOGI" ? z.string().trim().min(1, "Wajib diisi").max(3000, "Maksimal 3000 karakter") : z.string().trim().max(3000, "Maksimal 3000 karakter"),
    notes: z.string().trim().max(1500, "Maksimal 1500 karakter"),
    recordId: optionalGuid,
  });

export type ExaminationInput = z.infer<ReturnType<typeof examinationSchema>>;
