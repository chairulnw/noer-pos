import { z } from "zod";

export type GroomingStatus = "MENUNGGU" | "PROSES" | "SELESAI" | "BATAL";

export const GROOMING_STATUS = {
  MENUNGGU: { label: "Menunggu", tone: "info" },
  PROSES: { label: "Proses", tone: "warning" },
  SELESAI: { label: "Selesai", tone: "success" },
  BATAL: { label: "Batal", tone: "neutral" },
} as const;

const NEXT: Record<GroomingStatus, GroomingStatus[]> = { MENUNGGU: ["PROSES", "BATAL"], PROSES: ["SELESAI", "BATAL"], SELESAI: [], BATAL: [] };

export const canTransition = (from: GroomingStatus, to: GroomingStatus) => NEXT[from].includes(to);
export const isEditable = (status: GroomingStatus) => NEXT[status].length > 0;

export const groomingSchema = z.object({
  groomingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid").refine((v) => !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()), "Tanggal tidak valid"),
  serviceItemId: z.guid({ error: "Pilih layanan grooming" }),
  notes: z.string().trim().max(1000, "Maksimal 1000 karakter"),
});

export type GroomingInput = z.infer<typeof groomingSchema>;
