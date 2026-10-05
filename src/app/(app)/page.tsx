import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { ClinicalTags } from "@/components/clinical-flags";
import { EmptyState } from "@/components/page-header";
import { TrendChart } from "@/components/trend-chart";
import { getCashierQueue, getDashboardSummary, getDoctorQueue } from "@/lib/dashboard";
import { todayJakarta } from "@/lib/date";
import { getStockAlerts } from "@/lib/inventory";
import { daysBetween, fillDays, resolveRange, sumRows, trendRange, TREND_DAYS } from "@/lib/report";
import { getSalesByDay, getVisitStats } from "@/lib/reports";
import { Button } from "@/components/ui/button";
import { formatDate, formatRupiah, formatTime } from "@/lib/format";
import { can } from "@/lib/permissions";
import { requireUser } from "@/lib/require-role";
import { cn } from "@/lib/utils";

const DOT = { danger: "bg-destructive", warning: "bg-warning", info: "bg-info" };

function Stat({ label, value, hint, href }: { label: string; value: string; hint?: string; href?: string }) {
  const body = (
    <div className="h-full rounded-[10px] border bg-card p-4">
      <div className="text-[13px] text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-[13px] text-muted-foreground">{hint}</div>}
    </div>
  );
  return href ? <Link href={href} className="block h-full">{body}</Link> : body;
}

function AlertRow({ tone, title, detail, href, action }: { tone: keyof typeof DOT; title: string; detail: string; href: string; action: string }) {
  return (
    <div className="flex min-h-14 items-center gap-3 border-b last:border-0">
      <span className={`size-2 shrink-0 rounded-full ${DOT[tone]}`} />
      <div className="min-w-0 flex-1 py-2">
        <div className="truncate text-[14.5px] font-medium">{title}</div>
        <div className="text-[13px] text-muted-foreground">{detail}</div>
      </div>
      <Link href={href} className="inline-flex min-h-11 items-center px-1 text-sm font-medium text-primary">{action}</Link>
    </div>
  );
}

function Queue({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[10px] border bg-card px-5 pb-1 pt-4">
      <h2 className="mb-1 text-base font-semibold">{title}{count > 0 && <span className="ml-2 text-sm font-medium text-primary">{count}</span>}</h2>
      {children}
    </section>
  );
}

function QueueRow({ title, detail, href, action }: { title: React.ReactNode; detail: string; href: string; action: string }) {
  return (
    <div className="flex min-h-14 items-center gap-3 border-b last:border-0">
      <div className="min-w-0 flex-1 py-2">
        <div className="flex flex-wrap items-center gap-1.5 text-[14.5px] font-medium">{title}</div>
        <div className="truncate text-[13px] text-muted-foreground">{detail}</div>
      </div>
      <Button asChild variant="outline"><Link href={href}>{action}</Link></Button>
    </div>
  );
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ tren?: string }> }) {
  const user = await requireUser();
  const trend = trendRange(Number((await searchParams).tren), todayJakarta());
  const range = resolveRange({ from: trend.from, to: trend.to }, todayJakarta());
  if ("error" in range) throw new Error(range.error);
  const showRevenue = can(user.role, "view_revenue_reports");
  const [sales, visits] = await Promise.all([showRevenue ? getSalesByDay(range) : [], getVisitStats(range)]);
  const visitByDay = new Map(visits.perDay.map((d) => [d.day, d.count]));
  const dayLabel = (ymd: string) => formatDate(new Date(`${ymd}T00:00:00+07:00`));
  const summary = await getDashboardSummary(can(user.role, "view_revenue_reports"));
  const alerts = can(user.role, "manage_stock") ? await getStockAlerts() : null;
  const doctorQueue = user.role === "DOKTER" ? await getDoctorQueue(user.id) : null;
  const cashierQueue = user.role === "KASIR" ? await getCashierQueue() : null;
  const total = alerts ? alerts.low.length + alerts.expiring.length : 0;

  return (
    <div className="space-y-5">
      {(doctorQueue || cashierQueue) && <AutoRefresh seconds={15} />}
      <div className="space-y-1">
        <h1 className="text-[22px] font-semibold leading-11">Beranda</h1>
        <p className="text-sm text-muted-foreground">Halo, {user.name}.</p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
        {summary.revenue && <Stat label="Omzet hari ini (tanpa PPN)" value={formatRupiah(summary.revenue.total)} hint={`${summary.revenue.invoices} invoice final`} />}
        <Stat label="Kunjungan hari ini" value={String(summary.visits)} href={can(user.role, "create_visit") ? "/kunjungan" : undefined} />
        <Stat label="Rawat inap aktif" value={String(summary.rawatInap)} href={can(user.role, "monitor_admission") ? "/rawat-inap" : undefined} />
        <Stat label="Hotel aktif" value={String(summary.hotel)} href={can(user.role, "monitor_admission") ? "/pet-hotel" : undefined} />
      </div>

      {doctorQueue && (
        <Queue title="Pasien menunggu diperiksa" count={doctorQueue.length}>
          {doctorQueue.length === 0 && <EmptyState>Tidak ada pasien yang menunggu.</EmptyState>}
          {doctorQueue.map((v) => (
            <QueueRow
              key={v.id}
              title={<>{v.patient.name} <ClinicalTags allergyNote={v.patient.allergyNote} aggressive={v.patient.aggressive} /></>}
              detail={`${v.patient.species} · ${v.patient.rmNo} · ${formatTime(v.createdAt)} · ${v.complaint}`}
              href={`/rekam-medis/${v.id}`}
              action="Periksa"
            />
          ))}
        </Queue>
      )}

      {cashierQueue && (
        <>
          {!cashierQueue.cashClosed && (
            <Link href="/tutup-kas" className="flex min-h-11 items-center justify-between gap-3 rounded-[10px] border border-warning/40 bg-card px-4 py-2.5 text-sm">
              <span><b className="font-semibold text-warning">Kas hari ini belum ditutup.</b> Tutup kas setelah transaksi terakhir.</span>
              <span className="font-medium text-primary">Tutup kas</span>
            </Link>
          )}
          <Queue title="Menunggu pembayaran" count={cashierQueue.waiting.length}>
            {cashierQueue.waiting.length === 0 && <EmptyState>Tidak ada kunjungan di kasir.</EmptyState>}
            {cashierQueue.waiting.map((v) => (
              <QueueRow
                key={v.id}
                title={v.patient.name}
                detail={`${v.patient.owner.name} · ${v.patient.rmNo}${v.invoices[0] ? ` · ${formatRupiah(v.invoices[0].grandTotal)}` : ""}`}
                href={v.invoices[0] ? `/invoice/${v.invoices[0].id}` : "/invoice"}
                action="Buka invoice"
              />
            ))}
          </Queue>
          <Queue title="Draft retail" count={cashierQueue.drafts.length}>
            {cashierQueue.drafts.length === 0 && <EmptyState action={<Button asChild variant="outline"><Link href="/retail">Mulai retail walk-in</Link></Button>}>Tidak ada draft retail.</EmptyState>}
            {cashierQueue.drafts.map((d) => (
              <QueueRow key={d.id} title={d.customerName ?? "Tanpa nama"} detail={`${d.invoiceNo} · ${formatRupiah(d.grandTotal)}`} href={`/invoice/${d.id}`} action="Lanjutkan" />
            ))}
          </Queue>
        </>
      )}

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Tren</h2>
        <div className="flex gap-1.5">
          {TREND_DAYS.map((n) => (
            <Link key={n} href={`/?tren=${n}`} className={cn("flex h-11 items-center rounded-lg border px-4 text-sm font-medium", n === trend.days ? "border-primary bg-accent text-primary" : "bg-card")}>{n} hari</Link>
          ))}
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {showRevenue && (
          <TrendChart
            title="Omzet harian"
            total={formatRupiah(sumRows(sales).sales)}
            maxText={formatRupiah(Math.max(0, ...sales.map((d) => d.sales)))}
            points={fillDays(sales, trend.from, trend.to).map((d) => ({ label: dayLabel(d.day), value: d.sales, text: formatRupiah(d.sales) }))}
          />
        )}
        <TrendChart
          title="Kunjungan harian"
          total={`${visits.perDay.reduce((t, d) => t + d.count, 0)} kunjungan`}
          maxText={String(Math.max(0, ...visits.perDay.map((d) => d.count)))}
          points={daysBetween(trend.from, trend.to).map((d) => ({ label: dayLabel(d), value: visitByDay.get(d) ?? 0, text: `${visitByDay.get(d) ?? 0} kunjungan` }))}
        />
      </div>

      {alerts && (
        <section className="rounded-[10px] border bg-card p-5">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h2 className="text-base font-semibold">Notifikasi stok{total > 0 && <span className="ml-2 text-sm font-medium text-warning">{total}</span>}</h2>
            <Link href="/inventaris" className="text-sm font-medium text-primary">Lihat inventaris</Link>
          </div>
          {total === 0 && <p className="py-4 text-sm text-muted-foreground">Tidak ada stok yang perlu perhatian.</p>}
          {alerts.low.map((l) => (
            <AlertRow
              key={`low-${l.id}`}
              tone={l.usable === 0 ? "danger" : "warning"}
              title={l.name}
              detail={`${l.usable === 0 ? "Habis" : `Sisa ${l.usable.toLocaleString("id-ID")} ${l.unit}`} · min. ${l.threshold.toLocaleString("id-ID")} ${l.unit}`}
              href={`/inventaris/masuk?item=${l.id}`}
              action="Stok masuk"
            />
          ))}
          {alerts.expiring.map((e) => (
            <AlertRow
              key={`exp-${e.id}-${e.batchNo}`}
              tone={e.level === "EXPIRED" ? "danger" : "info"}
              title={`${e.name} · ${e.batchNo}`}
              detail={`${e.level === "EXPIRED" ? "Sudah expired" : "Expired"} ${formatDate(e.expiry)} · ${e.qty.toLocaleString("id-ID")} ${e.unit}`}
              href={`/inventaris/${e.id}`}
              action="Kartu stok"
            />
          ))}
          <p className="pt-3 text-[13px] text-muted-foreground">Peringatan hampir expired: {alerts.warnDays} hari (Pengaturan). Batch expired tidak bisa dijual.</p>
        </section>
      )}
    </div>
  );
}
