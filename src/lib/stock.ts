export type StockBatchInfo = { id: string; expiry: Date | null; qty: number; createdAt: Date };

const milli = (n: number) => Math.round(n * 1000);

export const isExpired = (expiry: Date | null, today: Date) => expiry !== null && expiry < today;

export const toBaseQty = (qty: number, factor: number) => milli(qty) * milli(factor) / 1_000_000;

export const round3 = (n: number) => Math.round(n * 1000) / 1000;

export const costPerBaseUnit = (pricePerPurchaseUnit: number, factor: number) => round3(pricePerPurchaseUnit / factor);

export function fefoAllocate(batches: StockBatchInfo[], needed: number, today: Date) {
  const usable = batches
    .filter((b) => milli(b.qty) > 0 && !isExpired(b.expiry, today))
    .sort((a, b) => {
      if (a.expiry && b.expiry) return a.expiry.getTime() - b.expiry.getTime() || a.createdAt.getTime() - b.createdAt.getTime();
      if (a.expiry || b.expiry) return a.expiry ? -1 : 1;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

  let remaining = milli(needed);
  const allocations: { batchId: string; qty: number }[] = [];
  for (const batch of usable) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, milli(batch.qty));
    allocations.push({ batchId: batch.id, qty: take / 1000 });
    remaining -= take;
  }

  if (remaining > 0) {
    const available = usable.reduce((sum, b) => sum + milli(b.qty), 0) / 1000;
    return { ok: false as const, available };
  }
  return { ok: true as const, allocations };
}

export type StockStatus = "HABIS" | "MENIPIS" | "HAMPIR_EXPIRED" | "AMAN";

export function stockStatus(
  batches: { expiry: Date | null; qty: number }[],
  lowThreshold: number | null,
  today: Date,
  warnDays: number,
): { usable: number; status: StockStatus; nearestExpiry: Date | null } {
  const live = batches.filter((b) => milli(b.qty) > 0 && !isExpired(b.expiry, today));
  const usable = live.reduce((sum, b) => sum + milli(b.qty), 0) / 1000;
  const nearestExpiry = live.reduce<Date | null>((min, b) => (b.expiry && (!min || b.expiry < min) ? b.expiry : min), null);
  const warnUntil = new Date(today.getTime() + warnDays * 86_400_000);

  if (usable === 0) return { usable, status: "HABIS", nearestExpiry };
  if (lowThreshold !== null && usable <= lowThreshold) return { usable, status: "MENIPIS", nearestExpiry };
  if (nearestExpiry && nearestExpiry <= warnUntil) return { usable, status: "HAMPIR_EXPIRED", nearestExpiry };
  return { usable, status: "AMAN", nearestExpiry };
}

export const weightedCost = (oldQty: number, oldCost: number, inQty: number, inCost: number) =>
  round3((oldQty * oldCost + inQty * inCost) / (oldQty + inQty));

export const opnameDiff = (system: number, counted: number) => (milli(counted) - milli(system)) / 1000;

export type BatchAlert = "EXPIRED" | "HAMPIR_EXPIRED" | null;

export function batchExpiryAlert(expiry: Date | null, qty: number, today: Date, warnDays: number): BatchAlert {
  if (expiry === null || milli(qty) <= 0) return null;
  if (isExpired(expiry, today)) return "EXPIRED";
  return expiry <= new Date(today.getTime() + warnDays * 86_400_000) ? "HAMPIR_EXPIRED" : null;
}

export const isLowStock = (usable: number, threshold: number | null) => threshold !== null && usable <= threshold;
