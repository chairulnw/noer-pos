ALTER TABLE "room" ADD COLUMN "capacity" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "room" ADD CONSTRAINT "room_capacity_check" CHECK ("capacity" >= 1);
DROP INDEX "admission_room_id_active_key";
