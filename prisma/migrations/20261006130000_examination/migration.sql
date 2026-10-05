CREATE TYPE "ExaminationType" AS ENUM ('LAB', 'RADIOLOGI');

CREATE TABLE "examination" (
    "id" UUID NOT NULL,
    "type" "ExaminationType" NOT NULL,
    "patient_id" UUID NOT NULL,
    "record_id" UUID,
    "name" TEXT NOT NULL,
    "performed_at" DATE NOT NULL,
    "findings" TEXT,
    "notes" TEXT,
    "created_by" UUID NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "examination_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "examination_type_performed_at_idx" ON "examination"("type", "performed_at");
CREATE INDEX "examination_patient_id_idx" ON "examination"("patient_id");

ALTER TABLE "examination" ADD CONSTRAINT "examination_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "examination" ADD CONSTRAINT "examination_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "medical_record"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "examination" ADD CONSTRAINT "examination_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "attachment" ALTER COLUMN "record_id" DROP NOT NULL;
ALTER TABLE "attachment" ADD COLUMN "examination_id" UUID;
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_examination_id_fkey" FOREIGN KEY ("examination_id") REFERENCES "examination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_owner_check" CHECK (("record_id" IS NOT NULL)::int + ("examination_id" IS NOT NULL)::int = 1);
