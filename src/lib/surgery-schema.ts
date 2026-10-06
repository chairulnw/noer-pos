import { z } from "zod";

export type SurgeryStatus = "DIJADWALKAN" | "BERJALAN" | "SELESAI" | "BATAL";

export const SURGERY_STATUS = {
  DIJADWALKAN: { label: "Dijadwalkan", tone: "info" },
  BERJALAN: { label: "Berjalan", tone: "warning" },
  SELESAI: { label: "Selesai", tone: "success" },
  BATAL: { label: "Batal", tone: "neutral" },
} as const;

const NEXT: Record<SurgeryStatus, SurgeryStatus[]> = {
  DIJADWALKAN: ["BERJALAN", "BATAL"],
  BERJALAN: ["SELESAI", "BATAL"],
  SELESAI: [],
  BATAL: [],
};

export const nextStatuses = (status: SurgeryStatus) => NEXT[status];
export const canTransition = (from: SurgeryStatus, to: SurgeryStatus) => NEXT[from].includes(to);
export const isEditable = (status: SurgeryStatus) => status === "DIJADWALKAN" || status === "BERJALAN";

export const surgerySchema = z.object({
  procedure: z.string().trim().min(1, "Prosedur wajib diisi").max(150, "Maksimal 150 karakter"),
  anesthesia: z.string().trim().max(150, "Maksimal 150 karakter"),
  surgeryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid").refine((v) => !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()), "Tanggal tidak valid"),
  doctorId: z.guid({ error: "Pilih dokter" }),
  serviceItemId: z.union([z.guid(), z.literal("")]),
  preNotes: z.string().trim().max(1500, "Maksimal 1500 karakter"),
});

export const completeSchema = z.object({ postNotes: z.string().trim().min(1, "Catatan pasca-operasi wajib diisi sebelum selesai").max(3000, "Maksimal 3000 karakter") });
export const addendumSchema = z.object({ note: z.string().trim().min(1, "Catatan wajib diisi").max(1000, "Maksimal 1000 karakter") });

export type SurgeryInput = z.infer<typeof surgerySchema>;
