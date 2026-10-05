import { notFound } from "next/navigation";
import { z } from "zod";
import { getBreed, listAllSpecies } from "@/lib/animals";
import { requireCapability } from "@/lib/require-role";
import { BreedForm } from "../../master-forms";

export default async function EditBreedPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCapability("manage_users_settings");
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();
  const [breed, species] = await Promise.all([getBreed(id), listAllSpecies()]);
  if (!breed) notFound();
  return (
    <div className="space-y-5">
      <h1 className="text-[22px] font-semibold leading-11">Ubah ras hewan: {breed.name}</h1>
      <BreedForm id={breed.id} species={species} defaults={{ name: breed.name, speciesId: breed.speciesId, active: breed.active }} />
    </div>
  );
}
