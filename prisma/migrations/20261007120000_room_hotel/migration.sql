ALTER TABLE "room" ADD COLUMN "needs_cleaning" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "default_rate_id" UUID,
ADD COLUMN "suitable_for" TEXT;

ALTER TABLE "room" ADD CONSTRAINT "room_default_rate_id_fkey" FOREIGN KEY ("default_rate_id") REFERENCES "item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
