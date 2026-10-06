import Link from "next/link";
import { CheckCircle2, Hotel, Plus, Search } from "lucide-react";
import { MasterKandang, type MasterRoom } from "./master-dialog";
import { setCleaningAction } from "./actions";
import { billedDays } from "@/lib/admission-calc";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/page-header";
import { formatDate, formatRupiah } from "@/lib/format";
import { can } from "@/lib/permissions";
import { requireCapability } from "@/lib/require-role";
import { getHotelOverview } from "@/lib/rooms";
import { cn } from "@/lib/utils";

const TABS = ["menginap", "grid", "riwayat"] as const;
const STATE = {
  free: { label: "Tersedia", card: "border-success/40 bg-success/5 text-success", dot: "bg-success" },
  busy: { label: "Terisi", card: "border-destructive/40 bg-destructive/5 text-destructive", dot: "bg-destructive" },
  dirty: { label: "Dibersihkan", card: "border-warning/40 bg-warning/5 text-warning", dot: "bg-warning" },
} as const;

export default async function PetHotelPage({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string }> }) {
  const user = await requireCapability("manage_admission");
  const params = await searchParams;
  const tab = TABS.find((t) => t === params.tab) ?? "menginap";
  const q = params.q?.trim().toLowerCase() ?? "";
  const { rooms, stays, history } = await getHotelOverview();
  const now = new Date();

  const roomState = (r: (typeof rooms)[number]) => (r.needsCleaning ? "dirty" : r.admissions.length >= r.capacity ? "busy" : "free");
  const count = (s: "free" | "busy" | "dirty") => rooms.filter((r) => roomState(r) === s).length;
  const has = (...v: (string | null | undefined)[]) => !q || v.some((x) => x?.toLowerCase().includes(q));
  const shownStays = stays.filter((a) => has(a.patient.name, a.patient.owner.name, a.room.name));
  const shownRooms = rooms.filter((r) => has(r.name, r.suitableFor));
  const shownHistory = history.filter((a) => has(a.patient.name, a.patient.owner.name, a.room.name));
  const tabHref = (t: string) => `/pet-hotel?${new URLSearchParams({ tab: t, ...(params.q && { q: params.q }) })}`;
  const master: MasterRoom[] = rooms.map((r) => ({ id: r.id, name: r.name, suitableFor: r.suitableFor, dimensions: r.dimensions, rate: r.defaultRate?.sellPrice ?? null, capacity: r.capacity, state: r.admissions.length > 0 ? "busy" : roomState(r) }));

  const stat = (label: string, value: number, cls: string) => (
    <div className={cn("rounded-2xl border p-4", cls)}>
      <div className="text-[12px] font-bold tracking-wide uppercase opacity-80">{label}</div>
      <div className="mt-1 text-[28px] leading-none font-bold tabular-nums">{value}</div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-accent text-primary"><Hotel className="size-5" /></span>
        <h1 className="text-[22px] leading-tight font-semibold">Pet Hotel & Penitipan</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stat("Total kandang", rooms.length, "bg-card")}
        {stat("Kandang tersedia", count("free"), "border-success/40 bg-success/5 text-success")}
        {stat("Sedang terisi", count("busy"), "border-destructive/40 bg-destructive/5 text-destructive")}
        {stat("Perlu sanitasi", count("dirty"), "border-warning/40 bg-warning/5 text-warning")}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-3">
        <form action="/pet-hotel" className="flex min-w-60 flex-1 items-center gap-2.5 rounded-xl border border-input bg-background px-3 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
          <input type="hidden" name="tab" value={tab} />
          <Search className="size-[18px] text-muted-foreground" />
          <input name="q" defaultValue={params.q} data-search aria-label="Cari" placeholder="Cari pasien, pemilik, atau nomor kandang…" className="h-11 min-w-0 flex-1 bg-transparent text-[15px] outline-none" />
        </form>
        <MasterKandang rooms={master} canManage={can(user.role, "manage_rooms")} />
        <Button asChild><Link href="/pet-hotel/check-in"><Plus className="size-4" /> Check-In Boarding</Link></Button>
      </div>

      <nav className="flex flex-wrap gap-2 border-b pb-3" aria-label="Tampilan">
        {[["menginap", `Pasien Menginap (${stays.length})`], ["grid", `Grid Kandang (${rooms.length})`], ["riwayat", `Riwayat Check-Out (${history.length})`]].map(([t, label]) => (
          <Link key={t} href={tabHref(t)} aria-current={t === tab ? "page" : undefined} className={cn("rounded-full border px-4 py-1.5 text-sm font-semibold", t === tab ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground")}>{label}</Link>
        ))}
      </nav>

      {tab === "menginap" && (
        shownStays.length === 0 ? <EmptyState action={<Button asChild><Link href="/pet-hotel/check-in">+ Check-In Boarding</Link></Button>}>Tidak ada anabul yang sedang menginap.</EmptyState> : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {shownStays.map((a) => {
              const days = billedDays(a.checkIn, now);
              return (
                <div key={a.id} className="space-y-3 rounded-2xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-base font-bold">{a.patient.name}</div>
                      <div className="text-[13px] text-muted-foreground">Owner: {a.patient.owner.name}</div>
                    </div>
                    <span className="rounded-full border border-warning/40 bg-warning/10 px-2.5 py-0.5 text-[12px] font-bold text-warning">Kandang {a.room.name}</span>
                  </div>
                  <dl className="space-y-1 rounded-xl bg-muted/50 p-3 text-[13.5px]">
                    <div className="flex justify-between"><dt className="text-muted-foreground">Tgl Masuk:</dt><dd className="font-semibold">{formatDate(a.checkIn)}</dd></div>
                    {a.expectedCheckOut && <div className="flex justify-between"><dt className="text-muted-foreground">Estimasi Keluar:</dt><dd className="font-semibold">{formatDate(a.expectedCheckOut)}</dd></div>}
                    <div className="flex justify-between"><dt className="text-muted-foreground">Durasi Berjalan:</dt><dd className="font-semibold text-warning">{days} Hari ({formatRupiah(a.rateItem.sellPrice)}/hari)</dd></div>
                    <div className="flex justify-between border-t pt-1.5"><dt className="font-semibold">Estimasi Tagihan:</dt><dd className="font-bold tabular-nums">{formatRupiah(days * a.rateItem.sellPrice)}</dd></div>
                  </dl>
                  <div className="grid grid-cols-2 gap-2">
                    <Button asChild variant="outline"><Link href={`/pet-hotel/${a.id}`}>Edit Detail</Link></Button>
                    <Button asChild className="bg-success text-white hover:bg-success/90"><Link href={`/pet-hotel/${a.id}/check-out`}>Check-Out & Kasir</Link></Button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {tab === "grid" && (
        shownRooms.length === 0 ? <EmptyState>Belum ada kandang. Klik Master Kandang untuk menambah slot.</EmptyState> : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {shownRooms.map((r) => {
              const state = roomState(r);
              return (
                <div key={r.id} className={cn("space-y-1.5 rounded-2xl border p-4", STATE[state].card)}>
                  <div className="flex items-center justify-between"><span className="text-xl font-bold">{r.name}</span><span className={cn("size-2.5 rounded-full", STATE[state].dot)} /></div>
                  <div className="text-[14px] font-semibold text-foreground">{r.suitableFor ?? "Umum"}{r.capacity > 1 && ` · ${r.admissions.length}/${r.capacity}`}</div>
                  <div className="text-[12.5px] text-muted-foreground">{r.defaultRate ? `${formatRupiah(r.defaultRate.sellPrice)} / hari` : "Tarif belum diisi"}</div>
                  <div className="flex items-center justify-between border-t pt-2 text-[12px] font-bold tracking-wide uppercase">
                    {STATE[state].label}
                    {state === "dirty" && (
                      <form action={setCleaningAction.bind(null, r.id, false)}><Button type="submit" size="sm" variant="outline" className="h-8 normal-case"><CheckCircle2 className="size-3.5" /> Tandai bersih</Button></form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {tab === "riwayat" && (
        shownHistory.length === 0 ? <EmptyState>Belum ada riwayat check-out.</EmptyState> : (
          <div className="space-y-2.5">
            {shownHistory.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
                <CheckCircle2 className="size-5 text-success" />
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-semibold">{a.patient.name} • Kandang {a.room.name}</div>
                  <div className="text-[12.5px] text-muted-foreground">Check-Out: {a.checkOut ? formatDate(a.checkOut) : "—"} · Owner {a.patient.owner.name}</div>
                </div>
                {a.invoices[0] && can(user.role, "manage_invoice_payment") && <Link href={`/invoice/${a.invoices[0].id}`} className="text-sm font-medium text-primary">Tagihan</Link>}
                <span className="rounded-full border bg-muted/60 px-2.5 py-0.5 text-[12px] font-semibold text-muted-foreground">Checked Out</span>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
