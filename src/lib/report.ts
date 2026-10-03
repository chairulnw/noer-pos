export type DayRow = { day: string; invoices: number; sales: number; cost: number };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;
export const MAX_RANGE_DAYS = 366;

export const PRESETS = [
  { id: "hari-ini", label: "Hari ini" },
  { id: "7-hari", label: "7 hari" },
  { id: "bulan-ini", label: "Bulan ini" },
  { id: "bulan-lalu", label: "Bulan lalu" },
] as const;

export type RangeParams = { preset?: string; from?: string; to?: string };

const ymd = (date: Date) => date.toISOString().slice(0, 10);
const utcDay = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));

export function resolveRange({ preset, from, to }: RangeParams, today: Date) {
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth();
  let start = utcDay(y, m, 1);
  let end = today;

  if (preset === "hari-ini") start = today;
  else if (preset === "7-hari") start = new Date(today.getTime() - 6 * DAY_MS);
  else if (preset === "bulan-lalu") {
    start = utcDay(y, m - 1, 1);
    end = utcDay(y, m, 0);
  } else if (from && to && DATE.test(from) && DATE.test(to)) {
    start = new Date(`${from}T00:00:00Z`);
    end = new Date(`${to}T00:00:00Z`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return { error: "Tanggal tidak valid." } as const;
    if (end < start) return { error: "Tanggal akhir tidak boleh sebelum tanggal awal." } as const;
    if ((end.getTime() - start.getTime()) / DAY_MS >= MAX_RANGE_DAYS) return { error: `Rentang maksimal ${MAX_RANGE_DAYS} hari.` } as const;
  }

  const fromYmd = ymd(start);
  const toYmd = ymd(end);
  return {
    from: fromYmd,
    to: toYmd,
    preset: preset && PRESETS.some((p) => p.id === preset) ? preset : from && to ? "kustom" : "bulan-ini",
    start: new Date(`${fromYmd}T00:00:00+07:00`),
    endExclusive: new Date(new Date(`${toYmd}T00:00:00+07:00`).getTime() + DAY_MS),
  } as const;
}

export const profit = (row: Pick<DayRow, "sales" | "cost">) => row.sales - row.cost;

export const marginPercent = (row: Pick<DayRow, "sales" | "cost">) => (row.sales > 0 ? Math.round((profit(row) / row.sales) * 1000) / 10 : 0);

export function sumRows(rows: DayRow[]) {
  return rows.reduce((t, r) => ({ invoices: t.invoices + r.invoices, sales: t.sales + r.sales, cost: t.cost + r.cost }), { invoices: 0, sales: 0, cost: 0 });
}

export function groupMonthly(rows: DayRow[]): DayRow[] {
  const byMonth = new Map<string, DayRow>();
  for (const r of rows) {
    const key = r.day.slice(0, 7);
    const cur = byMonth.get(key) ?? { day: key, invoices: 0, sales: 0, cost: 0 };
    cur.invoices += r.invoices;
    cur.sales += r.sales;
    cur.cost += r.cost;
    byMonth.set(key, cur);
  }
  return [...byMonth.values()].sort((a, b) => a.day.localeCompare(b.day));
}

export function fillDays(rows: DayRow[], from: string, to: string): DayRow[] {
  const byDay = new Map(rows.map((r) => [r.day, r]));
  const out: DayRow[] = [];
  for (let t = new Date(`${from}T00:00:00Z`).getTime(); t <= new Date(`${to}T00:00:00Z`).getTime(); t += DAY_MS) {
    const day = ymd(new Date(t));
    out.push(byDay.get(day) ?? { day, invoices: 0, sales: 0, cost: 0 });
  }
  return out;
}
