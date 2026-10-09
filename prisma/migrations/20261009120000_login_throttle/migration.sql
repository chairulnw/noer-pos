-- CreateTable
CREATE TABLE "login_throttle" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "reset_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "login_throttle_pkey" PRIMARY KEY ("key")
);
