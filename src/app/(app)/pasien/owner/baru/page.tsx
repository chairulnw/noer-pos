import { requireCapability } from "@/lib/require-role";
import { OwnerForm } from "../../owner-form";

export default async function NewOwnerPage() {
  await requireCapability("manage_patients");
  return (
    <div className="space-y-5">
      <h1 className="text-[22px] font-semibold">Owner baru</h1>
      <OwnerForm owner={null} />
    </div>
  );
}
