ALTER TYPE "PaymentMethod" ADD VALUE 'WALLET';

CREATE TYPE "WalletTxType" AS ENUM ('TOPUP', 'PAYMENT', 'RETURN', 'ADJUST');

ALTER TABLE "owner" ADD COLUMN "wallet_balance" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "owner" ADD CONSTRAINT "owner_wallet_balance_nonneg" CHECK ("wallet_balance" >= 0);

CREATE TABLE "wallet_transaction" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "type" "WalletTxType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "method" "PaymentMethod",
    "invoice_id" UUID,
    "payment_id" UUID,
    "note" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transaction_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "wallet_transaction_amount_nonzero" CHECK ("amount" <> 0),
    CONSTRAINT "wallet_transaction_balance_nonneg" CHECK ("balance_after" >= 0)
);

CREATE INDEX "wallet_transaction_owner_id_created_at_idx" ON "wallet_transaction"("owner_id", "created_at");
CREATE INDEX "wallet_transaction_created_at_idx" ON "wallet_transaction"("created_at");

ALTER TABLE "wallet_transaction" ADD CONSTRAINT "wallet_transaction_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wallet_transaction" ADD CONSTRAINT "wallet_transaction_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "wallet_transaction" ADD CONSTRAINT "wallet_transaction_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
