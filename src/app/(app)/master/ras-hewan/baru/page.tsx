import { listAllSpecies } from "@/lib/animals";
import { requireCapability } from "@/lib/require-role";
import { BreedForm } from "../../master-forms";

export default async function NewBreedPage({ searchParams }: { searchParams: Promise<{ jenis?: string }> }) {
  await requireCapability("manage_users_settings");
  const { jenis } = await searchParams;
  const species = (await listAllSpecies()).filter((s) => s.active);
  return (
    <div className="space-y-5">
      <h1 className="text-[22px] font-semibold leading-11">Ras hewan baru</h1>
      <BreedForm id={null} species={species} defaults={{ name: "", speciesId: species.some((s) => s.id === jenis) ? (jenis ?? "") : "", active: true }} />
    </div>
  );
}
