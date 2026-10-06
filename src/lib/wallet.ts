import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import type { AdjustInput, TopUpInput } from "@/lib/wallet-schema";

type Tx = Prisma.TransactionClient;
type Method = "TUNAI" | "QRIS" | "TRANSFER" | "KARTU" | "WALLET";

export class WalletRejected extends Error {}

type Entry = { ownerId: string; amount: number; invoiceId?: string; paymentId?: string; method?: Method; note?: string; userId: string };

export async function creditWallet(tx: Tx, type: "TOPUP" | "RETURN" | "ADJUST", e: Entry) {
  const owner = await tx.owner.update({ where: { id: e.ownerId }, data: { walletBalance: { increment: e.amount } }, select: { walletBalance: true } });
  await tx.walletTransaction.create({
    data: { ownerId: e.ownerId, type, amount: e.amount, balanceAfter: owner.walletBalance, method: e.method, invoiceId: e.invoiceId, paymentId: e.paymentId, note: e.note, createdById: e.userId },
  });
  return owner.walletBalance;
}

export async function debitWallet(tx: Tx, type: "PAYMENT" | "ADJUST", e: Entry) {
  const { count } = await tx.owner.updateMany({ where: { id: e.ownerId, walletBalance: { gte: e.amount } }, data: { walletBalance: { decrement: e.amount } } });
  if (count === 0) throw new WalletRejected("Saldo deposit tidak cukup.");
  const owner = await tx.owner.findUniqueOrThrow({ where: { id: e.ownerId }, select: { walletBalance: true } });
  await tx.walletTransaction.create({
    data: { ownerId: e.ownerId, type, amount: -e.amount, balanceAfter: owner.walletBalance, method: e.method, invoiceId: e.invoiceId, paymentId: e.paymentId, note: e.note, createdById: e.userId },
  });
  return owner.walletBalance;
}

const activeOwner = (tx: Tx, id: string) => tx.owner.findFirst({ where: { id, deletedAt: null }, select: { id: true } });

export async function topUp(userId: string, input: TopUpInput) {
  return prisma.$transaction(async (tx) => {
    if (!(await activeOwner(tx, input.ownerId))) return { error: "Pemilik tidak ditemukan." };
    const balance = await creditWallet(tx, "TOPUP", { ownerId: input.ownerId, amount: input.amount, method: input.method, note: input.note || undefined, userId });
    await logAudit(tx, { userId, action: "wallet.topup", entity: "owner", entityId: input.ownerId, after: { amount: input.amount, method: input.method, balanceAfter: balance } });
    return { balance };
  });
}

export async function adjustWallet(userId: string, input: AdjustInput) {
  try {
    return await prisma.$transaction(async (tx) => {
      if (!(await activeOwner(tx, input.ownerId))) return { error: "Pemilik tidak ditemukan." };
      const before = await tx.owner.findUniqueOrThrow({ where: { id: input.ownerId }, select: { walletBalance: true } });
      const entry = { ownerId: input.ownerId, amount: Math.abs(input.delta), note: input.reason, userId };
      const balance = input.delta > 0 ? await creditWallet(tx, "ADJUST", entry) : await debitWallet(tx, "ADJUST", entry);
      await logAudit(tx, { userId, action: "wallet.adjust", entity: "owner", entityId: input.ownerId, before: { balance: before.walletBalance }, after: { balance, delta: input.delta, reason: input.reason } });
      return { balance };
    });
  } catch (error) {
    if (error instanceof WalletRejected) return { error: error.message };
    throw error;
  }
}

export async function walletSummary() {
  const [total, owners] = await Promise.all([
    prisma.owner.aggregate({ where: { deletedAt: null }, _sum: { walletBalance: true } }),
    prisma.owner.count({ where: { deletedAt: null, walletBalance: { gt: 0 } } }),
  ]);
  return { total: total._sum.walletBalance ?? 0, owners };
}

export async function pageWalletTransactions({ ownerId, q }: { ownerId?: string; q?: string }, skip: number, take: number, orderBy?: Prisma.WalletTransactionOrderByWithRelationInput | Prisma.WalletTransactionOrderByWithRelationInput[]) {
  const term = q?.trim();
  const where: Prisma.WalletTransactionWhereInput = {
    ...(ownerId && { ownerId }),
    ...(term && { OR: [{ owner: { name: { contains: term, mode: "insensitive" } } }, { note: { contains: term, mode: "insensitive" } }, { invoice: { invoiceNo: { contains: term, mode: "insensitive" } } }] }),
  };
  const [rows, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where,
      select: { id: true, type: true, amount: true, balanceAfter: true, method: true, note: true, createdAt: true, owner: { select: { id: true, name: true } }, invoice: { select: { id: true, invoiceNo: true } }, createdBy: { select: { name: true } } },
      orderBy: orderBy ?? { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.walletTransaction.count({ where }),
  ]);
  return { rows, total };
}

export const listOwnersWithBalance = () =>
  prisma.owner.findMany({ where: { deletedAt: null, walletBalance: { gt: 0 } }, select: { id: true, name: true, walletBalance: true }, orderBy: { name: "asc" }, take: 200 });
