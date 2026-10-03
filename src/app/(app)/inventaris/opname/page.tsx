import Link from "next/link";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";
import { listOpnames } from "@/lib/opname";
import { requireCapability } from "@/lib/require-role";
import { createOpnameAction } from "./actions";

export default async function OpnamePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireCapability("manage_stock");
  const { error } = await searchParams;
  const opnames = await listOpnames();
  const hasDraft = opnames.some((o) => o.status === "DRAFT");

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Link href="/inventaris" className="text-[13px] font-medium text-primary">← Inventaris</Link>
        <h1 className="text-[22px] font-semibold">Stok Opname</h1>
      </div>

      <form action={createOpnameAction} className="flex flex-wrap items-end gap-3 rounded-[10px] border bg-card p-5">
        <div className="min-w-60 flex-1 space-y-1.5">
          <label htmlFor="note" className="text-sm font-medium">Catatan sesi (opsional)</label>
          <Input id="note" name="note" maxLength={300} placeholder="mis. Opname akhir bulan" />
        </div>
        <Button type="submit">{hasDraft ? "Lanjutkan sesi draft" : "Mulai opname baru"}</Button>
        {error && <p role="alert" className="basis-full text-sm text-destructive">{error}</p>}
      </form>

      <section className="overflow-hidden rounded-[10px] border bg-card">
        <h2 className="border-b px-5 py-3 text-base font-semibold">Riwayat opname</h2>
        {opnames.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Belum ada opname.</p>}
        {opnames.map((o) => (
          <Link key={o.id} href={`/inventaris/opname/${o.id}`} className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3.5 last:border-0">
            <div>
              <div className="font-medium">{formatDate(o.opnameDate)}{o.note && ` · ${o.note}`}</div>
              <div className="text-[13px] text-muted-foreground">{o.user.name} · {o._count.items} batch · {o.items.length} selisih</div>
            </div>
            <StatusChip tone={o.status === "FINAL" ? "info" : "neutral"}>{o.status === "FINAL" ? "Final" : "Draft"}</StatusChip>
          </Link>
        ))}
      </section>
    </div>
  );
}
