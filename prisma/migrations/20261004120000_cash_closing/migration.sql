CREATE TABLE "cash_closing" (
    "id" UUID NOT NULL,
    "closing_date" DATE NOT NULL,
    "opening_cash" INTEGER NOT NULL,
    "cash_sales" INTEGER NOT NULL,
    "counted_cash" INTEGER NOT NULL,
    "difference" INTEGER NOT NULL,
    "note" TEXT,
    "closed_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_closing_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "cash_closing_amounts_nonneg" CHECK ("opening_cash" >= 0 AND "counted_cash" >= 0)
);

CREATE UNIQUE INDEX "cash_closing_closing_date_key" ON "cash_closing"("closing_date");

ALTER TABLE "cash_closing" ADD CONSTRAINT "cash_closing_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
