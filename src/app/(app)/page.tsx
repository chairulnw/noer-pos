import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { ClinicalTags } from "@/components/clinical-flags";
import { EmptyState } from "@/components/page-header";
import { ModulesDialog } from "@/components/modules-dialog";
import { TrendChart } from "@/components/trend-chart";
import { BedDouble, Hotel, PawPrint, Receipt, ShoppingCart, Stethoscope, Scissors, TrendingDown, TrendingUp, UserRound, Users, Wallet, type LucideIcon } from "lucide-react";
import { getCashierQueue, getDashboardCounts, getDashboardSummary, getDoctorQueue } from "@/lib/dashboard";
import { todayJakarta } from "@/lib/date";
import { getStockAlerts } from "@/lib/inventory";
import { periodRange, periodSeries, resolveRange, type TrendPeriod } from "@/lib/report";
import { getCostsByDay } from "@/lib/costs";
import { getSalesByDay, getVisitStats } from "@/lib/reports";
import { Button } from "@/components/ui/button";
import { formatDate, formatRupiah, formatTime } from "@/lib/format";
import { can, type Capability } from "@/lib/permissions";
import { requireUser } from "@/lib/require-role";
import { cn } from "@/lib/utils";

const TONE = {
  success: "bg-success/10 text-success",
  info: "bg-info/10 text-info",
  warning: "bg-warning/10 text-warning",
  primary: "bg-accent text-primary",
  danger: "bg-destructive/10 text-destructive",
} as const;

const TILES = [
  { href: "/kasir", label: "Kasir (POS)", icon: ShoppingCart, tone: "success", capability: "manage_invoice_payment" },
  { href: "/rekam-medis", label: "Rekam Medis", icon: Stethoscope, tone: "info", capability: "view_medical_record" },
  { href: "/pembayaran", label: "Transaksi (Lunas)", icon: Receipt, tone: "warning", capability: "manage_invoice_payment" },
  { href: "/pet-hotel", label: "Pet Hotel", icon: Hotel, tone: "info", capability: "manage_admission" },
  { href: "/grooming", label: "Grooming", icon: Scissors, tone: "success", capability: "create_visit" },
] as const satisfies readonly { href: string; label: string; icon: LucideIcon; tone: keyof typeof TONE; capability: Capability }[];

const METRICS = [
  { id: "pendapatan", label: "Pendapatan", money: true },
  { id: "kunjungan", label: "Kunjungan", money: false },
  { id: "pengeluaran", label: "Pengeluaran", money: true },
] as const;

function Tile({ href, label, icon: Icon, tone }: { href: string; label: string; icon: LucideIcon; tone: keyof typeof TONE }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-3 rounded-2xl border bg-card px-3 py-5 text-center text-[14px] font-semibold hover:border-primary/40">
      <span className={cn("grid size-14 place-items-center rounded-2xl", TONE[tone])}><Icon className="size-6" /></span>
      {label}
    </Link>
  );
}

function BigStat({ label, value, hint, icon: Icon, tone, href }: { label: string; value: string; hint: string; icon: LucideIcon; tone: keyof typeof TONE; href?: string }) {
  const body = (
    <div className="h-full rounded-2xl border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className={cn("grid size-10 place-items-center rounded-xl", TONE[tone])}><Icon className="size-5" /></span>
      </div>
      <div className="mt-4 text-[26px] font-bold leading-none tabular-nums">{value}</div>
      <div className="mt-2 text-sm text-muted-foreground">{hint}</div>
    </div>
  );
  return href ? <Link href={href} className="block h-full">{body}</Link> : body;
}

function MiniStat({ label, value, icon: Icon, tone, danger, href }: { label: string; value: string; icon: LucideIcon; tone: keyof typeof TONE; danger?: boolean; href?: string }) {
  const body = (
    <div className="flex h-full flex-col items-center gap-2 rounded-2xl border bg-card px-3 py-5 text-center">
      <span className={cn("grid size-12 place-items-center rounded-xl", TONE[tone])}><Icon className="size-5" /></span>
      <span className={cn("text-2xl font-bold tabular-nums", danger && "text-destructive")}>{value}</span>
      <span className="text-[12.5px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
    </div>
  );
  return href ? <Link href={href} className="block h-full">{body}</Link> : body;
}

const DOT = { danger: "bg-destructive", warning: "bg-warning", info: "bg-info" };

function AlertRow({ tone, title, detail, href, action }: { tone: keyof typeof DOT; title: string; detail: string; href: string; action: string }) {
  return (
    <div className="flex min-h-14 items-center gap-3 border-b last:border-0">
      <span className={`size-2 shrink-0 rounded-full ${DOT[tone]}`} />
      <div className="min-w-0 flex-1 py-2">
        <div className="truncate text-[13.5px] font-medium">{title}</div>
        <div className="text-[12.5px] text-muted-foreground">{detail}</div>
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
        <div className="flex flex-wrap items-center gap-1.5 text-[13.5px] font-medium">{title}</div>
        <div className="truncate text-[12.5px] text-muted-foreground">{detail}</div>
      </div>
      <Button asChild variant="outline"><Link href={href}>{action}</Link></Button>
    </div>
  );
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ metrik?: string; periode?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const showRevenue = can(user.role, "view_revenue_reports");
  const metrics = METRICS.filter((m) => !m.money || showRevenue);
  const metric = metrics.find((m) => m.id === params.metrik) ?? metrics.find((m) => m.id === "kunjungan")!;
  const period: TrendPeriod = params.periode === "tahun" ? "tahun" : "bulan";
  const today = todayJakarta();
  const { from, to } = periodRange(period, today);
  const range = resolveRange({ from, to }, today);
  if ("error" in range) throw new Error(range.error);

  const [summary, counts, series] = await Promise.all([
    getDashboardSummary(showRevenue),
    getDashboardCounts(showRevenue),
    (async () => {
      if (metric.id === "kunjungan") return Object.fromEntries((await getVisitStats(range)).perDay.map((d) => [d.day, d.count]));
      if (metric.id === "pengeluaran") return getCostsByDay(from, to);
      return Object.fromEntries((await getSalesByDay(range)).map((d) => [d.day, d.sales]));
    })(),
  ]);
  const alerts = can(user.role, "manage_stock") ? await getStockAlerts() : null;
  const doctorQueue = user.role === "DOKTER" ? await getDoctorQueue(user.id) : null;
  const cashierQueue = user.role === "KASIR" ? await getCashierQueue() : null;
  const total = alerts ? alerts.low.length + alerts.expiring.length : 0;

  const points = periodSeries(series, from, to, period);
  const sum = points.reduce((t, p) => t + p.value, 0);
  const fmt = (n: number) => (metric.money ? formatRupiah(n) : n.toLocaleString("id-ID"));
  const label = (key: string) => (period === "tahun" ? new Date(`${key}-01T00:00:00+07:00`).toLocaleDateString("id-ID", { month: "short", year: "numeric", timeZone: "Asia/Jakarta" }) : formatDate(new Date(`${key}T00:00:00+07:00`)));
  const tiles = TILES.filter((t) => can(user.role, t.capability)).slice(0, 3);
  const staying = summary.rawatInap + summary.hotel;

  return (
    <div className="space-y-6">
      {(doctorQueue || cashierQueue) && <AutoRefresh seconds={15} />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => <Tile key={t.href} {...t} />)}
        <ModulesDialog role={user.role} />
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Statistik Operasional Klinik</h2>
        <div className={cn("grid gap-3", summary.revenue && "lg:grid-cols-2")}>
          {summary.revenue && <BigStat label="Omzet hari ini" value={formatRupiah(summary.revenue.total)} hint={`${summary.revenue.invoices} invoice final, tanpa PPN`} icon={Wallet} tone="success" />}
          <BigStat label="Rawat inap & hotel" value={`${staying} Pasien`} hint={`${summary.rawatInap} rawat inap · ${summary.hotel} hotel`} icon={BedDouble} tone="warning" href={can(user.role, "monitor_admission") ? "/rawat-inap" : undefined} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <MiniStat label="Pasien" value={counts.patients.toLocaleString("id-ID")} icon={PawPrint} tone="info" href={can(user.role, "manage_patients") ? "/pasien" : undefined} />
          <MiniStat label="Pemilik" value={counts.owners.toLocaleString("id-ID")} icon={Users} tone="primary" href={can(user.role, "manage_patients") ? "/pemilik" : undefined} />
          {counts.opex !== null ? (
            <MiniStat label="Operasional bulan ini" value={formatRupiah(counts.opex)} icon={TrendingDown} tone="danger" danger href="/biaya-operasional" />
          ) : (
            <MiniStat label="Kunjungan hari ini" value={String(summary.visits)} icon={UserRound} tone="danger" />
          )}
        </div>
      </section>

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

      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-xl font-bold"><TrendingUp className="size-5 text-info" /> Tren Statistik</h2>
          <div className="flex rounded-xl bg-muted/60 p-1 text-sm font-medium">
            {(["bulan", "tahun"] as const).map((p) => (
              <Link key={p} href={`/?metrik=${metric.id}&periode=${p}`} className={cn("rounded-lg px-4 py-1.5", p === period ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}>{p === "bulan" ? "Bulan Ini" : "Tahun Ini"}</Link>
            ))}
          </div>
        </div>
        <div className={cn("grid gap-2", metrics.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-1")}>
          {metrics.map((m) => (
            <Link key={m.id} href={`/?metrik=${m.id}&periode=${period}`} className={cn("rounded-xl border px-4 py-2.5 text-center text-[14px] font-semibold", m.id === metric.id ? "border-primary bg-accent text-primary" : "bg-card text-muted-foreground")}>{m.label}</Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 text-sm font-semibold">
          <span className="rounded-lg border border-primary/30 bg-accent px-3 py-1.5 text-primary">Total: {fmt(sum)}</span>
          <span className="rounded-lg bg-muted/60 px-3 py-1.5 text-muted-foreground">Rata-rata: {fmt(points.length ? Math.round(sum / points.length) : 0)}</span>
        </div>
        <TrendChart
          title={`${metric.label} ${period === "tahun" ? "bulanan" : "harian"}`}
          total={fmt(sum)}
          maxText={fmt(Math.max(0, ...points.map((p) => p.value)))}
          points={points.map((p) => ({ label: label(p.key), value: p.value, text: fmt(p.value) }))}
        />
      </section>

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
          <p className="pt-3 text-[12.5px] text-muted-foreground">Peringatan hampir expired: {alerts.warnDays} hari (Pengaturan). Batch expired tidak bisa dijual.</p>
        </section>
      )}
    </div>
  );
}
