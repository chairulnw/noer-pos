const jakarta = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" });

export const todayJakarta = () => new Date(`${jakarta.format(new Date())}T00:00:00Z`);

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export const parseYmd = (value: string | undefined) => (value && YMD.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()) ? value : null);

export const PERIODS = [
  { value: "", label: "Semua waktu" },
  { value: "hari-ini", label: "Hari ini" },
  { value: "7-hari", label: "7 hari terakhir" },
  { value: "30-hari", label: "30 hari terakhir" },
  { value: "bulan-ini", label: "Bulan ini" },
  { value: "bulan-lalu", label: "Bulan lalu" },
] as const;

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const shift = (d: Date, days: number) => new Date(d.getTime() + days * 86_400_000);

export function periodToRange(value: string | undefined, today = todayJakarta()): { period: string; from?: string; to?: string } {
  const t = ymd(today);
  if (value === "hari-ini") return { period: value, from: t, to: t };
  if (value === "7-hari") return { period: value, from: ymd(shift(today, -6)), to: t };
  if (value === "30-hari") return { period: value, from: ymd(shift(today, -29)), to: t };
  if (value === "bulan-ini") return { period: value, from: `${t.slice(0, 7)}-01`, to: t };
  if (value === "bulan-lalu") {
    const end = shift(new Date(`${t.slice(0, 7)}-01T00:00:00Z`), -1);
    return { period: value, from: `${ymd(end).slice(0, 7)}-01`, to: ymd(end) };
  }
  return { period: "" };
}
