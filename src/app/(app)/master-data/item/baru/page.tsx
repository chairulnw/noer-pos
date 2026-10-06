import { requireCapability } from "@/lib/require-role";
import { ItemForm } from "../item-form";

export default async function NewItemPage() {
  await requireCapability("manage_service_price");
  return (
    <div className="space-y-5">
      <h1 className="text-[20px] font-semibold leading-11">Produk Baru</h1>
      <ItemForm item={null} />
    </div>
  );
}
