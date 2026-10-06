CREATE TYPE "GroomingStatus" AS ENUM ('MENUNGGU', 'PROSES', 'SELESAI', 'BATAL');

CREATE TABLE "grooming" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "service_item_id" UUID,
    "grooming_date" DATE NOT NULL,
    "status" "GroomingStatus" NOT NULL DEFAULT 'MENUNGGU',
    "notes" TEXT,
    "finished_at" TIMESTAMP(3),
    "invoice_id" UUID,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grooming_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "grooming_invoice_id_key" ON "grooming"("invoice_id");
CREATE INDEX "grooming_grooming_date_idx" ON "grooming"("grooming_date");

ALTER TABLE "grooming" ADD CONSTRAINT "grooming_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grooming" ADD CONSTRAINT "grooming_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grooming" ADD CONSTRAINT "grooming_service_item_id_fkey" FOREIGN KEY ("service_item_id") REFERENCES "item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "grooming" ADD CONSTRAINT "grooming_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
