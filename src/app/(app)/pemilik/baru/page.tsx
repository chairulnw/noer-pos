import { requireCapability } from "@/lib/require-role";
import { OwnerForm } from "../../pasien/owner-form";

export default async function NewOwnerPage({ searchParams }: { searchParams: Promise<{ lanjut?: string }> }) {
  await requireCapability("manage_patients");
  const thenPet = (await searchParams).lanjut === "hewan";
  return (
    <div className="space-y-5">
      <h1 className="text-[20px] font-semibold leading-11">Owner baru</h1>
      {thenPet && <p className="text-sm text-muted-foreground">Setelah pemilik disimpan, Anda langsung lanjut mengisi data hewannya.</p>}
      <OwnerForm owner={null} thenPet={thenPet} />
    </div>
  );
}
