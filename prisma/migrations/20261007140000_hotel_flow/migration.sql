ALTER TABLE "room" ADD COLUMN "dimensions" TEXT, ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "admission" ADD COLUMN "expected_check_out" DATE, ADD COLUMN "feeding_instructions" TEXT;
