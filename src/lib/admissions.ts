import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { todayJakarta } from "@/lib/date";
import { billedDays, jakartaLocalToDate } from "@/lib/admission-calc";
import { RATE_CATEGORY, type CheckInInput, type LogInput } from "@/lib/admission-schema";
import { nextInvoiceNoFor, recomputeInvoice, taxFromSettings } from "@/lib/invoices";

export async function createAdmission(userId: string, input: CheckInInput) {
  const checkIn = jakartaLocalToDate(input.checkIn);
  if (Number.isNaN(checkIn.getTime())) return { error: "Waktu masuk tidak valid." };
  if (checkIn.getTime() > Date.now() + 3_600_000) return { error: "Waktu masuk tidak boleh di masa depan." };

  const [patient, room, rate, visit, busy] = await Promise.all([
    prisma.patient.findFirst({ where: { id: input.patientId, deletedAt: null, owner: { deletedAt: null } }, select: { ownerId: true } }),
    prisma.room.findFirst({ where: { id: input.roomId, active: true, type: input.type }, select: { id: true, needsCleaning: true, name: true, capacity: true } }),
    prisma.item.findFirst({
      where: { id: input.rateItemId, type: "SERVICE", billingUnit: "PER_DAY", category: RATE_CATEGORY[input.type], active: true, deletedAt: null },
      select: { id: true },
    }),
    input.visitId
      ? prisma.visit.findFirst({ where: { id: input.visitId, patientId: input.patientId, status: { not: "BATAL" } }, select: { id: true } })
      : null,
    prisma.admission.findFirst({ where: { patientId: input.patientId, status: "AKTIF" }, select: { room: { select: { name: true } } } }),
  ]);
  if (!patient) return { error: "Pasien tidak ditemukan." };
  if (busy) return { error: `Pasien ini masih tercatat menginap di ${busy.room.name}.` };
  if (!room) return { error: "Kandang tidak ditemukan, nonaktif, atau tidak sesuai jenis." };
  if (room.needsCleaning) return { error: `${room.name} perlu dibersihkan. Tandai bersih di Pet Hotel sebelum check-in.` };
  if (!rate) return { error: "Tarif harian tidak valid untuk jenis ini." };
  if (input.visitId && !visit) return { error: "Kunjungan tidak valid." };

  for (let attempt = 1; ; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM room WHERE id = ${room.id}::uuid FOR UPDATE`;
        if ((await tx.admission.count({ where: { roomId: room.id, status: "AKTIF" } })) >= room.capacity) return { error: `${room.name} sudah penuh.` };
        const admission = await tx.admission.create({
          data: {
            patientId: input.patientId, roomId: room.id, rateItemId: rate.id, visitId: visit?.id ?? null,
            type: input.type, checkIn, notes: input.notes || null,
          },
          select: { id: true },
        });
        const invoice = await tx.invoice.create({
          data: { invoiceNo: await nextInvoiceNoFor(tx), admissionId: admission.id, ownerId: patient.ownerId, createdById: userId },
          select: { id: true },
        });
        await logAudit(tx, { userId, action: "admission.check_in", entity: "admission", entityId: admission.id, after: { roomId: room.id, type: input.type, invoiceId: invoice.id } });
        return { id: admission.id };
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
      if (attempt >= 3) throw error;
    }
  }
}

export const listActiveAdmissions = (type?: "RAWAT_INAP" | "HOTEL") =>
  prisma.admission.findMany({
    where: { status: "AKTIF", ...(type && { type }) },
    select: {
      id: true,
      type: true,
      checkIn: true,
      patient: { select: { id: true, name: true, species: true, allergyNote: true, aggressive: true } },
      room: { select: { name: true } },
      rateItem: { select: { name: true } },
      invoices: { where: { status: { not: "VOID" } }, select: { id: true, invoiceNo: true }, take: 1 },
    },
    orderBy: { checkIn: "asc" },
  });

export async function getCheckInOptions() {
  const [rooms, rates, occupied] = await Promise.all([
    prisma.room.findMany({ where: { active: true, needsCleaning: false }, select: { id: true, name: true, type: true, capacity: true, defaultRateId: true, suitableFor: true }, orderBy: [{ type: "asc" }, { name: "asc" }] }),
    prisma.item.findMany({
      where: { type: "SERVICE", billingUnit: "PER_DAY", active: true, deletedAt: null, category: { in: ["rawat inap", "hotel"] } },
      select: { id: true, name: true, category: true },
      orderBy: { name: "asc" },
    }),
    prisma.admission.groupBy({ by: ["roomId"], where: { status: "AKTIF" }, _count: true }),
  ]);
  const used = new Map(occupied.map((o) => [o.roomId, o._count]));
  return {
    rooms: rooms.filter((r) => (used.get(r.id) ?? 0) < r.capacity).map(({ capacity, ...r }) => ({ ...r, free: capacity - (used.get(r.id) ?? 0) })),
    rates: rates.map((r) => ({ id: r.id, name: r.name, type: (r.category === "hotel" ? "HOTEL" : "RAWAT_INAP") as "HOTEL" | "RAWAT_INAP" })),
  };
}

export const listTodayVisitsOf = (patientId: string) =>
  prisma.visit.findMany({
    where: { patientId, visitDate: todayJakarta(), status: { not: "BATAL" } },
    select: { id: true, complaint: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

export const listPatientAdmissions = (patientId: string) =>
  prisma.admission.findMany({
    where: { patientId },
    select: { id: true, type: true, status: true, checkIn: true, checkOut: true, billedDays: true, room: { select: { name: true } } },
    orderBy: { checkIn: "desc" },
    take: 20,
  });

export const getAdmission = (id: string) =>
  prisma.admission.findUnique({
    where: { id },
    select: {
      id: true,
      type: true,
      status: true,
      checkIn: true,
      checkOut: true,
      notes: true,
      patient: { select: { id: true, name: true, rmNo: true, species: true, allergyNote: true, aggressive: true, behaviorNote: true } },
      room: { select: { name: true } },
      rateItem: { select: { name: true } },
      invoices: { where: { status: { not: "VOID" } }, select: { id: true, invoiceNo: true }, take: 1 },
    },
  });

export const listAdmissionLogs = (admissionId: string, take = 100) =>
  prisma.admissionLog.findMany({
    where: { admissionId },
    select: { id: true, loggedAt: true, tempC: true, intake: true, note: true, user: { select: { name: true } } },
    orderBy: { loggedAt: "desc" },
    take,
  });

export async function addAdmissionLog(userId: string, admissionId: string, input: LogInput) {
  const loggedAt = jakartaLocalToDate(input.loggedAt);
  const admission = await prisma.admission.findUnique({ where: { id: admissionId }, select: { type: true, status: true, checkIn: true } });
  if (!admission) return { error: "Admission tidak ditemukan." };
  if (admission.type !== "RAWAT_INAP") return { error: "Monitoring harian hanya untuk rawat inap." };
  if (admission.status !== "AKTIF") return { error: "Pasien sudah check-out. Monitoring tidak bisa ditambah." };
  if (Number.isNaN(loggedAt.getTime()) || loggedAt.getTime() > Date.now() + 3_600_000) return { error: "Waktu tidak boleh di masa depan." };
  if (loggedAt < admission.checkIn) return { error: "Waktu monitoring tidak boleh sebelum waktu check-in." };

  await prisma.admissionLog.create({
    data: { admissionId, userId, loggedAt, tempC: input.temp, intake: input.intake || null, note: input.note || null },
  });
  return {};
}

export async function latestRawatInapLogs(patientId: string) {
  const admission = await prisma.admission.findFirst({
    where: { patientId, type: "RAWAT_INAP" },
    orderBy: { checkIn: "desc" },
    select: { id: true, status: true, room: { select: { name: true } } },
  });
  if (!admission) return null;
  return { admission, logs: await listAdmissionLogs(admission.id, 5) };
}

export async function checkOutAdmission(userId: string, admissionId: string, checkOutLocal: string) {
  const checkOut = jakartaLocalToDate(checkOutLocal);
  if (Number.isNaN(checkOut.getTime()) || checkOut.getTime() > Date.now() + 3_600_000) return { error: "Waktu keluar tidak boleh di masa depan." };

  const tax = await taxFromSettings();
  return prisma.$transaction(async (tx) => {
    const admission = await tx.admission.findUnique({
      where: { id: admissionId },
      select: {
        status: true, checkIn: true, roomId: true, type: true, patient: { select: { ownerId: true } },
        rateItem: { select: { id: true, name: true, sellPrice: true, buyPrice: true } },
      },
    });
    if (!admission) return { error: "Admission tidak ditemukan." };
    if (admission.status !== "AKTIF") return { error: "Pasien ini sudah check-out." };
    if (checkOut < admission.checkIn) return { error: "Waktu keluar tidak boleh sebelum waktu masuk." };

    const days = billedDays(admission.checkIn, checkOut);
    const { count } = await tx.admission.updateMany({
      where: { id: admissionId, status: "AKTIF" },
      data: { status: "SELESAI", checkOut, billedDays: days },
    });
    if (count === 0) return { error: "Pasien ini sudah check-out." };

    if (admission.type === "HOTEL" && (await tx.admission.count({ where: { roomId: admission.roomId, status: "AKTIF" } })) === 0) await tx.room.update({ where: { id: admission.roomId }, data: { needsCleaning: true } });

    let invoice = await tx.invoice.findFirst({ where: { admissionId, status: { not: "VOID" } }, select: { id: true, status: true } });
    if (invoice && invoice.status !== "DRAFT") throw new CheckOutBlocked("Invoice rawat inap sudah final. Batalkan invoice tersebut terlebih dahulu, lalu ulangi check-out.");
    invoice ??= await tx.invoice.create({
      data: { invoiceNo: await nextInvoiceNoFor(tx), admissionId, ownerId: admission.patient.ownerId, createdById: userId },
      select: { id: true, status: true },
    });

    const last = await tx.invoiceItem.aggregate({ where: { invoiceId: invoice.id }, _max: { position: true } });
    const { rateItem } = admission;
    await tx.invoiceItem.create({
      data: {
        invoiceId: invoice.id, itemId: rateItem.id, nameSnapshot: rateItem.name, qty: days,
        unitPriceSnapshot: rateItem.sellPrice, unitCostSnapshot: rateItem.buyPrice, position: (last._max.position ?? -1) + 1, lineTotal: 0,
      },
    });
    await recomputeInvoice(tx, invoice.id, tax);
    await logAudit(tx, { userId, action: "admission.check_out", entity: "admission", entityId: admissionId, after: { billedDays: days, invoiceId: invoice.id, rate: rateItem.name } });
    return { invoiceId: invoice.id, days };
  }).catch((error) => {
    if (error instanceof CheckOutBlocked) return { error: error.message };
    throw error;
  });
}

class CheckOutBlocked extends Error {}
