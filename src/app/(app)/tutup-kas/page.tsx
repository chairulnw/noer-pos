import { StatusChip } from "@/components/status-chip";
import { getCashPage, type ClosingView } from "@/lib/cash";
import { differenceLabel } from "@/lib/cash-schema";
import { formatDate, formatRupiah, formatTime } from "@/lib/format";
import { can } from "@/lib/permissions";
import { requireCapability } from "@/lib/require-role";
import { CashForm } from "./cash-form";

const tone = (difference: number) => (difference === 0 ? "success" : "warning");

function DifferenceChip({ difference }: { difference: number }) {
  return <StatusChip tone={tone(difference)}>{difference === 0 ? "Sesuai" : `${differenceLabel(difference)} ${formatRupiah(Math.abs(difference))}`}</StatusChip>;
}

function Summary({ closing, late }: { closing: ClosingView; late: number }) {
  const rows: [string, string][] = [
    ["Modal awal", formatRupiah(closing.openingCash)],
    ...(closing.cashSales === undefined ? [] : ([["Tunai di sistem", formatRupiah(closing.cashSales)]] as [string, string][])),
    ["Hitung fisik", formatRupiah(closing.countedCash)],
  ];
  return (
    <section className="space-y-3 rounded-[10px] border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Kas hari ini sudah ditutup</h2>
        <DifferenceChip difference={closing.difference} />
      </div>
      <dl className="grid gap-3 sm:grid-cols-3">
        {rows.map(([label, value]) => (
          <div key={label}><dt className="text-[13px] text-muted-foreground">{label}</dt><dd className="text-xl font-semibold tabular-nums">{value}</dd></div>
        ))}
      </dl>
      {closing.note && <p className="text-sm"><span className="text-muted-foreground">Catatan: </span>{closing.note}</p>}
      <p className="text-[13px] text-muted-foreground">Ditutup oleh {closing.closedBy} pukul {formatTime(closing.createdAt)}.</p>
      {late !== 0 && <p role="status" className="rounded-lg border border-[#E9CFA6] p-3 text-sm text-warning">Ada transaksi tunai senilai {formatRupiah(Math.abs(late))} {late > 0 ? "yang masuk" : "yang berkurang"} setelah kas ditutup. Angka di atas tidak ikut berubah.</p>}
    </section>
  );
}

export default async function CashPage() {
  const user = await requireCapability("close_cash");
  const withSystem = can(user.role, "view_revenue_reports");
  const { today, history, suggestedOpening, lateCash } = await getCashPage(withSystem);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[22px] font-semibold leading-11">Tutup Kas</h1>
        <p className="text-sm text-muted-foreground">Hitung uang tunai di laci di akhir hari. Selisih dihitung terhadap modal awal ditambah pembayaran tunai hari ini.</p>
      </header>

      {today ? <Summary closing={today} late={lateCash} /> : <CashForm suggestedOpening={suggestedOpening} />}

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Riwayat penutupan</h2>
        <div className="overflow-x-auto rounded-[10px] border bg-card">
          <table className="w-full min-w-[640px] text-[14.5px]">
            <thead>
              <tr className="border-b text-left text-[13px] text-muted-foreground">
                <th className="px-4 py-2.5 font-normal">Tanggal</th>
                <th className="px-4 py-2.5 font-normal">Ditutup oleh</th>
                <th className="px-4 py-2.5 text-right font-normal">Modal awal</th>
                {withSystem && <th className="px-4 py-2.5 text-right font-normal">Tunai di sistem</th>}
                <th className="px-4 py-2.5 text-right font-normal">Hitung fisik</th>
                <th className="px-4 py-2.5 font-normal">Selisih</th>
                <th className="px-4 py-2.5 font-normal">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && <tr><td colSpan={withSystem ? 7 : 6} className="px-4 py-8 text-center text-muted-foreground">Belum ada penutupan kas.</td></tr>}
              {history.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="whitespace-nowrap px-4 py-3">{formatDate(c.date)}</td>
                  <td className="px-4 py-3">{c.closedBy}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatRupiah(c.openingCash)}</td>
                  {withSystem && <td className="px-4 py-3 text-right tabular-nums">{formatRupiah(c.cashSales ?? 0)}</td>}
                  <td className="px-4 py-3 text-right tabular-nums">{formatRupiah(c.countedCash)}</td>
                  <td className="px-4 py-3"><DifferenceChip difference={c.difference} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{c.note ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
