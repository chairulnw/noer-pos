import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";
import { listOwners } from "@/lib/patients";
import { formatWhatsapp } from "@/lib/patient-schema";

export async function OwnerPicker({ base, title, q }: { base: string; title: string; q: string }) {
  const results = await listOwners(q);

  return (
    <div className="space-y-5">
      <h1 className="text-[20px] font-semibold leading-11">{title}: pilih pemilik</h1>
      <form className="flex gap-2">
        <Input name="q" defaultValue={q} autoFocus placeholder="Nama atau no. WhatsApp pemilik" aria-label="Cari pemilik" />
        <Button type="submit" variant="outline">Cari</Button>
      </form>
      <div className="overflow-hidden rounded-[10px] border bg-card">
        {results.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Pemilik tidak ditemukan.</p>}
        {results.slice(0, 50).map((o) => (
          <Link key={o.id} href={`${base}?owner=${o.id}`} className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3.5 last:border-0">
            <span><span className="block text-[14px] font-semibold">{o.name}</span><span className="text-[13px] text-muted-foreground">{formatWhatsapp(o.whatsapp)} · {o.pets.length ? o.pets.join(", ") : "belum ada hewan"}</span></span>
            <span className="text-sm tabular-nums text-muted-foreground">Saldo {formatRupiah(o.walletBalance)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
