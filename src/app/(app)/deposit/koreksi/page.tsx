import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCapability } from "@/lib/require-role";
import { OwnerPicker } from "../owner-picker";
import { AdjustForm } from "../wallet-forms";

export default async function AdjustPage({ searchParams }: { searchParams: Promise<{ owner?: string; q?: string }> }) {
  await requireCapability("correct_deposit");
  const { owner: ownerId, q = "" } = await searchParams;
  const owner = ownerId && z.guid().safeParse(ownerId).success ? await prisma.owner.findFirst({ where: { id: ownerId, deletedAt: null }, select: { id: true, name: true, walletBalance: true } }) : null;
  if (!owner) return <OwnerPicker base="/deposit/koreksi" title="Koreksi saldo" q={q} />;

  return (
    <div className="space-y-5">
      <h1 className="text-[20px] font-semibold leading-11">Koreksi saldo klien</h1>
      <AdjustForm ownerId={owner.id} ownerName={owner.name} balance={owner.walletBalance} />
    </div>
  );
}
