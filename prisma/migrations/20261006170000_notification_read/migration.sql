CREATE TABLE "notification_read" (
    "user_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_read_pkey" PRIMARY KEY ("user_id", "key")
);

ALTER TABLE "notification_read" ADD CONSTRAINT "notification_read_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
