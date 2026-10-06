import { requireCapability } from "@/lib/require-role";
import { SpeciesForm } from "../../master-forms";

export default async function NewSpeciesPage() {
  await requireCapability("manage_users_settings");
  return (
    <div className="space-y-5">
      <h1 className="text-[20px] font-semibold leading-11">Jenis hewan baru</h1>
      <SpeciesForm id={null} defaults={{ name: "", active: true }} />
    </div>
  );
}
