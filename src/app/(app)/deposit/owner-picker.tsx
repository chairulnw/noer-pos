import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";
import { listOwners } from "@/lib/patients";
import { formatWhatsapp } from "@/lib/patient-schema";
import { prisma } from "@/lib/db";

export async function OwnerPicker({ base, title, q }: { base: string; title: string; q: string }) {
  const results = q.trim() ? await listOwners(q) : [];
  const balances = results.length ? await prisma.owner.findMany({ where: { id: { in: results.map((o) => o.id) } }, select: { id: true, walletBalance: true } }) : [];
  const balanceOf = new Map(balances.map((b) => [b.id, b.walletBalance]));

  return (
    <div className="space-y-5">
      <h1 className="text-[22px] font-semibold leading-11">{title}: pilih pemilik</h1>
      <form className="flex gap-2">
        <Input name="q" defaultValue={q} autoFocus placeholder="Nama atau no. WhatsApp pemilik" aria-label="Cari pemilik" />
        <Button type="submit" variant="outline">Cari</Button>
      </form>
      <div className="overflow-hidden rounded-[10px] border bg-card">
        {!q.trim() && <p className="p-6 text-center text-sm text-muted-foreground">Cari pemilik terlebih dahulu.</p>}
        {q.trim() && results.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Pemilik tidak ditemukan.</p>}
        {results.slice(0, 20).map((o) => (
          <Link key={o.id} href={`${base}?owner=${o.id}`} className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3.5 last:border-0">
            <span><span className="block text-[15px] font-semibold">{o.name}</span><span className="text-[13.5px] text-muted-foreground">{formatWhatsapp(o.whatsapp)} · {o.pets.length ? o.pets.join(", ") : "belum ada hewan"}</span></span>
            <span className="text-sm tabular-nums text-muted-foreground">Saldo {formatRupiah(balanceOf.get(o.id) ?? 0)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
