import Link from "next/link";
import { WalletCards } from "lucide-react";
import { z } from "zod";
import { FilterSelect } from "@/components/filter-select";
import { ListHeader, ListPage, ListToolbar, TableCard } from "@/components/data-table";
import { EmptyState } from "@/components/page-header";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { formatDate, formatRupiah, formatTime } from "@/lib/format";
import { METHOD_LABEL } from "@/lib/payment-method";
import { parsePaging, parseSort, type PagingParams, type SortParams } from "@/lib/paging";
import { can } from "@/lib/permissions";
import { requireCapability } from "@/lib/require-role";
import { pageWalletTransactions, walletSummary } from "@/lib/wallet";
import { WALLET_TYPE } from "@/lib/wallet-schema";

export default async function DepositPage({ searchParams }: { searchParams: Promise<{ q?: string; pemilik?: string } & PagingParams & SortParams> }) {
  const user = await requireCapability("manage_invoice_payment");
  const params = await searchParams;
  const ownerId = params.pemilik && z.guid().safeParse(params.pemilik).success ? params.pemilik : undefined;
  const { page, size, skip, take } = parsePaging(params);
  const sort = parseSort(params, { waktu: (d) => ({ createdAt: d }), pemilik: (d) => ({ owner: { name: d } }), jenis: (d) => ({ type: d }), nominal: (d) => ({ amount: d }), saldo: (d) => ({ balanceAfter: d }), oleh: (d) => ({ createdBy: { name: d } }) });
  const [{ rows, total }, summary, owner, owners] = await Promise.all([
    pageWalletTransactions({ ownerId, q: params.q }, skip, take, sort.orderBy),
    walletSummary(),
    ownerId ? prisma.owner.findFirst({ where: { id: ownerId, deletedAt: null }, select: { name: true, walletBalance: true } }) : null,
    prisma.owner.findMany({ where: { deletedAt: null, walletTransactions: { some: {} } }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const keep = { q: params.q, pemilik: ownerId, baris: params.baris, ...sort.keep };

  return (
    <ListPage>
      <ListHeader
        icon={WalletCards}
        title="Deposit & Wallet"
        subtitle="Saldo titipan klien untuk pembayaran. Saldo tidak bisa ditarik tunai"
        actions={<>{can(user.role, "correct_deposit") && <Button asChild variant="outline"><Link href="/deposit/koreksi">Koreksi Saldo</Link></Button>}<Button asChild><Link href="/deposit/top-up">Top-Up Saldo Klien</Link></Button></>}
      />
      <div className="grid gap-3">
        <div className="rounded-[10px] border bg-card p-4">
          <div className="text-[12.5px] font-semibold tracking-wide text-muted-foreground uppercase">Total saldo titipan klien</div>
          <div className="mt-1 text-3xl font-semibold tabular-nums">{formatRupiah(summary.total)}</div>
          <div className="text-[12.5px] text-muted-foreground">{summary.owners} pemilik memiliki saldo aktif</div>
        </div>
        {owner && (
          <div className="rounded-[10px] border bg-card p-4">
            <div className="text-[12.5px] font-semibold tracking-wide text-muted-foreground uppercase">Filter pemilik</div>
            <div className="mt-1 text-xl font-semibold">{owner.name}</div>
            <div className="text-[12.5px] text-muted-foreground">Saldo <b className="text-foreground tabular-nums">{formatRupiah(owner.walletBalance)}</b> · <Link href={`/deposit?${new URLSearchParams({ ...(params.q && { q: params.q }) })}`} className="font-medium text-primary">Lihat semua</Link></div>
          </div>
        )}
      </div>
      <ListToolbar base="/deposit" params={{ q: params.q, baris: params.baris }} placeholder="Cari pemilik, catatan, atau no. invoice…" total={total}>
        <FilterSelect name="pemilik" defaultValue={ownerId ?? ""} aria-label="Pemilik"><option value="">Semua pemilik</option>{owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</FilterSelect>
      </ListToolbar>
      <TableCard
        columns={[{ label: "Waktu", sort: "waktu" }, { label: "Pemilik", sort: "pemilik" }, { label: "Jenis", sort: "jenis" }, { label: "Nominal", sort: "nominal", align: "right" }, { label: "Saldo sesudah", sort: "saldo", align: "right" }, { label: "Keterangan" }, { label: "Oleh", sort: "oleh" }]}
        total={total}
        page={page}
        size={size}
        base="/deposit"
        params={keep}
        minWidth={880}
        empty={<EmptyState action={<Button asChild><Link href="/deposit/top-up">Top-Up Saldo Klien</Link></Button>}>Belum ada riwayat mutasi deposit.</EmptyState>}
      >
        {rows.map((t) => (
          <tr key={t.id} className="border-b last:border-0">
            <td className="whitespace-nowrap px-4 py-3"><div className="font-medium">{formatDate(t.createdAt)}</div><div className="text-[12.5px] text-muted-foreground">{formatTime(t.createdAt)}</div></td>
            <td className="px-4 py-3"><Link href={`/deposit?pemilik=${t.owner.id}`} className="font-medium">{t.owner.name}</Link></td>
            <td className="px-4 py-3">{WALLET_TYPE[t.type]}{t.type === "TOPUP" && t.method && <div className="text-[12.5px] text-muted-foreground">{METHOD_LABEL[t.method]}</div>}</td>
            <td className="px-4 py-3 text-right"><StatusChip tone={t.amount < 0 ? "danger" : "success"}>{t.amount > 0 ? "+" : "−"} {formatRupiah(Math.abs(t.amount))}</StatusChip></td>
            <td className="px-4 py-3 text-right tabular-nums">{formatRupiah(t.balanceAfter)}</td>
            <td className="max-w-64 px-4 py-3 text-muted-foreground"><div className="truncate">{t.invoice ? <Link href={`/invoice/${t.invoice.id}`} className="font-medium text-primary">{t.invoice.invoiceNo}</Link> : (t.note ?? "—")}</div>{t.invoice && t.note && <div className="truncate text-[12.5px]">{t.note}</div>}</td>
            <td className="px-4 py-3">{t.createdBy.name}</td>
          </tr>
        ))}
      </TableCard>
    </ListPage>
  );
}
