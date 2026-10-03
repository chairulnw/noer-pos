import "dotenv/config";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/db";
import { todayJakarta } from "../src/lib/date";
import { addAdmissionLog, checkOutAdmission, createAdmission } from "../src/lib/admissions";
import { billedDays, dateToJakartaLocal } from "../src/lib/admission-calc";
import { getStockAlerts, receiveStock } from "../src/lib/inventory";
import * as Opname from "../src/lib/opname";
import { addInvoiceItem, payInvoice, receiveDeposit, voidInvoice } from "../src/lib/invoice-ops";
import { closeCash } from "../src/lib/cash";
import { getSettings, saveSettings } from "../src/lib/settings";
import { resolveRange, sumRows } from "../src/lib/report";
import { getSalesByDay } from "../src/lib/reports";
import { saveOwner, savePatient } from "../src/lib/patients";
import * as R from "../src/lib/records";
import { createVisit } from "../src/lib/visits";

const noVitals = { temp: null, hr: null, rr: null, weight: null, bcs: null, crt: null };
const stock = async (itemId: string) =>
  Number((await prisma.stockBatch.aggregate({ where: { itemId }, _sum: { qtyOnHand: true } }))._sum.qtyOnHand ?? 0);
const ok = (label: string) => console.log(`  ok  ${label}`);

async function wipe() {
  await prisma.cashClosing.deleteMany();
  await prisma.stockMovement.deleteMany(); await prisma.payment.deleteMany(); await prisma.opnameItem.deleteMany(); await prisma.stockOpname.deleteMany(); await prisma.invoiceItem.deleteMany(); await prisma.invoice.deleteMany();
  await prisma.admissionLog.deleteMany(); await prisma.admission.deleteMany(); await prisma.room.deleteMany({ where: { name: "K-E2E" } });
  await prisma.stockBatch.deleteMany(); await prisma.prescriptionItem.deleteMany(); await prisma.recordAddendum.deleteMany(); await prisma.attachment.deleteMany();
  await prisma.vaccination.deleteMany(); await prisma.medicalRecord.deleteMany(); await prisma.visit.deleteMany(); await prisma.diagnosisMaster.deleteMany();
  await prisma.patient.deleteMany({ where: { name: "E2E Mochi" } }); await prisma.owner.deleteMany({ where: { name: "E2E Rina" } });
  await prisma.item.deleteMany({ where: { sku: { in: ["E2E-VAKSIN", "E2E-RI"] } } }); await prisma.auditLog.deleteMany(); await prisma.settings.deleteMany();
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

  const todayRange = resolveRange({ preset: "hari-ini" }, todayJakarta());
  if ("error" in todayRange) throw new Error(todayRange.error);
  assert.deepEqual(sumRows(await getSalesByDay(todayRange)), { invoices: 1, sales: 360_000, cost: 30 * 1_200 + 150_000 });
  ok("laporan: penjualan tanpa PPN Rp 360.000, HPP dari snapshot");

  assert.ok("id" in (await closeCash(kasir.id, { openingCash: 100_000, countedCash: 499_600, note: "" })));
  const closing = await prisma.cashClosing.findFirstOrThrow();
  assert.deepEqual([closing.cashSales, closing.difference], [399_600, 0]);
  ok("tutup kas: modal 100.000 + tunai 399.600 = fisik 499.600, selisih 0");

  assert.ok("error" in (await payInvoice(kasir.id, invoice.id, { method: "TUNAI", cashReceived: 9_999_999, reference: "" })));
  const due = await R.listDueVaccinations(400);
  assert.equal(due.length, 1);
  ok("tidak bisa dibayar dua kali; vaksin muncul di daftar jatuh tempo");

  const amoxLine = invoice.items.find((i) => i.itemId === amox.id)!;
  assert.ok("ok" in (await voidInvoice(admin.id, invoice.id, { reason: "Uji void", restockLineIds: [amoxLine.id] })));
  assert.equal(await stock(amox.id), 100);
  assert.equal(await stock(vaccine.id), 4, "item yang tidak dicentang tetap terpotong");
  assert.equal((await prisma.payment.findFirstOrThrow({ where: { invoiceId: invoice.id } })).voided, true);
  assert.equal(sumRows(await getSalesByDay(todayRange)).invoices, 0);
  ok("void: amoxicillin kembali 100, vaksin tetap 4, pembayaran ditandai void");

  console.log("Rawat inap, DP, dan opname");
  const room = await prisma.room.create({ data: { name: "K-E2E", type: "RAWAT_INAP" } });
  const rate = await prisma.item.create({ data: { type: "SERVICE", category: "rawat inap", sku: "E2E-RI", name: "E2E Rawat Inap", sellPrice: 150_000, buyPrice: 0, baseUnit: "hari", billingUnit: "PER_DAY" } });
  const checkIn = new Date(Date.now() - (3 * 24 + 2) * 3_600_000);
  const stay = { patientId: patient.id, type: "RAWAT_INAP" as const, roomId: room.id, rateItemId: rate.id, visitId: "", notes: "" };

  const adm = await createAdmission(kasir.id, { ...stay, checkIn: dateToJakartaLocal(checkIn) });
  if (!("id" in adm)) throw new Error(adm.error);
  assert.ok("error" in (await createAdmission(kasir.id, { ...stay, checkIn: dateToJakartaLocal(new Date()) })), "pasien tidak boleh check-in ganda");
  ok("check-in rawat inap; check-in ganda ditolak");

  const stayInvoice = await prisma.invoice.findFirstOrThrow({ where: { admissionId: adm.id } });
  assert.deepEqual(await receiveDeposit(kasir.id, stayInvoice.id, 200_000, "TUNAI", 200_000, ""), { ok: true, change: 0 });
  assert.deepEqual(await addAdmissionLog(dokter.id, adm.id, { loggedAt: dateToJakartaLocal(new Date()), temp: 38.5, intake: "Makan setengah porsi", note: "" }), {});
  ok("DP Rp 200.000 diterima pada invoice DRAFT; monitoring harian tersimpan");

  const out = await checkOutAdmission(kasir.id, adm.id, dateToJakartaLocal(new Date()));
  assert.ok("days" in out);
  const days = billedDays(checkIn, new Date());
  assert.equal(out.days, days);
  assert.ok(days >= 3);
  assert.deepEqual(await addInvoiceItem(stayInvoice.id, amox.id, 10), {});
  const billed = await prisma.invoice.findUniqueOrThrow({ where: { id: stayInvoice.id } });
  assert.equal(billed.subtotal, days * 150_000 + 10 * 2_000);
  assert.equal(billed.grandTotal, billed.subtotal + Math.round(billed.subtotal * 0.11));
  ok(`check-out: ${days} hari x Rp 150.000 + obat 10 tablet, total Rp ${billed.grandTotal.toLocaleString("id-ID")}`);

  assert.ok("ok" in (await payInvoice(kasir.id, stayInvoice.id, { method: "QRIS", cashReceived: null, reference: "" })));
  const settled = await prisma.invoice.findUniqueOrThrow({ where: { id: stayInvoice.id }, include: { payments: { orderBy: { paidAt: "asc" } }, admission: true } });
  assert.deepEqual(settled.payments.map((x) => x.kind), ["DP", "PELUNASAN"]);
  assert.equal(settled.payments[1].amount, settled.grandTotal - 200_000);
  assert.equal(settled.status, "FINAL");
  assert.equal(settled.admission!.status, "SELESAI");
  assert.equal(await stock(amox.id), 90);
  ok("pelunasan = total - DP, invoice FINAL, rawat inap SELESAI, stok obat 100->90");

  const alerts = await getStockAlerts();
  assert.ok(Array.isArray(alerts.low) && Array.isArray(alerts.expiring));

  const session = await Opname.createOpname(admin.id, "e2e");
  if (!("id" in session) || !session.id) throw new Error("opname gagal dibuat");
  const opname = (await Opname.getOpname(session.id))!;
  const rows = opname.items.map((i) => ({ id: i.id, counted: Math.max(0, Number(i.systemQty) - 2), reason: "" }));
  const before = await stock(amox.id);
  assert.ok("error" in (await Opname.finalizeOpname(admin.id, session.id, rows)), "selisih tanpa alasan harus ditolak");
  const withReason = rows.map((r) => ({ ...r, reason: "Rusak" }));
  assert.ok(!("error" in (await Opname.finalizeOpname(admin.id, session.id, withReason))));
  assert.ok((await stock(amox.id)) < before);
  ok("opname: selisih wajib beralasan, stok disesuaikan lewat ADJUST");

  const audit = (await prisma.auditLog.findMany({ select: { action: true } })).map((a) => a.action);
  for (const action of ["stock.in", "medical_record.finalize", "medical_record.addendum", "invoice.finalize", "payment.create", "invoice.void", "payment.deposit", "admission.check_in", "admission.check_out", "stock.opname"]) {
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
