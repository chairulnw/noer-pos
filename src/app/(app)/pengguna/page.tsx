import Link from "next/link";
import { UserCog } from "lucide-react";
import { ListHeader, ListPage, ListToolbar, TableCard } from "@/components/data-table";
import { EmptyState } from "@/components/page-header";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { parsePaging, parseSort, type PagingParams, type SortParams } from "@/lib/paging";
import { requireCapability } from "@/lib/require-role";
import { pageUsers } from "@/lib/users";

const ROLE = { ADMIN: "Owner / Admin", KARYAWAN: "Karyawan" };

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string } & PagingParams & SortParams> }) {
  await requireCapability("manage_users_settings");
  const params = await searchParams;
  const { page, size, skip, take } = parsePaging(params);
  const sort = parseSort(params, { nama: (d) => ({ name: d }), username: (d) => ({ username: d }), peran: (d) => ({ role: d }), status: (d) => ({ active: d }) });
  const { rows, total } = await pageUsers(params.q, skip, take, sort.orderBy);
  const keep = { q: params.q, baris: params.baris, ...sort.keep };
  const add = <Button asChild><Link href="/pengguna/baru">+ Staf Baru</Link></Button>;

  return (
    <ListPage>
      <ListHeader icon={UserCog} title="Manajemen Staf & Dokter" subtitle="Akun pengguna staf, dokter hewan, dan kasir beserta hak akses aplikasi" actions={<><Button asChild variant="outline"><Link href="/pengguna/sesi">Sesi Login</Link></Button>{add}</>} />
      <ListToolbar base="/pengguna" params={keep} placeholder="Cari nama atau username…" total={total} />
      <TableCard
        columns={[{ label: "Nama staf", sort: "nama" }, { label: "Username login", sort: "username" }, { label: "Peran / jabatan", sort: "peran" }, { label: "Status", sort: "status" }, { label: "Aksi", align: "right" }]}
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
