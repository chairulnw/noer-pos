import Link from "next/link";
import { Scale } from "lucide-react";
import { ListHeader } from "@/components/data-table";
import { ProfitChart } from "@/components/profit-chart";
import { Button } from "@/components/ui/button";
import { earliestCostDate, getCostsByCategory, getCostsByDay } from "@/lib/costs";
import { todayJakarta } from "@/lib/date";
import { formatDate, formatRupiah } from "@/lib/format";
import { PL_PRESETS, profitSeries, resolveRange, sumProfit } from "@/lib/report";
import { getSalesByDay } from "@/lib/reports";
import { requireCapability } from "@/lib/require-role";
import { cn } from "@/lib/utils";

type Params = { preset?: string; from?: string; to?: string };

const field = "h-11 rounded-lg border border-input bg-card px-3 text-sm";
const monthLabel = (ym: string) => new Date(`${ym}-01T00:00:00Z`).toLocaleDateString("id-ID", { month: "short", year: "numeric", timeZone: "UTC" });
const dayLabel = (ymd: string) => formatDate(new Date(`${ymd}T00:00:00+07:00`));

export default async function ProfitLossPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireCapability("view_revenue_reports");
  const params = await searchParams;
  const range = resolveRange(params, todayJakarta(), params.preset === "semua" ? await earliestCostDate() : null);
  const link = (preset: string) => `/laba-rugi?preset=${preset}`;

  const filter = (
    <form className="space-y-3 rounded-[10px] border bg-card p-4">
      <div className="text-[12.5px] font-semibold tracking-wide text-muted-foreground uppercase">Filter periode & tanggal</div>
      <div className="flex flex-wrap items-end gap-2">
        {PL_PRESETS.map((p) => (
          <Link key={p.id} href={link(p.id)} className={cn("flex h-10 items-center rounded-full border px-4 text-sm font-medium", !("error" in range) && range.preset === p.id ? "border-primary bg-accent text-primary" : "bg-card text-muted-foreground")}>{p.label}</Link>
        ))}
        <label className="ml-2 space-y-1 text-[12.5px] text-muted-foreground">Dari<input type="date" name="from" defaultValue={"error" in range ? params.from : range.from} className={`${field} block`} /></label>
        <label className="space-y-1 text-[12.5px] text-muted-foreground">Sampai<input type="date" name="to" defaultValue={"error" in range ? params.to : range.to} className={`${field} block`} /></label>
        <Button type="submit" variant="outline">Terapkan</Button>
      </div>
    </form>
  );

  if ("error" in range) {
    return (
      <div className="space-y-4">
        <ListHeader icon={Scale} title="Laporan Laba Rugi" />
        {filter}
        <p role="alert" className="text-sm text-destructive">{range.error}</p>
      </div>
    );
  }

  const [sales, opex, categories] = await Promise.all([getSalesByDay(range), getCostsByDay(range.from, range.to), getCostsByCategory(range.from, range.to)]);
  const { points, monthly } = profitSeries(sales, opex, range.from, range.to);
  const total = sumProfit(points);
  const invoices = sales.reduce((n, r) => n + r.invoices, 0);
  const costCount = categories.reduce((n, c) => n + c.count, 0);
  const gross = total.sales - total.cost;
  const surplus = total.net >= 0;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <ListHeader icon={Scale} title="Laporan Laba Rugi" subtitle="Pendapatan (tanpa PPN) dikurangi HPP dan biaya operasional. Hanya invoice FINAL." />
      {filter}

      <section className={cn("rounded-[10px] p-5 text-white", surplus ? "bg-[#0F8B7A]" : "bg-[#B3402F]")}>
        <div className="text-[12.5px] font-semibold tracking-wide uppercase opacity-90">Laba bersih (net profit)</div>
        <div className="mt-1 text-4xl font-semibold tabular-nums">{formatRupiah(total.net)}</div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/30 pt-3 text-sm">
          <span>{surplus ? "Klinik dalam kondisi surplus operasional" : "Klinik defisit pada periode ini"}</span>
          <span className="font-semibold">Margin: {total.sales > 0 ? (Math.round((total.net / total.sales) * 1000) / 10).toLocaleString("id-ID") : "0"}%</span>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[10px] border bg-card p-4"><div className="text-[12.5px] font-semibold tracking-wide text-muted-foreground uppercase">Pendapatan</div><div className="mt-1 text-xl font-semibold text-success tabular-nums">{formatRupiah(total.sales)}</div><div className="text-[12.5px] text-muted-foreground">{invoices} transaksi</div></div>
        <div className="rounded-[10px] border bg-card p-4"><div className="text-[12.5px] font-semibold tracking-wide text-muted-foreground uppercase">HPP</div><div className="mt-1 text-xl font-semibold tabular-nums">{formatRupiah(total.cost)}</div><div className="text-[12.5px] text-muted-foreground">harga beli saat transaksi</div></div>
        <div className="rounded-[10px] border bg-card p-4"><div className="text-[12.5px] font-semibold tracking-wide text-muted-foreground uppercase">Laba kotor</div><div className="mt-1 text-xl font-semibold tabular-nums">{formatRupiah(gross)}</div><div className="text-[12.5px] text-muted-foreground">pendapatan − HPP</div></div>
        <div className="rounded-[10px] border bg-card p-4"><div className="text-[12.5px] font-semibold tracking-wide text-muted-foreground uppercase">Pengeluaran</div><div className="mt-1 text-xl font-semibold text-destructive tabular-nums">{formatRupiah(total.opex)}</div><div className="text-[12.5px] text-muted-foreground">{costCount} pos biaya</div></div>
      </div>

      <ProfitChart
        title={monthly ? "Tren laba operasional bulanan" : "Tren laba operasional harian"}
        subtitle="Laba (pendapatan − HPP − biaya) pada periode terpilih. Sorot batang untuk detail"
        bars={points.map((p) => ({ label: monthly ? monthLabel(p.key) : dayLabel(p.key), value: p.net, text: formatRupiah(p.net) }))}
      />

      <section className="overflow-hidden rounded-[10px] border bg-card">
        <div className="flex items-baseline justify-between gap-3 border-b px-5 py-3">
          <h2 className="text-base font-semibold">Rincian beban operasional ({costCount})</h2>
          <Link href="/biaya-operasional" className="text-sm font-medium text-primary">Kelola biaya</Link>
        </div>
        {categories.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Tidak ada pengeluaran pada periode ini.</p>
        ) : (
          categories.map((c) => (
            <div key={c.category} className="flex items-center justify-between gap-3 border-b px-5 py-3 text-[13.5px] last:border-0">
              <span><span className="font-medium">{c.category}</span> <span className="text-[12.5px] text-muted-foreground">· {c.count} catatan</span></span>
              <span className="font-medium tabular-nums">{formatRupiah(c.total)}</span>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
