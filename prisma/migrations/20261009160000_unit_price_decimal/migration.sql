-- Harga/modal per satuan dasar boleh berpecahan (mis. Rp 53,328/ml). Total baris tetap bilangan bulat rupiah.
ALTER TABLE "item" ALTER COLUMN "sell_price" SET DATA TYPE DECIMAL(14,3),
ALTER COLUMN "buy_price" SET DATA TYPE DECIMAL(14,3);

ALTER TABLE "stock_batch" ALTER COLUMN "cost_per_base_unit" SET DATA TYPE DECIMAL(14,3);

ALTER TABLE "invoice_item" ALTER COLUMN "unit_price_snapshot" SET DATA TYPE DECIMAL(14,3),
ALTER COLUMN "unit_cost_snapshot" SET DATA TYPE DECIMAL(14,3);
