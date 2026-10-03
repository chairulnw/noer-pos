import { notFound } from "next/navigation";
import { z } from "zod";
import { ConfirmButton } from "@/components/confirm-button";
import { getOwner } from "@/lib/patients";
import { requireCapability } from "@/lib/require-role";
import { deleteOwnerAction } from "../../../actions";
import { OwnerForm } from "../../../owner-form";

export default async function EditOwnerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireCapability("manage_patients");
  const { id } = await params;
  const { error } = await searchParams;
  if (!z.uuid().safeParse(id).success) notFound();
  const owner = await getOwner(id);
  if (!owner) notFound();

  return (
    <div className="space-y-5">
      <h1 className="text-[22px] font-semibold">Ubah owner</h1>
      <OwnerForm owner={owner} />
      <form action={deleteOwnerAction.bind(null, owner.id)} className="space-y-2 pt-4">
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <ConfirmButton variant="destructive" message={`Hapus owner ${owner.name}?`}>
          Hapus owner
        </ConfirmButton>
      </form>
    </div>
  );
}
