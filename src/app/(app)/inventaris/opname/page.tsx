import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { ListHeader, ListPage, TableCard } from "@/components/data-table";
import { EmptyState } from "@/components/page-header";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";
import { hasDraftOpname, listOpnames } from "@/lib/opname";
import { parsePaging, parseSort, type PagingParams, type SortParams } from "@/lib/paging";
import { requireCapability } from "@/lib/require-role";
import { createOpnameAction } from "./actions";

export default async function OpnamePage({ searchParams }: { searchParams: Promise<{ error?: string } & PagingParams & SortParams> }) {
  await requireCapability("manage_stock");
  const params = await searchParams;
  const { page, size, skip, take } = parsePaging(params);
  const sort = parseSort(params, { tanggal: (d) => ({ opnameDate: d }), petugas: (d) => ({ user: { name: d } }), cakupan: (d) => ({ items: { _count: d } }), status: (d) => ({ status: d }) });
  const [{ rows, total }, hasDraft] = await Promise.all([listOpnames(skip, take, sort.orderBy), hasDraftOpname()]);

  return (
    <ListPage>
      <ListHeader icon={ClipboardCheck} title="Stok Opname (Audit Fisik)" subtitle="Rekonsiliasi stok fisik riil dengan catatan sistem dan penyesuaian otomatis" />
      <form action={createOpnameAction} className="flex flex-wrap items-end gap-3 rounded-[10px] border bg-card p-4">
        <div className="min-w-60 flex-1 space-y-1.5">
          <label htmlFor="note" className="text-sm font-medium">Catatan sesi (opsional)</label>
          <Input id="note" name="note" maxLength={300} placeholder="mis. Opname akhir bulan" />
        </div>
        <Button type="submit">{hasDraft ? "Lanjutkan sesi draft" : "Mulai sesi baru"}</Button>
        {params.error && <p role="alert" className="basis-full text-sm text-destructive">{params.error}</p>}
      </form>
      <TableCard
        columns={[{ label: "Tanggal sesi", sort: "tanggal" }, { label: "Petugas pelaksana", sort: "petugas" }, { label: "Cakupan batch", sort: "cakupan", align: "right" }, { label: "Selisih", align: "right" }, { label: "Status audit", sort: "status" }, { label: "Aksi", align: "right" }]}
        total={total}
        page={page}
        size={size}
        base="/inventaris/opname"
        params={{ baris: params.baris, ...sort.keep }}
        minWidth={720}
        empty={<EmptyState>Belum ada sesi stok opname. Mulai sesi audit fisik inventaris klinik atau petshop Anda.</EmptyState>}
      >
        {rows.map((o) => (
          <tr key={o.id} className="border-b last:border-0">
            <td className="px-4 py-3"><div className="font-medium">{formatDate(o.opnameDate)}</div>{o.note && <div className="max-w-64 truncate text-[12.5px] text-muted-foreground">{o.note}</div>}</td>
            <td className="px-4 py-3">{o.user.name}</td>
            <td className="px-4 py-3 text-right tabular-nums">{o._count.items}</td>
            <td className="px-4 py-3 text-right tabular-nums">{o.items.length}</td>
            <td className="px-4 py-3"><StatusChip tone={o.status === "FINAL" ? "info" : "neutral"}>{o.status === "FINAL" ? "Final" : "Draft"}</StatusChip></td>
            <td className="px-4 py-3 text-right"><Link href={`/inventaris/opname/${o.id}`} className="inline-flex min-h-11 items-center px-2 font-medium text-primary">{o.status === "FINAL" ? "Lihat" : "Lanjutkan"}</Link></td>
          </tr>
        ))}
      </TableCard>
    </ListPage>
  );
}
