import "dotenv/config";
import { prisma } from "../src/lib/db";
import { receiveStock } from "../src/lib/inventory";

// Pakai: tsx scripts/set-initial-stock.ts [--qty 100] [--user owner] [--apply]
// Mengisi stok produk aktif yang stoknya 0 (satuan dasar). Tanpa --apply hanya pratinjau.
// Produk yang sudah punya stok tidak disentuh, jadi aman dijalankan ulang.
const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const option = (name: string) => (flag(name) ? args[args.indexOf(`--${name}`) + 1] : undefined);

async function main() {
  const qty = Number(option("qty") ?? 100);
  const username = option("user") ?? "owner";
  const apply = flag("apply");
  if (!(qty > 0)) {
    console.error("--qty harus lebih dari 0.");
    process.exit(1);
  }

  const items = await prisma.item.findMany({
    where: { type: "PRODUCT", active: true, deletedAt: null },
    select: { id: true, name: true, sku: true, buyPrice: true, purchaseUnit: true, conversionFactor: true, baseUnit: true, stockBatches: { select: { qtyOnHand: true } } },
    orderBy: { name: "asc" },
  });
  const empty = items.filter((i) => i.stockBatches.reduce((sum, b) => sum + Number(b.qtyOnHand), 0) <= 0);

  console.log(`Produk aktif: ${items.length} | stok kosong (akan diisi ${qty}): ${empty.length} | sudah ada stok (dilewati): ${items.length - empty.length}`);
  for (const i of empty.slice(0, 5)) console.log(`  contoh: ${i.sku ?? "-"} ${i.name} -> ${qty} ${i.baseUnit}`);

  if (!apply) {
    console.log("\nPRATINJAU saja, tidak ada yang disimpan. Tambahkan --apply untuk menyimpan.");
    return;
  }
  const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!user) {
    console.error(`User "${username}" tidak ditemukan.`);
    process.exit(1);
  }

  let done = 0;
  const failed: string[] = [];
  for (const i of empty) {
    // receiveStock menerima jumlah dalam satuan beli bila ada; ubah supaya "qty" berarti satuan dasar
    const factor = i.purchaseUnit ? Number(i.conversionFactor) : 1;
    const result = await receiveStock(user.id, {
      itemId: i.id,
      qty: qty / factor,
      batchNo: "STOK-AWAL",
      expiry: "",
      price: i.buyPrice * factor,
      note: `Stok awal ${qty} ${i.baseUnit} (pengisian massal)`,
    });
    if ("error" in result) failed.push(`${i.sku ?? "-"} ${i.name}: ${result.error}`);
    else done++;
  }
  console.log(`\nSELESAI: ${done} produk diisi ${qty}, gagal: ${failed.length}`);
  if (failed.length) console.log("Gagal:\n  " + failed.join("\n  "));
}

main().finally(() => prisma.$disconnect());
