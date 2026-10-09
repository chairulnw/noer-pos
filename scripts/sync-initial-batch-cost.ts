import "dotenv/config";
import { prisma } from "../src/lib/db";
import { logAudit } from "../src/lib/audit";

// Pakai: tsx scripts/sync-initial-batch-cost.ts [--user owner] [--apply]
// Menyamakan modal per satuan pada batch "STOK-AWAL" dengan harga beli item saat ini (mis. setelah satuan dasar diganti).
// Hanya menyentuh batch yang belum dipakai (hanya ada pergerakan stok masuk). Jumlah stok tidak diubah. Tanpa --apply hanya pratinjau.
const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const option = (name: string) => (flag(name) ? args[args.indexOf(`--${name}`) + 1] : undefined);

async function main() {
  const apply = flag("apply");
  const username = option("user") ?? "owner";

  const batches = await prisma.stockBatch.findMany({
    where: { batchNo: "STOK-AWAL", item: { type: "PRODUCT", deletedAt: null } },
    select: { id: true, qtyOnHand: true, costPerBaseUnit: true, item: { select: { sku: true, name: true, buyPrice: true, baseUnit: true } }, movements: { select: { type: true } } },
  });

  const untouched = batches.filter((b) => b.movements.every((m) => m.type === "IN"));
  const changes = untouched.filter((b) => Number(b.costPerBaseUnit) !== Number(b.item.buyPrice));
  console.log(`Batch STOK-AWAL: ${batches.length} | belum dipakai: ${untouched.length} | modal berbeda dari harga beli item: ${changes.length}`);
  for (const b of changes.slice(0, 6)) console.log(`  ${b.item.sku} ${b.item.name}: modal ${Number(b.costPerBaseUnit)} -> ${Number(b.item.buyPrice)} per ${b.item.baseUnit}`);

  if (!apply) {
    console.log("\nPRATINJAU saja, tidak ada yang disimpan. Tambahkan --apply untuk menyimpan.");
    return;
  }
  const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!user) {
    console.error(`User "${username}" tidak ditemukan.`);
    process.exit(1);
  }
  await prisma.$transaction(
    async (tx) => {
      for (const b of changes) {
        await tx.stockBatch.update({ where: { id: b.id }, data: { costPerBaseUnit: b.item.buyPrice } });
        await logAudit(tx, {
          userId: user.id,
          action: "stock.cost_sync",
          entity: "stock_batch",
          entityId: b.id,
          before: { costPerBaseUnit: Number(b.costPerBaseUnit) },
          after: { costPerBaseUnit: Number(b.item.buyPrice), baseUnit: b.item.baseUnit },
        });
      }
    },
    { timeout: 120_000 },
  );
  console.log(`\nSELESAI: ${changes.length} batch disesuaikan.`);
}

main().finally(() => prisma.$disconnect());
