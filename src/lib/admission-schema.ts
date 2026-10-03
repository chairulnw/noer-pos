import { z } from "zod";

export const checkInSchema = z.object({
  patientId: z.uuid({ error: "Pasien tidak valid" }),
  type: z.enum(["RAWAT_INAP", "HOTEL"], { error: "Pilih jenis" }),
  roomId: z.uuid({ error: "Pilih kandang" }),
  rateItemId: z.uuid({ error: "Pilih tarif harian" }),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Waktu masuk tidak valid"),
  visitId: z.union([z.uuid(), z.literal("")]),
  notes: z.string().trim().max(300, "Maksimal 300 karakter"),
});

export type CheckInInput = z.infer<typeof checkInSchema>;

export const RATE_CATEGORY = { RAWAT_INAP: "rawat inap", HOTEL: "hotel" } as const;
