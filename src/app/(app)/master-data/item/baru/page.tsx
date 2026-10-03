import { requireCapability } from "@/lib/require-role";
import { ItemForm } from "../item-form";

export default async function NewItemPage() {
  await requireCapability("manage_service_price");
  return <ItemForm item={null} />;
}
