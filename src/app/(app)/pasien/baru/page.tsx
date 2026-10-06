import { notFound } from "next/navigation";
import { z } from "zod";
import { listActiveAnimalOptions } from "@/lib/animals";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getOwner, listOwners } from "@/lib/patients";
import { formatWhatsapp } from "@/lib/patient-schema";
import { requireCapability } from "@/lib/require-role";
import { PatientForm } from "../patient-form";

export default async function NewPatientPage({ searchParams }: { searchParams: Promise<{ owner?: string; q?: string }> }) {
  await requireCapability("manage_patients");
  const { owner: ownerId, q = "" } = await searchParams;
  if (!ownerId) {
    const owners = await listOwners(q);
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-[20px] font-semibold leading-11">Pasien baru: pilih pemilik</h1>
          <Button asChild><Link href="/pemilik/baru?lanjut=hewan">+ Pemilik baru</Link></Button>
        </div>
        <form className="flex gap-2">
          <Input name="q" defaultValue={q} autoFocus placeholder="Cari nama atau no. WhatsApp pemilik" aria-label="Cari pemilik" />
          <Button type="submit" variant="outline">Cari</Button>
        </form>
        <div className="overflow-hidden rounded-[10px] border bg-card">
          {owners.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Pemilik tidak ditemukan. Klik + Pemilik baru.</p>}
          {owners.slice(0, 50).map((o) => (
            <Link key={o.id} href={`/pasien/baru?owner=${o.id}`} className="flex flex-col gap-0.5 border-b px-4 py-3 last:border-0 hover:bg-accent/50">
              <span className="text-[14px] font-semibold">{o.name}</span>
              <span className="text-[12.5px] text-muted-foreground">{formatWhatsapp(o.whatsapp)} · {o.pets.length ? o.pets.join(", ") : "belum ada hewan"}</span>
            </Link>
          ))}
        </div>
      </div>
    );
  }
  if (!z.guid().safeParse(ownerId).success) notFound();
  const [owner, options] = await Promise.all([getOwner(ownerId), listActiveAnimalOptions()]);
  if (!owner) notFound();

  return (
    <div className="space-y-5">
      <h1 className="text-[20px] font-semibold leading-11">Hewan baru</h1>
      <PatientForm ownerId={owner.id} ownerName={owner.name} patient={null} options={options} />
    </div>
  );
}
