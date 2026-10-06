import { z } from "zod";

export const checkInSchema = z.object({
  patientId: z.guid({ error: "Pasien tidak valid" }),
  type: z.enum(["RAWAT_INAP", "HOTEL"], { error: "Pilih jenis" }),
  roomId: z.guid({ error: "Pilih kandang" }),
  rateItemId: z.guid({ error: "Pilih tarif harian" }),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Waktu masuk tidak valid"),
  visitId: z.union([z.guid(), z.literal("")]),
  notes: z.string().trim().max(300, "Maksimal 300 karakter"),
  expectedCheckOut: z.string().optional(),
  feedingInstructions: z.string().trim().max(500, "Maksimal 500 karakter").optional(),
});

export const hotelCheckInSchema = z.object({
  patientId: z.guid({ error: "Pilih pasien" }),
  roomId: z.guid({ error: "Pilih slot kandang" }),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal check-in tidak valid"),
  expectedCheckOut: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid"), z.literal("")]),
  feedingInstructions: z.string().trim().max(500, "Maksimal 500 karakter"),
  notes: z.string().trim().max(300, "Maksimal 300 karakter"),
}).refine((v) => !v.expectedCheckOut || v.expectedCheckOut >= v.checkInDate, { message: "Estimasi check-out tidak boleh sebelum check-in", path: ["expectedCheckOut"] });

export type CheckInInput = z.infer<typeof checkInSchema>;

export const RATE_CATEGORY = { RAWAT_INAP: "rawat inap", HOTEL: "hotel" } as const;

export const logSchema = z
  .object({
    loggedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Waktu tidak valid"),
    temp: z.number({ error: "Isi dengan angka" }).min(30, "Minimal 30").max(45, "Maksimal 45").nullable(),
    intake: z.string().trim().max(200, "Maksimal 200 karakter"),
    note: z.string().trim().max(1000, "Maksimal 1000 karakter"),
  })
  .refine((log) => log.temp !== null || log.intake !== "" || log.note !== "", { message: "Isi minimal suhu, makan/minum, atau catatan", path: ["note"] })
  .transform((log) => ({ ...log, temp: log.temp === null ? null : Math.round(log.temp * 10) / 10 }));

export type LogInput = z.infer<typeof logSchema>;

export const checkOutSchema = z.object({
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Waktu keluar tidak valid"),
});
