import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AUDIT_PAGE_SIZE, getAuditFilterOptions, listAudit, type AuditFilter } from "@/lib/audit-query";
import { formatDate, formatTime } from "@/lib/format";
import { requireCapability } from "@/lib/require-role";

const field = "h-11 rounded-lg border border-input bg-card px-3 text-sm";

function Json({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined) return null;
  return (
    <div>
      <div className="text-[12px] text-muted-foreground">{label}</div>
      <pre className="overflow-x-auto rounded-md bg-muted/50 p-2 text-[12.5px]">{JSON.stringify(value, null, 2)}</pre>
    </div>
  );
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<AuditFilter> }) {
  await requireCapability("view_audit_log");
  const filter = await searchParams;
  const [{ rows, total, page, pages }, options] = await Promise.all([listAudit(filter), getAuditFilterOptions()]);
  const href = (p: number) => `/audit?${new URLSearchParams({ ...Object.fromEntries(Object.entries(filter).filter(([, v]) => v)), page: String(p) })}`;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[22px] font-semibold leading-11">Audit Log</h1>
        <p className="text-sm text-muted-foreground">{total.toLocaleString("id-ID")} catatan perubahan sensitif. Hanya baca, tidak bisa diubah atau dihapus.</p>
      </header>

      <form className="flex flex-wrap items-end gap-3 rounded-[10px] border bg-card p-4">
        <label className="space-y-1 text-[13px] text-muted-foreground">
          Pengguna
          <select name="userId" defaultValue={filter.userId ?? ""} className={`${field} block`}>
            <option value="">Semua</option>
            {options.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-[13px] text-muted-foreground">
          Entitas
          <select name="entity" defaultValue={filter.entity ?? ""} className={`${field} block`}>
            <option value="">Semua</option>
            {options.entities.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-[13px] text-muted-foreground">
          Dari
          <input type="date" name="from" defaultValue={filter.from ?? ""} className={`${field} block`} />
        </label>
        <label className="space-y-1 text-[13px] text-muted-foreground">
          Sampai
          <input type="date" name="to" defaultValue={filter.to ?? ""} className={`${field} block`} />
        </label>
        <Button type="submit">Terapkan</Button>
        <Link href="/audit" className="flex h-11 items-center px-2 text-sm font-medium text-primary">Reset</Link>
      </form>

      <div className="overflow-x-auto rounded-[10px] border bg-card">
        <table className="w-full min-w-[720px] text-[14.5px]">
          <thead>
            <tr className="border-b text-left text-[13px] text-muted-foreground">
              <th className="px-4 py-2.5 font-normal">Waktu (WIB)</th>
              <th className="px-4 py-2.5 font-normal">Pengguna</th>
              <th className="px-4 py-2.5 font-normal">Aksi</th>
              <th className="px-4 py-2.5 font-normal">Entitas</th>
              <th className="px-4 py-2.5 font-normal">Detail</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Tidak ada catatan.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b align-top last:border-0">
                <td className="whitespace-nowrap px-4 py-3">{formatDate(r.createdAt)} {formatTime(r.createdAt)}</td>
                <td className="px-4 py-3">{r.user.name}</td>
                <td className="px-4 py-3 font-medium">{r.action}</td>
                <td className="px-4 py-3"><div>{r.entity}</div><div className="break-all text-[12px] text-muted-foreground">{r.entityId}</div></td>
                <td className="px-4 py-3">
                  {r.before || r.after ? (
                    <details>
                      <summary className="cursor-pointer text-sm font-medium text-primary">Lihat</summary>
                      <div className="mt-2 space-y-2"><Json label="Sebelum" value={r.before} /><Json label="Sesudah" value={r.after} /></div>
                    </details>
                  ) : <span className="text-muted-foreground">-</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav aria-label="Halaman" className="flex items-center justify-between text-sm">
          {page > 1 ? <Link href={href(page - 1)} className="flex h-11 items-center font-medium text-primary">Sebelumnya</Link> : <span />}
          <span className="text-muted-foreground">Halaman {page} dari {pages} ({AUDIT_PAGE_SIZE} per halaman)</span>
          {page < pages ? <Link href={href(page + 1)} className="flex h-11 items-center font-medium text-primary">Berikutnya</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
