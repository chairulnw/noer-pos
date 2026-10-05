import { notFound } from "next/navigation";
import { z } from "zod";
import { getSpecies } from "@/lib/animals";
import { requireCapability } from "@/lib/require-role";
import { SpeciesForm } from "../../master-forms";

export default async function EditSpeciesPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCapability("manage_users_settings");
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();
  const species = await getSpecies(id);
  if (!species) notFound();
  return (
    <div className="space-y-5">
      <h1 className="text-[22px] font-semibold leading-11">Ubah jenis hewan: {species.name}</h1>
      <SpeciesForm id={species.id} defaults={{ name: species.name, active: species.active }} />
    </div>
  );
}
