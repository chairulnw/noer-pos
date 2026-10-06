import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, History, PawPrint, Plus, Receipt, UserRound, WalletCards } from "lucide-react";
import { z } from "zod";
import { EmptyState } from "@/components/page-header";
import { ClinicalTags } from "@/components/clinical-flags";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { formatDate, formatRupiah, formatTime } from "@/lib/format";
import { INVOICE_STATUS } from "@/lib/invoice-status";
import { METHOD_LABEL } from "@/lib/payment-method";
import { can } from "@/lib/permissions";
import { getOwner, getPatientHistory, listOwnerPurchases } from "@/lib/patients";
import { listPatientAdmissions } from "@/lib/admissions";
import { listPatientGroomings } from "@/lib/groomings";
import { listPatientSurgeries } from "@/lib/surgeries";
import { ActivityList, buildActivities } from "../../pasien/activity";
import { formatWhatsapp } from "@/lib/patient-schema";
import { requireCapability } from "@/lib/require-role";
import { pageWalletTransactions } from "@/lib/wallet";
import { WALLET_TYPE } from "@/lib/wallet-schema";
import { cn } from "@/lib/utils";

const SEX = { JANTAN: "Jantan", BETINA: "Betina" };

export default async function OwnerPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const user = await requireCapability("manage_patients");
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();
  const owner = await getOwner(id);
  if (!owner) notFound();
  const canMoney = can(user.role, "manage_invoice_payment");
  const canMedical = can(user.role, "view_medical_record");
  const [[wallet, purchases], perPet] = await Promise.all([
    canMoney ? Promise.all([pageWalletTransactions({ ownerId: id }, 0, 100), listOwnerPurchases(id)]) : Promise.resolve([null, []] as const),
    Promise.all(owner.patients.map(async (p) => {
      const [history, surgeries, groomings, admissions] = await Promise.all([canMedical ? getPatientHistory(p.id) : null, canMedical ? listPatientSurgeries(p.id) : [], listPatientGroomings(p.id), listPatientAdmissions(p.id)]);
      return buildActivities({ history, surgeries, groomings, admissions, petName: p.name });
    })),
  ]);
  const activities = perPet.flat().sort((a, b) => b.date.getTime() - a.date.getTime());

  const tabs = [
    ...(canMoney ? [{ id: "deposit", label: `Riwayat Mutasi Deposit (${wallet!.total})`, icon: WalletCards }, { id: "pembelian", label: `Riwayat Pembelian & Tindakan (${purchases.length})`, icon: Receipt }] : []),
    { id: "aktivitas", label: `Riwayat Aktivitas (${activities.length})`, icon: History },
    { id: "hewan", label: `Daftar Hewan / Anabul (${owner.patients.length})`, icon: PawPrint },
  ];
  const requested = (await searchParams).tab;
  const tab = tabs.find((t) => t.id === requested)?.id ?? tabs[0].id;

  return (
    <div className="space-y-5">
      <Link href="/pemilik" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary"><ArrowLeft className="size-4" /> Pemilik Hewan</Link>

      <div className={cn("grid gap-4", canMoney && "lg:grid-cols-[minmax(0,1fr)_380px]")}>
        <section className="rounded-2xl border bg-card p-6">
          <div className="flex flex-wrap items-start gap-5">
            <span className="grid size-20 shrink-0 place-items-center rounded-2xl bg-accent text-primary"><UserRound className="size-9" /></span>
            <div className="min-w-56 flex-1">
              <h1 className="text-[26px] leading-tight font-bold">{owner.name}</h1>
              <p className="text-[15px] text-muted-foreground">Klien terdaftar sejak {formatDate(owner.createdAt)} · {owner.patients.length} Anabul</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild><Link href={`/pemilik/${owner.id}/ubah`}>Ubah</Link></Button>
              <Button asChild><Link href={`/pasien/baru?owner=${owner.id}`}><Plus className="size-4" /> Hewan baru</Link></Button>
            </div>
          </div>
          <dl className="mt-5 grid gap-4 border-t pt-5 sm:grid-cols-2">
            <div><dt className="text-[12px] font-bold tracking-wide text-muted-foreground uppercase">WhatsApp</dt><dd className="text-[15px] tabular-nums">{formatWhatsapp(owner.whatsapp)}</dd></div>
            <div><dt className="text-[12px] font-bold tracking-wide text-muted-foreground uppercase">Alamat</dt><dd className="text-[15px]">{owner.address || "-"}</dd></div>
            {owner.notes && <div className="sm:col-span-2"><dt className="text-[12px] font-bold tracking-wide text-muted-foreground uppercase">Catatan</dt><dd className="text-[15px]">{owner.notes}</dd></div>}
          </dl>
        </section>

        {canMoney && (
          <section className="flex flex-col justify-between gap-5 rounded-2xl bg-gradient-to-br from-primary to-[#7a55a3] p-6 text-primary-foreground">
            <div>
              <div className="flex items-center gap-2 text-[13px] font-bold tracking-wide uppercase opacity-90"><WalletCards className="size-5" /> Saldo deposit aktif</div>
              <div className="mt-2 text-[36px] leading-none font-bold tabular-nums">{formatRupiah(owner.walletBalance)}</div>
              <p className="mt-2 text-[13.5px] opacity-85">Dapat dipakai untuk melunasi tagihan. Saldo tidak bisa ditarik tunai.</p>
            </div>
            <div className="flex gap-2 border-t border-white/20 pt-4">
              <Button asChild className="h-11 flex-1 bg-white text-primary hover:bg-white/90"><Link href={`/deposit/top-up?owner=${owner.id}`}><Plus className="size-4" /> Top Up</Link></Button>
              {can(user.role, "correct_deposit") && <Button asChild variant="outline" className="h-11 flex-1 border-white/30 bg-white/10 text-white hover:bg-white/20"><Link href={`/deposit/koreksi?owner=${owner.id}`}>Koreksi saldo</Link></Button>}
            </div>
          </section>
        )}
      </div>

      <nav className="flex flex-wrap gap-6 border-b" aria-label="Bagian pemilik">
        {tabs.map((t) => (
          <Link key={t.id} href={`/pemilik/${owner.id}?tab=${t.id}`} aria-current={t.id === tab ? "page" : undefined} className={cn("-mb-px flex items-center gap-2 border-b-2 pb-3 text-[15px] font-semibold", t.id === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground")}>
            <t.icon className="size-5" /> {t.label}
          </Link>
        ))}
      </nav>

      {tab === "deposit" && wallet && (
        <div className="space-y-2.5">
          {wallet.rows.length === 0 && <EmptyState>Belum ada mutasi deposit.</EmptyState>}
          {wallet.rows.map((t) => (
            <div key={t.id} className="flex items-center gap-4 rounded-2xl border bg-card px-5 py-4">
              <span className={cn("grid size-12 shrink-0 place-items-center rounded-xl", t.amount > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>{t.amount > 0 ? <ArrowDownLeft className="size-5" /> : <ArrowUpRight className="size-5" />}</span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{WALLET_TYPE[t.type]}{t.invoice && <> · <Link href={`/invoice/${t.invoice.id}`} className="text-primary">{t.invoice.invoiceNo}</Link></>}</div>
                <div className="text-[13px] text-muted-foreground">{formatDate(t.createdAt)}, {formatTime(t.createdAt)}{t.method && ` · Metode: ${METHOD_LABEL[t.method]}`}{t.note && ` · ${t.note}`} · oleh {t.createdBy.name}</div>
              </div>
              <div className="text-right">
                <div className={cn("text-lg font-bold tabular-nums", t.amount > 0 ? "text-success" : "text-destructive")}>{t.amount > 0 ? "+" : "−"}{formatRupiah(Math.abs(t.amount))}</div>
                <div className="text-[12.5px] text-muted-foreground tabular-nums">Saldo {formatRupiah(t.balanceAfter)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "pembelian" && (
        <div className="space-y-2.5">
          {purchases.length === 0 && <EmptyState>Belum ada pembelian atau tindakan.</EmptyState>}
          {purchases.map((inv) => {
            const patient = (inv.visit ?? inv.admission)?.patient;
            const source = inv.visit ? "Kunjungan klinik" : inv.admission ? (inv.admission.type === "HOTEL" ? "Pet Hotel" : "Rawat inap") : "Kasir / petshop";
            const at = inv.finalizedAt ?? inv.createdAt;
            return (
              <Link key={inv.id} href={`/invoice/${inv.id}`} className="block rounded-2xl border bg-card px-5 py-4 hover:border-primary/40">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold tabular-nums">{inv.invoiceNo}</span>
                    <span className="text-[13px] text-muted-foreground"> · {formatDate(at)} · {source}{patient && ` · ${patient.name}`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusChip tone={INVOICE_STATUS[inv.status].tone}>{inv.status === "FINAL" ? "Lunas" : INVOICE_STATUS[inv.status].label}</StatusChip>
                    <b className={cn("tabular-nums", inv.status === "VOID" && "text-muted-foreground line-through")}>{formatRupiah(inv.grandTotal)}</b>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {inv.items.map((i) => (
                    <span key={i.id} className={cn("rounded-full px-2.5 py-0.5 text-[12.5px]", i.item.type === "SERVICE" ? "bg-info/10 text-info" : "bg-muted text-foreground")}>{i.nameSnapshot} × {Number(i.qty).toLocaleString("id-ID")}</span>
                  ))}
                </div>
              </Link>
            );
          })}
          {purchases.length > 0 && <p className="text-[12.5px] text-muted-foreground">Biru = layanan/tindakan, abu-abu = produk. Draft yang belum dibayar ada di menu Tagihan.</p>}
        </div>
      )}

      {tab === "aktivitas" && (
        <section className="rounded-2xl border bg-card px-5 py-2">
          <ActivityList items={activities} />
        </section>
      )}

      {tab === "hewan" && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {owner.patients.length === 0 && <div className="col-span-full"><EmptyState action={<Button asChild><Link href={`/pasien/baru?owner=${owner.id}`}>+ Hewan baru</Link></Button>}>Belum ada hewan terdaftar.</EmptyState></div>}
          {owner.patients.map((p) => (
            <Link key={p.id} href={`/pasien/${p.id}`} className="flex items-center gap-4 rounded-2xl border bg-card p-4 hover:border-primary/40">
              {p.photoPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/foto-hewan/${p.id}`} alt="" className="size-16 shrink-0 rounded-xl object-cover" />
              ) : (
                <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-accent text-primary"><PawPrint className="size-7" /></span>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5"><span className="text-base font-semibold">{p.name}</span><ClinicalTags allergyNote={p.allergyNote} aggressive={p.aggressive} /></div>
                <div className="text-[13px] text-muted-foreground">{[p.species, p.breed, SEX[p.sex]].filter(Boolean).join(" · ")}</div>
                <div className="text-[12.5px] text-muted-foreground tabular-nums">{p.rmNo}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
