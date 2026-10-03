import Link from "next/link";
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
  if (!z.uuid().safeParse(id).success) notFound();
  const owner = await getOwner(id);
  if (!owner) notFound();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <Link href="/pasien" className="text-[13px] font-medium text-primary">
            ← Pasien & Owner
          </Link>
          <h1 className="text-[22px] font-semibold">{owner.name}</h1>
          <p className="text-sm text-muted-foreground">WA {formatWhatsapp(owner.whatsapp)}</p>
          <p className="text-sm text-muted-foreground">{owner.address}</p>
          {owner.notes && <p className="text-sm">{owner.notes}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/pasien/owner/${owner.id}/ubah`}>Ubah owner</Link>
          </Button>
          <Button asChild>
            <Link href={`/pasien/baru?owner=${owner.id}`}>+ Hewan baru</Link>
          </Button>
        </div>
      </div>

      <section className="overflow-hidden rounded-[10px] border bg-card">
        <h2 className="border-b px-4 py-3 text-base font-semibold">Hewan ({owner.patients.length})</h2>
        {owner.patients.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Belum ada hewan terdaftar.</p>}
        {owner.patients.map((p) => (
          <Link key={p.id} href={`/pasien?id=${p.id}`} className="flex flex-col gap-1 border-b px-4 py-3.5 last:border-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[15px] font-semibold">{p.name}</span>
              <ClinicalTags allergyNote={p.allergyNote} aggressive={p.aggressive} />
            </div>
            <span className="text-[13.5px] text-muted-foreground">{[p.species, p.breed, p.rmNo].filter(Boolean).join(" · ")}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
