import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCapability } from "@/lib/require-role";
import { OwnerPicker } from "../owner-picker";
import { TopUpForm } from "../wallet-forms";

export default async function TopUpPage({ searchParams }: { searchParams: Promise<{ owner?: string; q?: string }> }) {
  await requireCapability("manage_invoice_payment");
  const { owner: ownerId, q = "" } = await searchParams;
  const owner = ownerId && z.guid().safeParse(ownerId).success ? await prisma.owner.findFirst({ where: { id: ownerId, deletedAt: null }, select: { id: true, name: true, walletBalance: true } }) : null;
  if (!owner) return <OwnerPicker base="/deposit/top-up" title="Top-up saldo" q={q} />;

  return (
    <div className="space-y-5">
      <h1 className="text-[20px] font-semibold leading-11">Top-up saldo klien</h1>
      <TopUpForm ownerId={owner.id} ownerName={owner.name} balance={owner.walletBalance} />
    </div>
  );
}
