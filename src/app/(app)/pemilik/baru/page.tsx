import { requireCapability } from "@/lib/require-role";
import { OwnerForm } from "../../pasien/owner-form";

export default async function NewOwnerPage() {
  await requireCapability("manage_patients");
  return (
    <div className="space-y-5">
      <h1 className="text-[20px] font-semibold leading-11">Owner baru</h1>
      <OwnerForm owner={null} />
    </div>
  );
}
