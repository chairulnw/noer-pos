DROP INDEX "invoice_visit_id_key";
DROP INDEX "invoice_admission_id_key";

-- Manual (tidak direpresentasikan di schema.prisma): satu invoice aktif per kunjungan/admission.
-- Invoice VOID dikecualikan agar koreksi (void + invoice baru, BR-14) bisa dibuat.
CREATE UNIQUE INDEX "invoice_visit_id_active_key" ON "invoice" ("visit_id") WHERE "status" <> 'VOID';
CREATE UNIQUE INDEX "invoice_admission_id_active_key" ON "invoice" ("admission_id") WHERE "status" <> 'VOID';
