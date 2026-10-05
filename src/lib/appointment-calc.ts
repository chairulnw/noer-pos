import { z } from "zod";
import { dateToJakartaLocal } from "@/lib/admission-calc";

export const appointmentSchema = z.object({
  doctorId: z.guid({ error: "Pilih dokter" }),
  scheduledAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Waktu tidak valid"),
  purpose: z.string().trim().min(1, "Keperluan wajib diisi").max(200, "Maksimal 200 karakter"),
  notes: z.string().trim().max(500, "Maksimal 500 karakter"),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;

export const CONFLICT_MINUTES = 30;
const DAY_MS = 86_400_000;
const YMD = /^\d{4}-\d{2}-\d{2}$/;

export const parseYmd = (value: string | undefined) => (value && YMD.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()) ? value : null);

export const addDays = (ymd: string, days: number) => new Date(new Date(`${ymd}T00:00:00Z`).getTime() + days * DAY_MS).toISOString().slice(0, 10);

export function dayWindow(ymd: string) {
  const start = new Date(`${ymd}T00:00:00+07:00`);
  return { start, end: new Date(start.getTime() + DAY_MS) };
}

export const jakartaYmd = (date: Date) => new Date(date.getTime() + 7 * 3_600_000).toISOString().slice(0, 10);

export const isClose = (a: Date, b: Date) => Math.abs(a.getTime() - b.getTime()) < CONFLICT_MINUTES * 60_000;

export const isNoShow = (status: "TERJADWAL" | "SELESAI" | "BATAL", scheduledAt: Date, today: string) => status === "TERJADWAL" && jakartaYmd(scheduledAt) < today;

export function parseMonth(value: string | undefined, today: string) {
  const ym = value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : today.slice(0, 7);
  return ym;
}

export const shiftMonth = (ym: string, delta: number) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

export function monthGrid(ym: string) {
  const first = new Date(`${ym}-01T00:00:00Z`);
  const offset = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const weeks = Math.ceil((offset + daysInMonth) / 7);
  const start = addDays(`${ym}-01`, -offset);
  return Array.from({ length: weeks }, (_, w) => Array.from({ length: 7 }, (_, d) => {
    const ymd = addDays(start, w * 7 + d);
    return { ymd, inMonth: ymd.startsWith(ym) };
  }));
}

export const nextHourLocal = () => `${dateToJakartaLocal(new Date(Date.now() + 3_600_000)).slice(0, 13)}:00`;
