import { prisma } from "../src/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash,
      name: "Admin Klinik",
      role: "ADMIN",
    },
  });

  const dokter = await prisma.user.upsert({
    where: { username: "dokter" },
    update: {},
    create: {
      username: "dokter",
      passwordHash,
      name: "Drh. Contoh",
      role: "KARYAWAN",
      isDoctor: true,
    },
  });

  await prisma.user.upsert({
    where: { username: "kasir" },
    update: {},
    create: {
      username: "kasir",
      passwordHash,
      name: "Kasir Contoh",
      role: "KARYAWAN",
    },
  });

  const konsultasi = await prisma.item.upsert({
    where: { sku: "JASA-KONSUL" },
    update: {},
    create: {
      type: "SERVICE",
      category: "konsultasi",
      sku: "JASA-KONSUL",
      name: "Konsultasi Umum",
      sellPrice: 50_000,
      buyPrice: 0,
      baseUnit: "kali",
      billingUnit: "PER_ITEM",
    },
  });

  await prisma.item.upsert({
    where: { sku: "OBT-AMOX-100" },
    update: {},
    create: {
      type: "PRODUCT",
      category: "obat",
      sku: "OBT-AMOX-100",
      name: "Amoxicillin 100mg",
      sellPrice: 2_000,
      buyPrice: 1_200,
      baseUnit: "tablet",
      purchaseUnit: "box",
      conversionFactor: 100,
      lowStockThreshold: 50,
      trackExpiry: true,
    },
  });

  const owner = await prisma.owner.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Budi Santoso",
      whatsapp: "6281234567890",
      address: "Jl. Contoh No. 1, Jakarta",
    },
  });

  await prisma.patient.upsert({
    where: { rmNo: "RM-2026-00001" },
    update: {},
    create: {
      ownerId: owner.id,
      rmNo: "RM-2026-00001",
      name: "Kitty",
      species: "Kucing",
      breed: "Domestik",
      sex: "BETINA",
      neutered: false,
    },
  });

  console.log("Seed selesai:", { admin: admin.username, dokter: dokter.username, item: konsultasi.name });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
