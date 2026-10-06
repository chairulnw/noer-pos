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

export const PL_PRESETS = [
  { id: "bulan-ini", label: "Bulan Ini" },
  { id: "bulan-lalu", label: "Bulan Lalu" },
  { id: "3-bulan", label: "3 Bulan Terakhir" },
  { id: "tahun-ini", label: "Tahun Ini" },
  { id: "semua", label: "Semua Periode" },
] as const;

export type RangeParams = { preset?: string; from?: string; to?: string };

const ymd = (date: Date) => date.toISOString().slice(0, 10);
const utcDay = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));

export function resolveRange({ preset, from, to }: RangeParams, today: Date, earliest?: string | null) {
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth();
  let start = utcDay(y, m, 1);
  let end = today;

  if (preset === "hari-ini") start = today;
  else if (preset === "7-hari") start = new Date(today.getTime() - 6 * DAY_MS);
  else if (preset === "bulan-lalu") {
    start = utcDay(y, m - 1, 1);
    end = utcDay(y, m, 0);
  } else if (preset === "3-bulan") start = utcDay(y, m - 2, 1);
  else if (preset === "tahun-ini") start = utcDay(y, 0, 1);
  else if (preset === "semua") {
    const first = earliest && DATE.test(earliest) ? new Date(`${earliest}T00:00:00Z`) : today;
    start = first < today ? first : today;
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
    preset: preset && [...PRESETS, ...PL_PRESETS].some((p) => p.id === preset) ? preset : from && to ? "kustom" : "bulan-ini",
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

export function daysBetween(from: string, to: string) {
  const out: string[] = [];
  for (let t = new Date(`${from}T00:00:00Z`).getTime(); t <= new Date(`${to}T00:00:00Z`).getTime(); t += DAY_MS) out.push(ymd(new Date(t)));
  return out;
}

export function fillDays(rows: DayRow[], from: string, to: string): DayRow[] {
  const byDay = new Map(rows.map((r) => [r.day, r]));
  return daysBetween(from, to).map((day) => byDay.get(day) ?? { day, invoices: 0, sales: 0, cost: 0 });
}

export const TREND_DAYS = [7, 30, 90] as const;

export function trendRange(days: number, today: Date) {
  const n = (TREND_DAYS as readonly number[]).includes(days) ? days : 30;
  return { days: n, from: ymd(new Date(today.getTime() - (n - 1) * DAY_MS)), to: ymd(today) };
}

export function barHeights(values: number[]) {
  const max = Math.max(0, ...values);
  return values.map((v) => (max === 0 || v <= 0 ? 0 : Math.max(v / max, 0.02)));
}

export type ProfitPoint = { key: string; sales: number; cost: number; opex: number; net: number };

export function profitSeries(rows: DayRow[], opex: Record<string, number>, from: string, to: string) {
  const sales = new Map(rows.map((r) => [r.day, r]));
  const days = daysBetween(from, to);
  const monthly = days.length > 62;
  const buckets = new Map<string, ProfitPoint>();
  for (const day of days) {
    const key = monthly ? day.slice(0, 7) : day;
    const row = sales.get(day);
    const point = buckets.get(key) ?? { key, sales: 0, cost: 0, opex: 0, net: 0 };
    point.sales += row?.sales ?? 0;
    point.cost += row?.cost ?? 0;
    point.opex += opex[day] ?? 0;
    point.net = point.sales - point.cost - point.opex;
    buckets.set(key, point);
  }
  return { points: [...buckets.values()], monthly };
}

export const sumProfit = (points: ProfitPoint[]) =>
  points.reduce((t, p) => ({ sales: t.sales + p.sales, cost: t.cost + p.cost, opex: t.opex + p.opex, net: t.net + p.net }), { sales: 0, cost: 0, opex: 0, net: 0 });

export const TREND_PERIODS = ["bulan", "tahun"] as const;
export type TrendPeriod = (typeof TREND_PERIODS)[number];

export function periodRange(period: TrendPeriod, today: Date) {
  const to = ymd(today);
  return { from: period === "tahun" ? `${to.slice(0, 4)}-01-01` : `${to.slice(0, 7)}-01`, to };
}

export function periodSeries(daily: Record<string, number>, from: string, to: string, period: TrendPeriod) {
  if (period === "bulan") return daysBetween(from, to).map((key) => ({ key, value: daily[key] ?? 0 }));
  const months = new Map<string, number>();
  for (const key of daysBetween(from, to)) months.set(key.slice(0, 7), (months.get(key.slice(0, 7)) ?? 0) + (daily[key] ?? 0));
  return [...months].map(([key, value]) => ({ key, value }));
}
