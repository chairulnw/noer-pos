ALTER TABLE "invoice" ADD COLUMN "discount_type" "DiscountType";
ALTER TABLE "invoice" ADD COLUMN "discount_value" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "invoice" ADD COLUMN "tax_rate" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "invoice" ADD COLUMN "tax_included" BOOLEAN NOT NULL DEFAULT false;
