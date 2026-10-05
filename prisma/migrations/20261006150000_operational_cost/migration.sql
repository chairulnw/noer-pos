CREATE TABLE "operational_cost" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "cost_date" DATE NOT NULL,
    "notes" TEXT,
    "created_by" UUID NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operational_cost_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "operational_cost_amount_positive" CHECK ("amount" > 0)
);

CREATE INDEX "operational_cost_cost_date_idx" ON "operational_cost"("cost_date");

ALTER TABLE "operational_cost" ADD CONSTRAINT "operational_cost_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
