import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ClinicalTags } from "@/components/clinical-flags";
import { ConfirmButton } from "@/components/confirm-button";
import { MoreMenu, menuItemClass } from "@/components/more-menu";
import { EmptyState } from "@/components/page-header";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { addDays, isNoShow, monthGrid, parseMonth, parseYmd, shiftMonth } from "@/lib/appointment-calc";
import { countAppointmentsByDay, listAppointments, listAppointmentsOn, type AppointmentRow } from "@/lib/appointments";
import { todayJakarta } from "@/lib/date";
import { formatDate, formatTime } from "@/lib/format";
import { requireCapability } from "@/lib/require-role";
import { listDoctors } from "@/lib/visits";
import { cn } from "@/lib/utils";
import { cancelAppointmentAction, startVisitAction } from "./actions";

type Params = { tampilan?: string; tanggal?: string; bulan?: string; dokter?: string; q?: string; status?: string };

const VIEWS = [
  { id: "hari", label: "Per Hari" },
  { id: "bulan", label: "Kalender Bulanan" },
  { id: "semua", label: "Semua Daftar" },
] as const;

const STATUS = { TERJADWAL: { label: "Terjadwal", tone: "info" }, SELESAI: { label: "Selesai", tone: "success" }, BATAL: { label: "Batal", tone: "neutral" } } as const;
const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const pill = (active: boolean) => cn("flex h-11 shrink-0 items-center rounded-lg border px-4 text-sm font-medium", active ? "border-primary bg-accent text-primary" : "bg-card");

function Rows({ rows, today, showDate }: { rows: AppointmentRow[]; today: string; showDate: boolean }) {
  return (
    <div className="overflow-x-auto rounded-[10px] border bg-card">
      <table className="w-full min-w-[720px] text-[14.5px]">
        <thead>
          <tr className="border-b text-left text-[13px] text-muted-foreground">
            <th className="px-4 py-2.5 font-normal">{showDate ? "Tanggal & jam" : "Jam"}</th>
            <th className="px-4 py-2.5 font-normal">Pasien</th>
            <th className="px-4 py-2.5 font-normal">Keperluan</th>
            <th className="px-4 py-2.5 font-normal">Dokter</th>
            <th className="px-4 py-2.5 font-normal">Status</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={6}><EmptyState action={<Button asChild><Link href="/janji-temu/baru">+ Janji Temu Baru</Link></Button>}>Tidak ada janji temu.</EmptyState></td></tr>
          )}
          {rows.map((a) => {
            const noShow = isNoShow(a.status, a.scheduledAt, today);
            return (
              <tr key={a.id} className={cn("border-b last:border-0", a.status === "BATAL" && "text-muted-foreground")}>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums">{showDate && <div className="text-[13px] text-muted-foreground">{formatDate(a.scheduledAt)}</div>}{formatTime(a.scheduledAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link href={`/pasien?id=${a.patient.id}`} className="font-medium">{a.patient.name}</Link>
                    <ClinicalTags allergyNote={a.patient.allergyNote} aggressive={a.patient.aggressive} />
                  </div>
                  <div className="text-[13px] text-muted-foreground">{a.patient.species} · {a.patient.owner.name}</div>
                </td>
                <td className="max-w-64 px-4 py-3"><div className="truncate">{a.purpose}</div>{a.notes && <div className="truncate text-[13px] text-muted-foreground">{a.notes}</div>}</td>
                <td className="px-4 py-3">{a.doctor.name}</td>
                <td className="px-4 py-3">{noShow ? <StatusChip tone="danger">Tidak datang</StatusChip> : <StatusChip tone={STATUS[a.status].tone}>{STATUS[a.status].label}</StatusChip>}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {a.status === "TERJADWAL" && (
                      <>
                        <form action={startVisitAction.bind(null, a.id)}><Button type="submit">Mulai kunjungan</Button></form>
                        <MoreMenu iconOnly label="Aksi lain">
                          <Link role="menuitem" href={`/janji-temu/${a.id}/ubah`} className={menuItemClass}>Ubah / jadwalkan ulang</Link>
                          <form action={cancelAppointmentAction.bind(null, a.id)}>
                            <ConfirmButton variant="ghost" confirmLabel="Ya, batalkan" message={`Batalkan janji temu ${a.patient.name}?`} className={`${menuItemClass} h-auto justify-start rounded-md px-3 font-medium text-destructive`}>Batalkan janji temu</ConfirmButton>
                          </form>
                        </MoreMenu>
                      </>
                    )}
                    {a.status === "SELESAI" && a.visitId && <Button asChild variant="outline"><Link href="/kunjungan">Lihat kunjungan</Link></Button>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function AppointmentsPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireCapability("create_visit");
  const params = await searchParams;
  const today = todayJakarta().toISOString().slice(0, 10);
  const view = VIEWS.some((v) => v.id === params.tampilan) ? params.tampilan! : "hari";
  const day = parseYmd(params.tanggal) ?? today;
  const month = parseMonth(params.bulan, day);
  const doctors = await listDoctors();
  const doctorId = doctors.some((d) => d.id === params.dokter) ? params.dokter : undefined;
  const href = (extra: Params) => `/janji-temu?${new URLSearchParams(Object.entries({ tampilan: view, ...(view === "hari" && { tanggal: day }), ...(view === "bulan" && { bulan: month }), ...(doctorId && { dokter: doctorId }), ...extra }).filter(([, v]) => v) as [string, string][])}`;
  const newHref = view === "hari" ? `/janji-temu/baru?tanggal=${day}` : "/janji-temu/baru";

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold leading-11">Janji Temu</h1>
          <p className="text-sm text-muted-foreground">Jadwal harian, per dokter, dan kalender klinik.</p>
        </div>
        <Button asChild><Link href={newHref}>+ Janji Temu Baru</Link></Button>
      </header>

      <div role="tablist" className="flex gap-1.5 overflow-x-auto">
        {VIEWS.map((v) => (
          <Link key={v.id} href={`/janji-temu?${new URLSearchParams({ tampilan: v.id, ...(doctorId && { dokter: doctorId }) })}`} role="tab" aria-selected={view === v.id} className={pill(view === v.id)}>{v.label}</Link>
        ))}
      </div>

      {view !== "semua" && (
        <div className="flex flex-wrap gap-1.5">
          <Link href={href({ dokter: "" })} className={cn(pill(!doctorId), "h-10")}>Semua dokter</Link>
          {doctors.map((d) => <Link key={d.id} href={href({ dokter: d.id })} className={cn(pill(doctorId === d.id), "h-10")}>{d.name}</Link>)}
        </div>
      )}

      {view === "hari" && <DayView day={day} today={today} doctorId={doctorId} href={href} />}
      {view === "bulan" && <MonthView month={month} today={today} doctorId={doctorId} />}
      {view === "semua" && <AllView params={params} doctors={doctors} today={today} />}
    </div>
  );
}

async function DayView({ day, today, doctorId, href }: { day: string; today: string; doctorId?: string; href: (p: Params) => string }) {
  const rows = await listAppointmentsOn(day, doctorId);
  const active = rows.filter((r) => r.status !== "BATAL");
  const strip = Array.from({ length: 14 }, (_, i) => addDays(day, i - 3));
  const label = new Date(`${day}T00:00:00+07:00`).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 overflow-x-auto rounded-[10px] border bg-card p-3">
        <Link href={href({ tanggal: addDays(day, -7) })} aria-label="Minggu sebelumnya" className="flex size-11 shrink-0 items-center justify-center rounded-lg border"><ChevronLeft className="size-4" /></Link>
        {strip.map((d) => {
          const date = new Date(`${d}T00:00:00+07:00`);
          const selected = d === day;
          return (
            <Link key={d} href={href({ tanggal: d })} aria-current={selected ? "date" : undefined} className={cn("flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-lg border text-sm", selected ? "border-primary bg-primary text-primary-foreground" : "bg-card", d === today && !selected && "border-primary")}>
              <span className="text-[11px] uppercase opacity-80">{date.toLocaleDateString("id-ID", { weekday: "short", timeZone: "Asia/Jakarta" })}</span>
              <span className="text-lg font-semibold">{date.toLocaleDateString("id-ID", { day: "numeric", timeZone: "Asia/Jakarta" })}</span>
            </Link>
          );
        })}
        <Link href={href({ tanggal: addDays(day, 7) })} aria-label="Minggu berikutnya" className="flex size-11 shrink-0 items-center justify-center rounded-lg border"><ChevronRight className="size-4" /></Link>
        <Link href={href({ tanggal: today })} className="ml-1 flex h-11 shrink-0 items-center rounded-lg border px-4 text-sm font-medium">Hari ini</Link>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">{label}</h2>
        <span className="text-sm text-muted-foreground">{active.length} janji temu · {active.filter((r) => r.status === "TERJADWAL").length} menunggu · {active.filter((r) => r.status === "SELESAI").length} selesai</span>
      </div>
      <Rows rows={rows} today={today} showDate={false} />
    </div>
  );
}

async function MonthView({ month, today, doctorId }: { month: string; today: string; doctorId?: string }) {
  const grid = monthGrid(month);
  const counts = await countAppointmentsByDay(grid[0][0].ymd, grid.at(-1)![6].ymd, doctorId);
  const title = new Date(`${month}-01T00:00:00Z`).toLocaleDateString("id-ID", { month: "long", year: "numeric", timeZone: "UTC" });
  const nav = (ym: string) => `/janji-temu?${new URLSearchParams({ tampilan: "bulan", bulan: ym, ...(doctorId && { dokter: doctorId }) })}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Link href={nav(shiftMonth(month, -1))} aria-label="Bulan sebelumnya" className="flex size-11 items-center justify-center rounded-lg border bg-card"><ChevronLeft className="size-4" /></Link>
        <h2 className="text-base font-semibold capitalize">{title}</h2>
        <Link href={nav(shiftMonth(month, 1))} aria-label="Bulan berikutnya" className="flex size-11 items-center justify-center rounded-lg border bg-card"><ChevronRight className="size-4" /></Link>
      </div>
      <div className="overflow-hidden rounded-[10px] border bg-card">
        <div className="grid grid-cols-7 border-b text-center text-[12.5px] text-muted-foreground">
          {WEEKDAYS.map((w) => <div key={w} className="py-2">{w}</div>)}
        </div>
        {grid.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b last:border-0">
            {week.map(({ ymd, inMonth }) => {
              const n = counts[ymd] ?? 0;
              return (
                <Link key={ymd} href={`/janji-temu?${new URLSearchParams({ tampilan: "hari", tanggal: ymd, ...(doctorId && { dokter: doctorId }) })}`} className={cn("flex min-h-20 flex-col items-start gap-1 border-r p-2 last:border-0 hover:bg-muted/50", !inMonth && "bg-muted/30 text-muted-foreground")}>
                  <span className={cn("flex size-7 items-center justify-center rounded-full text-sm", ymd === today && "bg-primary font-semibold text-primary-foreground")}>{Number(ymd.slice(8))}</span>
                  {n > 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-[12px] font-medium text-primary">{n} janji</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

async function AllView({ params, doctors, today }: { params: Params; doctors: { id: string; name: string }[]; today: string }) {
  const status = params.status === "TERJADWAL" || params.status === "SELESAI" || params.status === "BATAL" ? params.status : undefined;
  const doctorId = doctors.some((d) => d.id === params.dokter) ? params.dokter : undefined;
  const rows = await listAppointments({ q: params.q, status, doctorId });
  const field = "h-11 rounded-lg border border-input bg-card px-3 text-sm";

  return (
    <div className="space-y-4">
      <form className="flex flex-wrap items-end gap-3 rounded-[10px] border bg-card p-4">
        <input type="hidden" name="tampilan" value="semua" />
        <label className="min-w-56 flex-1 space-y-1 text-[13px] text-muted-foreground">Cari<input name="q" defaultValue={params.q ?? ""} placeholder="Pasien, pemilik, atau keperluan" className={`${field} block w-full`} /></label>
        <label className="space-y-1 text-[13px] text-muted-foreground">Dokter
          <select name="dokter" defaultValue={doctorId ?? ""} className={`${field} block`}><option value="">Semua</option>{doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
        </label>
        <label className="space-y-1 text-[13px] text-muted-foreground">Status
          <select name="status" defaultValue={status ?? ""} className={`${field} block`}><option value="">Semua</option><option value="TERJADWAL">Terjadwal</option><option value="SELESAI">Selesai</option><option value="BATAL">Batal</option></select>
        </label>
        <Button type="submit">Terapkan</Button>
        <Link href="/janji-temu?tampilan=semua" className="flex h-11 items-center px-2 text-sm font-medium text-primary">Reset</Link>
      </form>
      <Rows rows={rows} today={today} showDate />
      {rows.length === 100 && <p className="text-[13px] text-muted-foreground">Menampilkan 100 janji temu terbaru. Persempit dengan pencarian atau filter.</p>}
    </div>
  );
}
