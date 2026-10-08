import "dotenv/config";
import { readFileSync } from "node:fs";
import { prisma } from "../src/lib/db";
import { itemSchema, normalizeItem, type ItemInput } from "../src/lib/item-schema";
import { logAudit } from "../src/lib/audit";

// Pakai: tsx scripts/import-items.ts <file.csv> [--source F1] [--user owner] [--apply]
// Tanpa --apply hanya pratinjau (tidak ada yang disimpan). SKU yang sudah ada diperbarui, bukan digandakan.
const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const option = (name: string) => (flag(name) ? args[args.indexOf(`--${name}`) + 1] : undefined);
const file = args.find((a) => !a.startsWith("--") && a !== option("source") && a !== option("user"));

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ";") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((c) => c !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  const [header, ...body] = rows;
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

async function main() {
  if (!file) {
    console.error("Pakai: tsx scripts/import-items.ts <file.csv> [--source F1] [--user owner] [--apply]");
    process.exit(1);
  }
  const source = option("source");
  const apply = flag("apply");
  const username = option("user") ?? "owner";

  const all = parseCsv(readFileSync(file, "utf8"));
  const rows = all.filter((r) => r.aksi === "IMPORT" && (!source || r.sumber.startsWith(source)));
  const skipped = all.filter((r) => r.aksi !== "IMPORT" && (!source || r.sumber.startsWith(source))).length;

  const valid: { sku: string; data: ReturnType<typeof normalizeItem> }[] = [];
  const problems: string[] = [];
  const seenSku = new Set<string>();
  for (const r of rows) {
    const input: ItemInput = {
      type: r.tipe as ItemInput["type"],
      category: r.kategori_ibu,
      subCategory: r.sub_kategori,
      name: r.nama,
      sku: r.sku,
      barcode: "",
      sellPrice: Number(r.harga_jual),
      buyPrice: Number(r.harga_beli),
      baseUnit: r.satuan_dasar,
      purchaseUnit: r.satuan_beli,
      conversionFactor: Number(r.faktor_konversi) || 1,
      lowStockThreshold: null,
      trackExpiry: false,
      billingUnit: "PER_ITEM",
      vaccineIntervalDays: null,
      active: true,
    };
    const parsed = itemSchema.safeParse(input);
    if (!parsed.success) {
      problems.push(`${r.sku} ${r.nama}: ${parsed.error.issues.map((i) => i.message).join(", ")}`);
      continue;
    }
    if (seenSku.has(r.sku)) { problems.push(`${r.sku} ${r.nama}: SKU ganda di file`); continue; }
    seenSku.add(r.sku);
    valid.push({ sku: r.sku, data: normalizeItem(parsed.data) });
  }

  const existing = new Map((await prisma.item.findMany({ where: { sku: { in: valid.map((v) => v.sku) } }, select: { id: true, sku: true } })).map((i) => [i.sku!, i.id]));
  const toCreate = valid.filter((v) => !existing.has(v.sku));
  const toUpdate = valid.filter((v) => existing.has(v.sku));

  console.log(`File: ${file}${source ? ` (sumber ${source})` : ""}`);
  console.log(`Baris IMPORT: ${rows.length} | dilewati (LEWATI): ${skipped} | tidak valid: ${problems.length}`);
  console.log(`Akan dibuat: ${toCreate.length} | akan diperbarui (SKU sudah ada): ${toUpdate.length}`);
  const byCat: Record<string, number> = {};
  for (const v of valid) byCat[`${v.data.type}/${v.data.category}`] = (byCat[`${v.data.type}/${v.data.category}`] ?? 0) + 1;
  console.log("Per kategori:", byCat);
  console.log(`Produk dengan harga beli 0: ${valid.filter((v) => v.data.type === "PRODUCT" && v.data.buyPrice === 0).length}`);
  if (problems.length) console.log("Tidak valid:\n  " + problems.join("\n  "));

  if (!apply) {
    console.log("\nPRATINJAU saja, tidak ada yang disimpan. Tambahkan --apply untuk menyimpan.");
    return;
  }
  if (problems.length) {
    console.error("\nAda baris tidak valid. Perbaiki dulu, tidak ada yang disimpan.");
    process.exit(1);
  }
  const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!user) {
    console.error(`User "${username}" tidak ditemukan (dipakai untuk audit log).`);
    process.exit(1);
  }

  await prisma.$transaction(
    async (tx) => {
      for (const v of toCreate) {
        const created = await tx.item.create({ data: v.data, select: { id: true } });
        await logAudit(tx, { userId: user.id, action: "item.create", entity: "item", entityId: created.id, after: { ...v.data, via: "import" } });
      }
      for (const v of toUpdate) {
        const id = existing.get(v.sku)!;
        await tx.item.update({ where: { id }, data: v.data });
        await logAudit(tx, { userId: user.id, action: "item.update", entity: "item", entityId: id, after: { ...v.data, via: "import" } });
      }
    },
    { timeout: 120_000 },
  );
  console.log(`\nSELESAI: ${toCreate.length} dibuat, ${toUpdate.length} diperbarui.`);
}

main().finally(() => prisma.$disconnect());
