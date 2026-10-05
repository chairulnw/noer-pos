import Link from "next/link";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { listOwners } from "@/lib/patients";
import { formatWhatsapp } from "@/lib/patient-schema";
import { requireCapability } from "@/lib/require-role";

export default async function OwnersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireCapability("manage_patients");
  const { q = "" } = await searchParams;
  const owners = await listOwners(q);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold leading-11">Pemilik Hewan</h1>
          <p className="text-sm text-muted-foreground">Data klien pemilik hewan, kontak WhatsApp, dan alamat.</p>
        </div>
        <Button asChild>
          <Link href="/pemilik/baru">+ Pemilik baru</Link>
        </Button>
      </header>

      <form className="flex h-11 w-full items-center gap-2.5 rounded-lg border border-input bg-card px-3 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
        <Search className="size-[18px] text-muted-foreground" />
        <input name="q" data-search defaultValue={q} aria-label="Cari pemilik" placeholder="Nama, no. WA, atau alamat" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none" />
        <span className="text-[13px] text-muted-foreground">{q ? `${owners.length} hasil` : "Terbaru"}</span>
      </form>

      <div className="overflow-x-auto rounded-[10px] border bg-card">
        <table className="w-full min-w-[640px] text-[14.5px]">
          <thead>
            <tr className="border-b text-left text-[13px] text-muted-foreground">
              <th className="px-4 py-2.5 font-normal">Nama pemilik</th>
              <th className="px-4 py-2.5 font-normal">WhatsApp</th>
              <th className="px-4 py-2.5 font-normal">Hewan</th>
              <th className="px-4 py-2.5 font-normal">Alamat</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {owners.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <EmptyState action={<Button asChild variant="outline"><Link href="/pemilik/baru">+ Pemilik baru</Link></Button>}>{q ? "Tidak ada pemilik ditemukan." : "Belum ada pemilik terdaftar."}</EmptyState>
                </td>
              </tr>
            )}
            {owners.map((o) => (
              <tr key={o.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{o.name}</td>
                <td className="px-4 py-3 tabular-nums">{formatWhatsapp(o.whatsapp)}</td>
                <td className="px-4 py-3">{o.pets.length === 0 ? <span className="text-muted-foreground">Belum ada</span> : o.pets.join(", ")}</td>
                <td className="max-w-64 truncate px-4 py-3 text-muted-foreground">{o.address}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/pemilik/${o.id}`} className="inline-flex min-h-11 items-center px-2 font-medium text-primary">Lihat</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
