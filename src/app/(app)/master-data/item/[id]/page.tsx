import { notFound } from "next/navigation";
import { z } from "zod";
import { getItem } from "@/lib/items";
import { requireCapability } from "@/lib/require-role";
import { ItemForm } from "../item-form";

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCapability("manage_service_price");
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();

  const item = await getItem(id, user.role);
  if (!item) notFound();
  return (
    <div className="space-y-5">
      <h1 className="text-[22px] font-semibold leading-11">Ubah: {item.name}</h1>
      <ItemForm item={item} />
    </div>
  );
}
