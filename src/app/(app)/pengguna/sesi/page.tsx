import Link from "next/link";
import { MonitorSmartphone } from "lucide-react";
import { ConfirmButton } from "@/components/confirm-button";
import { ListHeader } from "@/components/data-table";
import { EmptyState } from "@/components/page-header";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { formatDate, formatTime } from "@/lib/format";
import { requireCapability } from "@/lib/require-role";
import { describeAgent, isExpired, listSessions } from "@/lib/sessions";
import { cn } from "@/lib/utils";
import { revokeSessionAction, revokeUserSessionsAction } from "./actions";

const ROLE = { ADMIN: "Owner / Admin", DOKTER: "Dokter", KASIR: "Kasir" };

export default async function SessionsPage({ searchParams }: { searchParams: Promise<{ semua?: string }> }) {
  await requireCapability("manage_users_settings");
  const all = (await searchParams).semua === "1";
  const [rows, current] = await Promise.all([listSessions(all), auth()]);
  const users = [...new Map(rows.filter((r) => !r.revokedAt && !isExpired(r.lastSeenAt)).map((r) => [r.user.id, r.user])).values()];

  return (
    <div className="space-y-5">
      <ListHeader
        icon={MonitorSmartphone}
        title="Sesi Login"
        subtitle="Perangkat yang sedang login. Keluarkan sesi yang tidak dikenal, lalu ganti password pengguna tersebut."
        actions={<>
          <Button asChild variant="outline"><Link href="/pengguna">Kembali ke Pengguna</Link></Button>
          <Button asChild variant="outline"><Link href={all ? "/pengguna/sesi" : "/pengguna/sesi?semua=1"}>{all ? "Hanya sesi aktif" : "Tampilkan riwayat login"}</Link></Button>
        </>}
      />

      {users.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {users.map((u) => (
            <form key={u.id} action={revokeUserSessionsAction.bind(null, u.id)}>
              <ConfirmButton variant="outline" message={`Keluarkan ${u.name} dari semua perangkat?`} confirmLabel="Ya, keluarkan">Keluarkan {u.name} dari semua perangkat</ConfirmButton>
            </form>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-[10px] border bg-card">
        <table className="w-full min-w-[820px] text-[13.5px]">
          <thead>
            <tr className="border-b text-left text-[12.5px] font-semibold tracking-wide text-muted-foreground uppercase">
              <th className="px-4 py-3">Pengguna</th><th className="px-4 py-3">Perangkat</th><th className="px-4 py-3">Alamat IP</th><th className="px-4 py-3">Login</th><th className="px-4 py-3">Aktivitas terakhir</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const active = !s.revokedAt && !isExpired(s.lastSeenAt);
              const mine = s.id === current?.sid;
              return (
                <tr key={s.id} className={cn("border-b last:border-0", !active && "text-muted-foreground")}>
                  <td className="px-4 py-3"><div className="font-medium">{s.user.name}</div><div className="text-[12.5px] text-muted-foreground">{s.user.username} · {ROLE[s.user.role]}</div></td>
                  <td className="px-4 py-3">{describeAgent(s.userAgent)}{mine && <span className="ml-2 align-middle"><StatusChip tone="info">Sesi ini</StatusChip></span>}</td>
                  <td className="px-4 py-3 tabular-nums">{s.ip ?? "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(s.createdAt)} {formatTime(s.createdAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(s.lastSeenAt)} {formatTime(s.lastSeenAt)}</td>
                  <td className="px-4 py-3"><StatusChip tone={active ? "success" : "neutral"}>{active ? "Aktif" : s.revokedAt ? "Keluar" : "Kedaluwarsa"}</StatusChip></td>
                  <td className="px-4 py-3 text-right">
                    {active && !mine && (
                      <form action={revokeSessionAction.bind(null, s.id)}>
                        <ConfirmButton variant="outline" message={`Keluarkan sesi ${s.user.name} (${describeAgent(s.userAgent)})?`} confirmLabel="Ya, keluarkan">Keluarkan</ConfirmButton>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <EmptyState>Belum ada sesi tercatat. Sesi mulai tercatat sejak login berikutnya.</EmptyState>}
      </div>
    </div>
  );
}
