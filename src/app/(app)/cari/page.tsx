import Link from "next/link";
import { Search } from "lucide-react";
import { ListHeader, ListPage } from "@/components/data-table";
import { EmptyState } from "@/components/page-header";
import { formatRupiah } from "@/lib/format";
import { requireUser } from "@/lib/require-role";
import { globalSearch } from "@/lib/search";

function Group({ title, more, children }: { title: string; more: string; children: React.ReactNode[] }) {
  if (children.length === 0) return null;
  return (
    <section className="overflow-hidden rounded-[10px] border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <h2 className="text-base font-semibold">{title}</h2>
        <Link href={more} className="text-sm font-medium text-primary">Lihat semua</Link>
      </div>
      {children}
    </section>
  );
}

const Hit = ({ href, title, detail }: { href: string; title: string; detail?: string }) => (
  <Link href={href} className="flex flex-col border-b px-4 py-3 last:border-0 hover:bg-accent/50">
    <span className="font-medium">{title}</span>
    {detail && <span className="text-[12.5px] text-muted-foreground">{detail}</span>}
  </Link>
);

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser();
  const q = (await searchParams).q?.trim() ?? "";
  const r = q ? await globalSearch(user.role, q) : null;
  const empty = r && !r.patients?.rows.length && !r.owners?.rows.length && !r.invoices?.rows.length && !r.items?.rows.length;
  const enc = encodeURIComponent(q);

  return (
    <ListPage>
      <ListHeader icon={Search} title="Pencarian" subtitle={q ? `Hasil untuk “${q}”` : "Cari pasien, pemilik, tagihan, atau produk"} />
      {!q && <EmptyState>Ketik kata kunci di kolom pencarian (Ctrl/⌘ + K).</EmptyState>}
      {empty && <EmptyState>Tidak ada hasil untuk “{q}”.</EmptyState>}
      <div className="space-y-4">
        <Group title="Pasien" more={`/pasien?q=${enc}`}>
          {(r?.patients?.rows ?? []).map((p) => <Hit key={p.id} href={`/pasien?id=${p.id}`} title={p.name} detail={`${[p.species, p.breed].filter(Boolean).join(" · ")} · ${p.rmNo} · ${p.owner.name}`} />)}
        </Group>
        <Group title="Pemilik" more={`/pemilik?q=${enc}`}>
          {(r?.owners?.rows ?? []).map((o) => <Hit key={o.id} href={`/pemilik/${o.id}`} title={o.name} detail={o.pets.join(", ") || "Belum punya hewan"} />)}
        </Group>
        <Group title="Tagihan" more={`/invoice?q=${enc}`}>
          {(r?.invoices?.rows ?? []).map((i) => <Hit key={i.id} href={`/invoice/${i.id}`} title={i.invoiceNo} detail={`${(i.visit ?? i.admission)?.patient.name ?? i.customerName ?? "Umum / Walk-in"} · ${formatRupiah(i.grandTotal)}`} />)}
        </Group>
        <Group title="Produk & layanan" more={`/master-data/item?q=${enc}`}>
          {(r?.items?.rows ?? []).map((i) => <Hit key={i.id} href={`/master-data/item/${i.id}`} title={i.name} detail={`${i.category} · ${formatRupiah(i.sellPrice)}`} />)}
        </Group>
      </div>
    </ListPage>
  );
}
