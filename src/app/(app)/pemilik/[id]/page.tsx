import Link from "next/link";
import { EmptyState } from "@/components/page-header";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ClinicalTags } from "@/components/clinical-flags";
import { getOwner } from "@/lib/patients";
import { formatWhatsapp } from "@/lib/patient-schema";
import { requireCapability } from "@/lib/require-role";

export default async function OwnerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCapability("manage_patients");
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();
  const owner = await getOwner(id);
  if (!owner) notFound();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <Link href="/pemilik" className="text-[12.5px] font-medium text-primary">
            ← Pemilik Hewan
          </Link>
          <h1 className="text-[20px] font-semibold leading-11">{owner.name}</h1>
          <p className="text-sm text-muted-foreground">WA {formatWhatsapp(owner.whatsapp)}</p>
          <p className="text-sm text-muted-foreground">{owner.address}</p>
          {owner.notes && <p className="text-sm">{owner.notes}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/pemilik/${owner.id}/ubah`}>Ubah owner</Link>
          </Button>
          <Button asChild>
            <Link href={`/pasien/baru?owner=${owner.id}`}>+ Hewan baru</Link>
          </Button>
        </div>
      </div>

      <section className="overflow-hidden rounded-[10px] border bg-card">
        <h2 className="border-b px-4 py-3 text-base font-semibold">Hewan ({owner.patients.length})</h2>
        {owner.patients.length === 0 && <EmptyState action={<Button asChild><Link href={`/pasien/baru?owner=${owner.id}`}>+ Hewan baru</Link></Button>}>Belum ada hewan terdaftar.</EmptyState>}
        {owner.patients.map((p) => (
          <Link key={p.id} href={`/pasien?id=${p.id}`} className="flex flex-col gap-1 border-b px-4 py-3.5 last:border-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[14px] font-semibold">{p.name}</span>
              <ClinicalTags allergyNote={p.allergyNote} aggressive={p.aggressive} />
            </div>
            <span className="text-[13px] text-muted-foreground">{[p.species, p.breed, p.rmNo].filter(Boolean).join(" · ")}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
