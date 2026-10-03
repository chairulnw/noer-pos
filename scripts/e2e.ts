import "dotenv/config";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/db";
import { todayJakarta } from "../src/lib/date";
import { receiveStock } from "../src/lib/inventory";
import { payInvoice, voidInvoice } from "../src/lib/invoice-ops";
import { getSettings, saveSettings } from "../src/lib/settings";
import { saveOwner, savePatient } from "../src/lib/patients";
import * as R from "../src/lib/records";
import { createVisit } from "../src/lib/visits";

const noVitals = { temp: null, hr: null, rr: null, weight: null, bcs: null, crt: null };
const stock = async (itemId: string) =>
  Number((await prisma.stockBatch.aggregate({ where: { itemId }, _sum: { qtyOnHand: true } }))._sum.qtyOnHand ?? 0);
const ok = (label: string) => console.log(`  ok  ${label}`);

async function wipe() {
  await prisma.stockMovement.deleteMany(); await prisma.payment.deleteMany(); await prisma.invoiceItem.deleteMany(); await prisma.invoice.deleteMany();
  await prisma.stockBatch.deleteMany(); await prisma.prescriptionItem.deleteMany(); await prisma.recordAddendum.deleteMany(); await prisma.attachment.deleteMany();
  await prisma.vaccination.deleteMany(); await prisma.medicalRecord.deleteMany(); await prisma.visit.deleteMany(); await prisma.diagnosisMaster.deleteMany();
  await prisma.patient.deleteMany({ where: { name: "E2E Mochi" } }); await prisma.owner.deleteMany({ where: { name: "E2E Rina" } });
  await prisma.item.deleteMany({ where: { sku: "E2E-VAKSIN" } }); await prisma.auditLog.deleteMany(); await prisma.settings.deleteMany();
}

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Jangan jalankan di produksi: skrip ini menghapus data transaksi.");
  await wipe();
  const [admin, kasir, dokter] = await Promise.all(["admin", "kasir", "dokter"].map((u) => prisma.user.findUniqueOrThrow({ where: { username: u } })));
  const konsul = await prisma.item.findFirstOrThrow({ where: { sku: "JASA-KONSUL" } });
  const amox = await prisma.item.findFirstOrThrow({ where: { sku: "OBT-AMOX-100" } });
  await saveSettings(admin.id, { ...(await getSettings()), taxEnabled: true, taxRate: 11, taxMode: "EXCLUDE" });
  console.log("Alur utama klinik");

  const vaccine = await prisma.item.create({ data: { type: "PRODUCT", category: "vaksin", sku: "E2E-VAKSIN", name: "E2E Vaksin", sellPrice: 250000, buyPrice: 150000, baseUnit: "vial", vaccineIntervalDays: 365 } });
  await receiveStock(admin.id, { itemId: amox.id, qty: 1, batchNo: "E2E-A", expiry: "2027-12-01", price: 120000, note: "" });
  await receiveStock(admin.id, { itemId: vaccine.id, qty: 5, batchNo: "E2E-V", expiry: "2027-06-01", price: 150000, note: "" });
  ok("stok masuk: 100 tablet amoxicillin, 5 vial vaksin");

  const owner = await saveOwner(null, { name: "E2E Rina", whatsapp: "6281200000001", address: "Jl. E2E", notes: "" }, false);
  assert.ok(owner.id);
  const patient = await savePatient(owner.id, null, { name: "E2E Mochi", species: "Kucing", breed: "", sex: "BETINA", birthDate: "", ageYears: 2, ageMonths: 0, microchip: "", color: "", neutered: false, lastWeightKg: null, allergyNote: "", aggressive: false, behaviorNote: "" });
  assert.ok(patient.id);
  ok("owner dan pasien terdaftar");

  assert.deepEqual(await createVisit(kasir.id, patient.id, { doctorId: dokter.id, complaint: "Muntah 2 hari" }), {});
  const visit = await prisma.visit.findFirstOrThrow({ where: { patientId: patient.id } });
  assert.equal(visit.status, "DILAYANI");
  ok("kunjungan walk-in dibuat, status DILAYANI");

  assert.ok(await R.ensureRecord(visit.id));
  const record = (await R.getRecordView(visit.id))!.record!;
  const items = [{ itemId: konsul.id, qty: 1, instruction: "" }, { itemId: amox.id, qty: 30, instruction: "2x sehari 1 tab" }, { itemId: vaccine.id, qty: 1, instruction: "" }];
  const input = { subjective: "Muntah", objective: "", assessment: "Gastritis", plan: "Obat 5 hari", diagnosis: "Gastritis", vitals: { ...noVitals, weight: 4.2, temp: 39.1 } };
  assert.deepEqual(await R.saveRecord(record.id, input, items), {});
  assert.deepEqual(await R.addVaccination(record.id, { itemId: vaccine.id, batchNo: "E2E-V", givenAt: todayJakarta().toISOString().slice(0, 10), nextDue: "" }), {});
  ok("SOAP, vital, tindakan, resep, vaksinasi tersimpan");

  assert.ok("visitId" in (await R.finalizeRecord(dokter.id, record.id, input, items)));
  assert.equal((await prisma.visit.findUniqueOrThrow({ where: { id: visit.id } })).status, "MENUNGGU_BAYAR");
  assert.ok((await R.saveRecord(record.id, { ...input, subjective: "diubah" }, items)).error, "rekam medis final harus terkunci");
  assert.deepEqual(await R.addAddendum(dokter.id, record.id, "Koreksi berat badan"), {});
  assert.equal(Number((await prisma.patient.findUniqueOrThrow({ where: { id: patient.id } })).lastWeightKg), 4.2);
  ok("rekam medis final terkunci, addendum jalan, berat pasien diperbarui, kunjungan MENUNGGU_BAYAR");

  const invoice = await prisma.invoice.findFirstOrThrow({ where: { visitId: visit.id }, include: { items: true } });
  assert.equal(invoice.status, "DRAFT");
  assert.equal(invoice.items.length, 3);
  assert.equal(invoice.subtotal, 50_000 + 30 * 2_000 + 250_000);
  assert.equal(invoice.taxTotal, Math.round(invoice.subtotal * 0.11));
  assert.equal(invoice.grandTotal, invoice.subtotal + invoice.taxTotal);
  assert.equal(await stock(amox.id), 100, "stok belum berkurang saat draft");
  ok(`draft ${invoice.invoiceNo}: total Rp ${invoice.grandTotal.toLocaleString("id-ID")} (stok belum berkurang)`);

  assert.ok("ok" in (await payInvoice(kasir.id, invoice.id, { method: "TUNAI", cashReceived: 1_000_000, reference: "" })));
  const paid = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id }, include: { payments: true } });
  assert.equal(paid.status, "FINAL");
  assert.equal(paid.payments[0].amount, paid.grandTotal);
  assert.equal(await stock(amox.id), 70);
  assert.equal(await stock(vaccine.id), 4);
  assert.equal((await prisma.visit.findUniqueOrThrow({ where: { id: visit.id } })).status, "SELESAI");
  ok("dibayar tunai: invoice FINAL, stok 100->70 dan 5->4, kunjungan SELESAI");

  assert.ok("error" in (await payInvoice(kasir.id, invoice.id, { method: "TUNAI", cashReceived: 9_999_999, reference: "" })));
  const due = await R.listDueVaccinations(400);
  assert.equal(due.length, 1);
  ok("tidak bisa dibayar dua kali; vaksin muncul di daftar jatuh tempo");

  const amoxLine = invoice.items.find((i) => i.itemId === amox.id)!;
  assert.ok("ok" in (await voidInvoice(admin.id, invoice.id, { reason: "Uji void", restockLineIds: [amoxLine.id] })));
  assert.equal(await stock(amox.id), 100);
  assert.equal(await stock(vaccine.id), 4, "item yang tidak dicentang tetap terpotong");
  assert.equal((await prisma.payment.findFirstOrThrow({ where: { invoiceId: invoice.id } })).voided, true);
  ok("void: amoxicillin kembali 100, vaksin tetap 4, pembayaran ditandai void");

  const audit = (await prisma.auditLog.findMany({ select: { action: true } })).map((a) => a.action);
  for (const action of ["stock.in", "medical_record.finalize", "medical_record.addendum", "invoice.finalize", "payment.create", "invoice.void"]) {
    assert.ok(audit.includes(action), `audit ${action} harus ada`);
  }
  ok("audit log lengkap");
  console.log("Semua langkah lulus.");
}

main()
  .catch((error) => {
    console.error("GAGAL:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await wipe();
    await prisma.$disconnect();
  });
