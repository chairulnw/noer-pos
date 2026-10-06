import Link from "next/link";
import { UsersRound } from "lucide-react";
import { ListHeader, ListPage, ListToolbar, TableCard } from "@/components/data-table";
import { EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";
import { parsePaging, type PagingParams } from "@/lib/paging";
import { pageOwners } from "@/lib/patients";
import { formatWhatsapp } from "@/lib/patient-schema";
import { requireCapability } from "@/lib/require-role";


export default async function OwnersPage({ searchParams }: { searchParams: Promise<{ q?: string } & PagingParams> }) {
  await requireCapability("manage_patients");
  const params = await searchParams;
  const { page, size, skip, take } = parsePaging(params);
  const { rows, total } = await pageOwners(params.q ?? "", skip, take);
  const keep = { q: params.q, baris: params.baris };

  return (
    <ListPage>
      <ListHeader icon={UsersRound} title="Pemilik Hewan (Owners)" subtitle="Database identitas klien pemilik hewan, kontak WhatsApp, dan alamat domisili" actions={<Button asChild><Link href="/pemilik/baru">+ Pemilik Baru</Link></Button>} />
      <ListToolbar base="/pemilik" params={keep} placeholder="Cari nama, no. WhatsApp, atau alamat…" total={total} />
      <TableCard
        columns={[{ label: "Nama pemilik" }, { label: "Kontak WhatsApp" }, { label: "Saldo deposit", align: "right" }, { label: "Hewan" }, { label: "Alamat domisili" }, { label: "Aksi", align: "right" }]}
        total={total}
        page={page}
        size={size}
        base="/pemilik"
        params={keep}
        empty={<EmptyState action={<Button asChild><Link href="/pemilik/baru">+ Pemilik Baru</Link></Button>}>{params.q ? "Tidak ada pemilik ditemukan." : "Belum ada data pemilik. Mulai daftarkan klien pemilik hewan pertama."}</EmptyState>}
      >
        {rows.map((o) => (
          <tr key={o.id} className="border-b last:border-0">
            <td className="px-4 py-3 font-medium">{o.name}</td>
            <td className="px-4 py-3 tabular-nums">{formatWhatsapp(o.whatsapp)}</td>
            <td className="px-4 py-3 text-right tabular-nums">{formatRupiah(o.walletBalance)}</td>
            <td className="px-4 py-3">{o.pets.length === 0 ? <span className="text-muted-foreground">Belum ada</span> : o.pets.join(", ")}</td>
            <td className="max-w-64 truncate px-4 py-3 text-muted-foreground">{o.address || "—"}</td>
            <td className="px-4 py-3 text-right"><Link href={`/pemilik/${o.id}`} className="inline-flex min-h-11 items-center px-2 font-medium text-primary">Lihat</Link></td>
          </tr>
        ))}
      </TableCard>
    </ListPage>
  );
}
