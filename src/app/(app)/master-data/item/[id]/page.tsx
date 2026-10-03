import { notFound } from "next/navigation";
import { z } from "zod";
import { getItem } from "@/lib/items";
import { requireCapability } from "@/lib/require-role";
import { ItemForm } from "../item-form";

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCapability("manage_service_price");
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const item = await getItem(id, user.role);
  if (!item) notFound();
  return <ItemForm item={item} />;
}
