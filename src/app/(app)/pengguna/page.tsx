import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/status-chip";
import { requireCapability } from "@/lib/require-role";
import { listUsers } from "@/lib/users";

const ROLE = { ADMIN: "Owner / Admin", DOKTER: "Dokter", KASIR: "Kasir" };

export default async function UsersPage() {
  await requireCapability("manage_users_settings");
  const users = await listUsers();

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[22px] font-semibold leading-11">Pengguna</h1>
        <Button asChild><Link href="/pengguna/baru">+ Pengguna baru</Link></Button>
      </header>
      <div className="overflow-x-auto rounded-[10px] border bg-card">
        <table className="w-full min-w-[520px] text-[14.5px]">
          <thead>
            <tr className="border-b text-left text-[13px] text-muted-foreground">
              <th className="px-4 py-2.5 font-normal">Nama</th>
              <th className="px-4 py-2.5 font-normal">Username</th>
              <th className="px-4 py-2.5 font-normal">Role</th>
              <th className="px-4 py-2.5 font-normal">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3">{u.username}</td>
                <td className="px-4 py-3">{ROLE[u.role]}</td>
                <td className="px-4 py-3"><StatusChip tone={u.active ? "success" : "neutral"}>{u.active ? "Aktif" : "Nonaktif"}</StatusChip></td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/pengguna/${u.id}`} className="inline-flex min-h-11 items-center px-2 font-medium text-primary">Ubah</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
