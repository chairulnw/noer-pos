-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'DOKTER', 'KASIR');

-- CreateEnum
CREATE TYPE "PatientSex" AS ENUM ('JANTAN', 'BETINA');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('DILAYANI', 'MENUNGGU_BAYAR', 'SELESAI', 'BATAL');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('SERVICE', 'PRODUCT');

-- CreateEnum
CREATE TYPE "BillingUnit" AS ENUM ('PER_ITEM', 'PER_DAY');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('IN', 'OUT', 'VOID_RETURN', 'ADJUST');

-- CreateEnum
CREATE TYPE "OpnameStatus" AS ENUM ('DRAFT', 'FINAL');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('RAWAT_INAP', 'HOTEL');

-- CreateEnum
CREATE TYPE "AdmissionType" AS ENUM ('RAWAT_INAP', 'HOTEL');

-- CreateEnum
CREATE TYPE "AdmissionStatus" AS ENUM ('AKTIF', 'SELESAI');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'FINAL', 'VOID');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'AMOUNT');

-- CreateEnum
CREATE TYPE "PaymentKind" AS ENUM ('DP', 'PELUNASAN', 'LUNAS');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('TUNAI', 'QRIS', 'TRANSFER', 'KARTU');

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owner" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "rm_no" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "breed" TEXT,
    "sex" "PatientSex" NOT NULL,
    "birth_date" DATE,
    "color" TEXT,
    "microchip" TEXT,
    "neutered" BOOLEAN NOT NULL DEFAULT false,
    "last_weight_kg" DECIMAL(6,2),
    "allergy_note" TEXT,
    "aggressive" BOOLEAN NOT NULL DEFAULT false,
    "photo_path" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visit" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "visit_date" DATE NOT NULL,
    "complaint" TEXT NOT NULL,
    "status" "VisitStatus" NOT NULL DEFAULT 'DILAYANI',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_record" (
    "id" UUID NOT NULL,
    "visit_id" UUID NOT NULL,
    "subjective" TEXT,
    "objective" TEXT,
    "assessment" TEXT,
    "plan" TEXT,
    "diagnosis" TEXT,
    "vitals" JSONB,
    "finalized" BOOLEAN NOT NULL DEFAULT false,
    "finalized_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "record_addendum" (
    "id" UUID NOT NULL,
    "record_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "note" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "record_addendum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescription_item" (
    "id" UUID NOT NULL,
    "record_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "qty" DECIMAL(12,3) NOT NULL,
    "instruction" TEXT,

    CONSTRAINT "prescription_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vaccination" (
    "id" UUID NOT NULL,
    "record_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "batch_no" TEXT,
    "given_at" DATE NOT NULL,
    "next_due" DATE,

    CONSTRAINT "vaccination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachment" (
    "id" UUID NOT NULL,
    "record_id" UUID NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item" (
    "id" UUID NOT NULL,
    "type" "ItemType" NOT NULL,
    "category" TEXT NOT NULL,
    "sku" TEXT,
    "barcode" TEXT,
    "name" TEXT NOT NULL,
    "sell_price" INTEGER NOT NULL,
    "buy_price" INTEGER NOT NULL,
    "base_unit" TEXT NOT NULL,
    "purchase_unit" TEXT,
    "conversion_factor" DECIMAL(12,3) NOT NULL DEFAULT 1,
    "low_stock_threshold" DECIMAL(12,3),
    "track_expiry" BOOLEAN NOT NULL DEFAULT false,
    "billing_unit" "BillingUnit" NOT NULL DEFAULT 'PER_ITEM',
    "vaccine_interval_days" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_batch" (
    "id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "batch_no" TEXT NOT NULL,
    "expiry_date" DATE,
    "qty_on_hand" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "cost_per_base_unit" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movement" (
    "id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "qty" DECIMAL(12,3) NOT NULL,
    "ref_type" TEXT,
    "ref_id" UUID,
    "invoice_item_id" UUID,
    "note" TEXT,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_opname" (
    "id" UUID NOT NULL,
    "opname_date" DATE NOT NULL,
    "status" "OpnameStatus" NOT NULL DEFAULT 'DRAFT',
    "user_id" UUID NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_opname_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opname_item" (
    "id" UUID NOT NULL,
    "opname_id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "system_qty" DECIMAL(12,3) NOT NULL,
    "counted_qty" DECIMAL(12,3) NOT NULL,
    "diff" DECIMAL(12,3) NOT NULL,
    "reason" TEXT,

    CONSTRAINT "opname_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "RoomType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "visit_id" UUID,
    "rate_item_id" UUID NOT NULL,
    "type" "AdmissionType" NOT NULL,
    "check_in" TIMESTAMP(3) NOT NULL,
    "check_out" TIMESTAMP(3),
    "billed_days" INTEGER,
    "status" "AdmissionStatus" NOT NULL DEFAULT 'AKTIF',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_log" (
    "id" UUID NOT NULL,
    "admission_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "logged_at" TIMESTAMP(3) NOT NULL,
    "temp_c" DECIMAL(4,1),
    "intake" TEXT,
    "note" TEXT,

    CONSTRAINT "admission_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice" (
    "id" UUID NOT NULL,
    "invoice_no" TEXT NOT NULL,
    "visit_id" UUID,
    "admission_id" UUID,
    "owner_id" UUID,
    "customer_name" TEXT,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "discount_total" INTEGER NOT NULL DEFAULT 0,
    "tax_total" INTEGER NOT NULL DEFAULT 0,
    "grand_total" INTEGER NOT NULL DEFAULT 0,
    "created_by" UUID NOT NULL,
    "finalized_at" TIMESTAMP(3),
    "void_reason" TEXT,
    "voided_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_item" (
    "id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "name_snapshot" TEXT NOT NULL,
    "qty" DECIMAL(12,3) NOT NULL,
    "unit_price_snapshot" INTEGER NOT NULL,
    "unit_cost_snapshot" INTEGER NOT NULL,
    "discount_type" "DiscountType",
    "discount_value" INTEGER NOT NULL DEFAULT 0,
    "line_total" INTEGER NOT NULL,

    CONSTRAINT "invoice_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "kind" "PaymentKind" NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" INTEGER NOT NULL,
    "cash_received" INTEGER,
    "reference" TEXT,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    "received_by" UUID NOT NULL,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "diagnosis_master" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnosis_master_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "owner_whatsapp_idx" ON "owner"("whatsapp");

-- CreateIndex
CREATE UNIQUE INDEX "patient_rm_no_key" ON "patient"("rm_no");

-- CreateIndex
CREATE INDEX "patient_microchip_idx" ON "patient"("microchip");

-- CreateIndex
CREATE INDEX "visit_visit_date_status_idx" ON "visit"("visit_date", "status");

-- CreateIndex
CREATE UNIQUE INDEX "medical_record_visit_id_key" ON "medical_record"("visit_id");

-- CreateIndex
CREATE UNIQUE INDEX "item_sku_key" ON "item"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "item_barcode_key" ON "item"("barcode");

-- CreateIndex
CREATE INDEX "stock_batch_item_id_expiry_date_idx" ON "stock_batch"("item_id", "expiry_date");

-- CreateIndex
CREATE INDEX "admission_room_id_status_idx" ON "admission"("room_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_invoice_no_key" ON "invoice"("invoice_no");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_visit_id_key" ON "invoice"("visit_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_admission_id_key" ON "invoice"("admission_id");

-- CreateIndex
CREATE UNIQUE INDEX "diagnosis_master_name_key" ON "diagnosis_master"("name");

-- AddForeignKey
ALTER TABLE "patient" ADD CONSTRAINT "patient_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit" ADD CONSTRAINT "visit_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit" ADD CONSTRAINT "visit_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit" ADD CONSTRAINT "visit_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_record" ADD CONSTRAINT "medical_record_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record_addendum" ADD CONSTRAINT "record_addendum_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "medical_record"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record_addendum" ADD CONSTRAINT "record_addendum_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_item" ADD CONSTRAINT "prescription_item_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "medical_record"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_item" ADD CONSTRAINT "prescription_item_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccination" ADD CONSTRAINT "vaccination_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "medical_record"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccination" ADD CONSTRAINT "vaccination_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "medical_record"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_batch" ADD CONSTRAINT "stock_batch_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "stock_batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_invoice_item_id_fkey" FOREIGN KEY ("invoice_item_id") REFERENCES "invoice_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_opname" ADD CONSTRAINT "stock_opname_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opname_item" ADD CONSTRAINT "opname_item_opname_id_fkey" FOREIGN KEY ("opname_id") REFERENCES "stock_opname"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opname_item" ADD CONSTRAINT "opname_item_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "stock_batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission" ADD CONSTRAINT "admission_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission" ADD CONSTRAINT "admission_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission" ADD CONSTRAINT "admission_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission" ADD CONSTRAINT "admission_rate_item_id_fkey" FOREIGN KEY ("rate_item_id") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_log" ADD CONSTRAINT "admission_log_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "admission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_log" ADD CONSTRAINT "admission_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "admission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_voided_by_fkey" FOREIGN KEY ("voided_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_item" ADD CONSTRAINT "invoice_item_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_item" ADD CONSTRAINT "invoice_item_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Manual (tidak direpresentasikan di schema.prisma):
-- BR-17: satu kandang hanya untuk satu admission AKTIF sekaligus.
CREATE UNIQUE INDEX "admission_room_id_active_key" ON "admission" ("room_id") WHERE "status" = 'AKTIF';

-- Manual (tidak direpresentasikan di schema.prisma):
-- Stok tidak boleh negatif (lihat docs/SPEC.md bagian 8, catatan skema).
ALTER TABLE "stock_batch" ADD CONSTRAINT "stock_batch_qty_on_hand_check" CHECK ("qty_on_hand" >= 0);
