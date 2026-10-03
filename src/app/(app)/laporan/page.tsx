import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getStockAlerts } from "@/lib/inventory";
import { todayJakarta } from "@/lib/date";
import { formatDate, formatRupiah } from "@/lib/format";
import { fillDays, groupMonthly, marginPercent, PRESETS, profit, resolveRange, sumRows, type DayRow } from "@/lib/report";
import { getSalesByDay, getTopItems, getVisitStats, type TopItem } from "@/lib/reports";
import { listDueVaccinations } from "@/lib/records";
import { requireCapability } from "@/lib/require-role";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "omzet", label: "Omzet & Laba" },
  { id: "produk", label: "Produk & Layanan" },
  { id: "kunjungan", label: "Kunjungan" },
  { id: "stok", label: "Stok & Jatuh Tempo" },
] as const;

type Params = { tab?: string; preset?: string; from?: string; to?: string; per?: string };

const field = "h-11 rounded-lg border border-input bg-card px-3 text-sm";
const th = "px-4 py-2.5 font-normal";
const num = "px-4 py-3 text-right tabular-nums";

function Table({ head, children, empty, emptyText = "Tidak ada data pada periode ini." }: { head: [string, boolean?][]; children: React.ReactNode; empty?: boolean; emptyText?: string }) {
  return (
    <div className="overflow-x-auto rounded-[10px] border bg-card">
      <table className="w-full min-w-[560px] text-[14.5px]">
        <thead>
          <tr className="border-b text-left text-[13px] text-muted-foreground">
            {head.map(([label, right]) => <th key={label} className={cn(th, right && "text-right")}>{label}</th>)}
          </tr>
        </thead>
        <tbody>
          {empty && <tr><td colSpan={head.length} className="px-4 py-8 text-center text-muted-foreground">{emptyText}</td></tr>}
          {children}
        </tbody>
      </table>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="h-full rounded-[10px] border bg-card p-4">
      <div className="text-[13px] text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-[13px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function ItemTable({ rows }: { rows: TopItem[] }) {
  return (
    <Table head={[["Nama"], ["Jumlah", true], ["Penjualan", true], ["HPP", true], ["Laba kotor", true]]} empty={rows.length === 0}>
      {rows.map((r) => (
        <tr key={r.itemId} className="border-b last:border-0">
          <td className="px-4 py-3 font-medium">{r.name}</td>
          <td className={num}>{r.qty.toLocaleString("id-ID")}</td>
          <td className={num}>{formatRupiah(r.revenue)}</td>
          <td className={num}>{formatRupiah(r.cost)}</td>
          <td className={num}>{formatRupiah(r.revenue - r.cost)}</td>
        </tr>
      ))}
    </Table>
  );
}

const monthLabel = (ym: string) => new Date(`${ym}-01T00:00:00Z`).toLocaleDateString("id-ID", { month: "long", year: "numeric", timeZone: "UTC" });
const dayLabel = (ymd: string) => formatDate(new Date(`${ymd}T00:00:00+07:00`));

export default async function ReportPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireCapability("view_revenue_reports");
  const params = await searchParams;
  const tab = TABS.some((t) => t.id === params.tab) ? params.tab! : "omzet";
  const range = resolveRange(params, todayJakarta());
  const query = (extra: Params) => `/laporan?${new URLSearchParams(Object.entries({ ...params, ...extra }).filter(([, v]) => v) as [string, string][])}`;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[22px] font-semibold leading-11">Laporan</h1>
        <p className="text-sm text-muted-foreground">Hanya invoice FINAL. Penjualan dihitung tanpa PPN, laba kotor = penjualan − HPP (harga beli saat transaksi).</p>
      </header>

      <form className="flex flex-wrap items-end gap-3 rounded-[10px] border bg-card p-4">
        <input type="hidden" name="tab" value={tab} />
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <Link key={p.id} href={query({ preset: p.id, from: "", to: "" })} className={cn("flex h-11 items-center rounded-lg border px-4 text-sm font-medium", "error" in range ? "" : range.preset === p.id ? "border-primary bg-accent text-primary" : "bg-card")}>
              {p.label}
            </Link>
          ))}
        </div>
        <label className="space-y-1 text-[13px] text-muted-foreground">Dari<input type="date" name="from" defaultValue={"error" in range ? params.from : range.from} className={`${field} block`} /></label>
        <label className="space-y-1 text-[13px] text-muted-foreground">Sampai<input type="date" name="to" defaultValue={"error" in range ? params.to : range.to} className={`${field} block`} /></label>
        <Button type="submit">Terapkan</Button>
      </form>

      <div role="tablist" className="flex gap-1 overflow-x-auto border-b">
        {TABS.map((t) => (
          <Link key={t.id} href={query({ tab: t.id })} role="tab" aria-selected={tab === t.id} className={cn("flex h-12 shrink-0 items-center border-b-2 px-3 text-[14.5px] font-medium text-muted-foreground", tab === t.id ? "border-primary font-semibold text-primary" : "border-transparent")}>
            {t.label}
          </Link>
        ))}
      </div>

      {"error" in range ? <p role="alert" className="text-sm text-destructive">{range.error}</p> : <Section tab={tab} range={range} per={params.per === "bulan" ? "bulan" : "hari"} query={query} />}
    </div>
  );
}

async function Section({ tab, range, per, query }: { tab: string; range: Exclude<ReturnType<typeof resolveRange>, { error: string }>; per: "hari" | "bulan"; query: (p: Params) => string }) {
  if (tab === "omzet") {
    const daily = await getSalesByDay(range);
    const total = sumRows(daily);
    const rows: DayRow[] = per === "bulan" ? groupMonthly(daily) : fillDays(daily, range.from, range.to).reverse();
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
          <Stat label="Penjualan" value={formatRupiah(total.sales)} hint={`${total.invoices} invoice`} />
          <Stat label="HPP" value={formatRupiah(total.cost)} />
          <Stat label="Laba kotor" value={formatRupiah(profit(total))} hint={`Margin ${marginPercent(total).toLocaleString("id-ID")}%`} />
          <Stat label="Rata-rata per invoice" value={formatRupiah(total.invoices ? Math.round(total.sales / total.invoices) : 0)} />
        </div>
        <div className="flex gap-1.5">
          {(["hari", "bulan"] as const).map((p) => (
            <Link key={p} href={query({ per: p })} className={cn("flex h-11 items-center rounded-lg border px-4 text-sm font-medium", per === p ? "border-primary bg-accent text-primary" : "bg-card")}>{p === "hari" ? "Harian" : "Bulanan"}</Link>
          ))}
        </div>
        <Table head={[[per === "bulan" ? "Bulan" : "Tanggal"], ["Invoice", true], ["Penjualan", true], ["HPP", true], ["Laba kotor", true], ["Margin", true]]} empty={rows.length === 0}>
          {rows.map((r) => (
            <tr key={r.day} className={cn("border-b last:border-0", r.invoices === 0 && "text-muted-foreground")}>
              <td className="px-4 py-3">{per === "bulan" ? monthLabel(r.day) : dayLabel(r.day)}</td>
              <td className={num}>{r.invoices}</td>
              <td className={num}>{formatRupiah(r.sales)}</td>
              <td className={num}>{formatRupiah(r.cost)}</td>
              <td className={num}>{formatRupiah(profit(r))}</td>
              <td className={num}>{r.sales ? `${marginPercent(r).toLocaleString("id-ID")}%` : "-"}</td>
            </tr>
          ))}
        </Table>
      </div>
    );
  }

  if (tab === "produk") {
    const [products, services] = await Promise.all([getTopItems(range, "PRODUCT"), getTopItems(range, "SERVICE")]);
    return (
      <div className="space-y-5">
        <section className="space-y-2"><h2 className="text-base font-semibold">10 produk teratas</h2><ItemTable rows={products} /></section>
        <section className="space-y-2"><h2 className="text-base font-semibold">10 layanan teratas</h2><ItemTable rows={services} /></section>
        <p className="text-[13px] text-muted-foreground">Diurutkan menurut penjualan. Angka per item sudah termasuk diskon item, belum termasuk diskon di tingkat invoice.</p>
      </div>
    );
  }

  if (tab === "kunjungan") {
    const stats = await getVisitStats(range);
    const total = stats.perDay.reduce((t, d) => t + d.count, 0);
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
          <Stat label="Kunjungan" value={String(total)} />
          <Stat label="Check-in rawat inap" value={String(stats.admissions.RAWAT_INAP ?? 0)} />
          <Stat label="Check-in hotel" value={String(stats.admissions.HOTEL ?? 0)} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Table head={[["Tanggal"], ["Kunjungan", true]]} empty={stats.perDay.length === 0}>
            {stats.perDay.map((d) => <tr key={d.day} className="border-b last:border-0"><td className="px-4 py-3">{dayLabel(d.day)}</td><td className={num}>{d.count}</td></tr>)}
          </Table>
          <Table head={[["Dokter"], ["Kunjungan", true]]} empty={stats.perDoctor.length === 0}>
            {stats.perDoctor.map((d) => <tr key={d.name} className="border-b last:border-0"><td className="px-4 py-3">{d.name}</td><td className={num}>{d.count}</td></tr>)}
          </Table>
        </div>
      </div>
    );
  }

  const [alerts, due] = await Promise.all([getStockAlerts(), listDueVaccinations(30)]);
  return (
    <div className="space-y-5">
      <p className="text-[13px] text-muted-foreground">Kondisi saat ini, tidak mengikuti rentang tanggal.</p>
      <section className="space-y-2">
        <h2 className="text-base font-semibold">Stok menipis ({alerts.low.length})</h2>
        <Table head={[["Produk"], ["Sisa", true], ["Batas minimum", true]]} empty={alerts.low.length === 0} emptyText="Tidak ada.">
          {alerts.low.map((l) => <tr key={l.id} className="border-b last:border-0"><td className="px-4 py-3 font-medium">{l.name}</td><td className={num}>{l.usable.toLocaleString("id-ID")} {l.unit}</td><td className={num}>{l.threshold.toLocaleString("id-ID")} {l.unit}</td></tr>)}
        </Table>
      </section>
      <section className="space-y-2">
        <h2 className="text-base font-semibold">Expired dan hampir expired ({alerts.expiring.length})</h2>
        <Table head={[["Produk / batch"], ["Expired"], ["Jumlah", true], ["Status"]]} empty={alerts.expiring.length === 0} emptyText="Tidak ada.">
          {alerts.expiring.map((e) => <tr key={`${e.id}-${e.batchNo}`} className="border-b last:border-0"><td className="px-4 py-3 font-medium">{e.name} · {e.batchNo}</td><td className="px-4 py-3">{formatDate(e.expiry)}</td><td className={num}>{e.qty.toLocaleString("id-ID")} {e.unit}</td><td className="px-4 py-3">{e.level === "EXPIRED" ? "Sudah expired" : "Hampir expired"}</td></tr>)}
        </Table>
      </section>
      <section className="space-y-2">
        <h2 className="text-base font-semibold">Jatuh tempo vaksin 30 hari ke depan ({due.length})</h2>
        <Table head={[["Pasien"], ["Owner"], ["Vaksin"], ["Jatuh tempo"]]} empty={due.length === 0} emptyText="Tidak ada.">
          {due.slice(0, 50).map((d) => {
            const p = d.record.visit.patient;
            return <tr key={d.id} className="border-b last:border-0"><td className="px-4 py-3 font-medium">{p.name}</td><td className="px-4 py-3">{p.owner.name}</td><td className="px-4 py-3">{d.item.name}</td><td className="px-4 py-3">{formatDate(d.nextDue!)}</td></tr>;
          })}
        </Table>
      </section>
    </div>
  );
}
