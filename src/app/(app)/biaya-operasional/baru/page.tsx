import { todayJakarta } from "@/lib/date";
import { requireCapability } from "@/lib/require-role";
import { CostForm } from "../cost-form";

export default async function NewCostPage() {
  await requireCapability("view_revenue_reports");
  return (
    <div className="space-y-5">
      <h1 className="text-[22px] font-semibold leading-11">Catat biaya baru</h1>
      <CostForm id={null} defaults={{ name: "", amount: "", category: "", costDate: todayJakarta().toISOString().slice(0, 10), notes: "" }} />
    </div>
  );
}
