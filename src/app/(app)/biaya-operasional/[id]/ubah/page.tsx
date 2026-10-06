import { notFound } from "next/navigation";
import { z } from "zod";
import { getCost } from "@/lib/costs";
import { requireCapability } from "@/lib/require-role";
import { CostForm } from "../../cost-form";

export default async function EditCostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCapability("view_revenue_reports");
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();
  const cost = await getCost(id);
  if (!cost) notFound();
  return (
    <div className="space-y-5">
      <h1 className="text-[20px] font-semibold leading-11">Ubah biaya: {cost.name}</h1>
      <CostForm id={cost.id} defaults={{ name: cost.name, amount: String(cost.amount), category: cost.category, costDate: cost.costDate.toISOString().slice(0, 10), notes: cost.notes ?? "" }} />
    </div>
  );
}
