CREATE TYPE "SurgeryStatus" AS ENUM ('DIJADWALKAN', 'BERJALAN', 'SELESAI', 'BATAL');

CREATE TABLE "surgery" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "service_item_id" UUID,
    "procedure" TEXT NOT NULL,
    "anesthesia" TEXT,
    "surgery_date" DATE NOT NULL,
    "status" "SurgeryStatus" NOT NULL DEFAULT 'DIJADWALKAN',
    "pre_notes" TEXT,
    "post_notes" TEXT,
    "finished_at" TIMESTAMP(3),
    "invoice_id" UUID,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "surgery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "surgery_invoice_id_key" ON "surgery"("invoice_id");
CREATE INDEX "surgery_surgery_date_idx" ON "surgery"("surgery_date");

ALTER TABLE "surgery" ADD CONSTRAINT "surgery_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "surgery" ADD CONSTRAINT "surgery_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "surgery" ADD CONSTRAINT "surgery_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "surgery" ADD CONSTRAINT "surgery_service_item_id_fkey" FOREIGN KEY ("service_item_id") REFERENCES "item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "surgery" ADD CONSTRAINT "surgery_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "surgery_addendum" (
    "id" UUID NOT NULL,
    "surgery_id" UUID NOT NULL,
    "note" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "surgery_addendum_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "surgery_addendum" ADD CONSTRAINT "surgery_addendum_surgery_id_fkey" FOREIGN KEY ("surgery_id") REFERENCES "surgery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "surgery_addendum" ADD CONSTRAINT "surgery_addendum_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
