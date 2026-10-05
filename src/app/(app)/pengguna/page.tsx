import Link from "next/link";
import { UserCog } from "lucide-react";
import { ListHeader, ListPage, ListToolbar, TableCard } from "@/components/data-table";
import { EmptyState } from "@/components/page-header";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { parsePaging, type PagingParams } from "@/lib/paging";
import { requireCapability } from "@/lib/require-role";
import { pageUsers } from "@/lib/users";

const ROLE = { ADMIN: "Owner / Admin", DOKTER: "Dokter", KASIR: "Kasir" };

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string } & PagingParams> }) {
  await requireCapability("manage_users_settings");
  const params = await searchParams;
  const { page, size, skip, take } = parsePaging(params);
  const { rows, total } = await pageUsers(params.q, skip, take);
  const keep = { q: params.q, baris: params.baris };
  const add = <Button asChild><Link href="/pengguna/baru">+ Staf Baru</Link></Button>;

  return (
    <ListPage>
      <ListHeader icon={UserCog} title="Manajemen Staf & Dokter" subtitle="Akun pengguna staf, dokter hewan, dan kasir beserta hak akses aplikasi" actions={add} />
      <ListToolbar base="/pengguna" params={keep} placeholder="Cari nama atau username…" total={total} />
      <TableCard
        columns={[{ label: "Nama staf" }, { label: "Username login" }, { label: "Peran / jabatan" }, { label: "Status" }, { label: "Aksi", align: "right" }]}
        total={total}
        page={page}
        size={size}
        base="/pengguna"
        params={keep}
        minWidth={600}
        empty={<EmptyState action={add}>Belum ada staf.</EmptyState>}
      >
        {rows.map((u) => (
          <tr key={u.id} className="border-b last:border-0">
            <td className="px-4 py-3 font-medium">{u.name}</td>
            <td className="px-4 py-3">{u.username}</td>
            <td className="px-4 py-3">{ROLE[u.role]}</td>
            <td className="px-4 py-3"><StatusChip tone={u.active ? "success" : "neutral"}>{u.active ? "Aktif" : "Nonaktif"}</StatusChip></td>
            <td className="px-4 py-3 text-right"><Link href={`/pengguna/${u.id}`} className="inline-flex min-h-11 items-center px-2 font-medium text-primary">Ubah</Link></td>
          </tr>
        ))}
      </TableCard>
    </ListPage>
  );
}
