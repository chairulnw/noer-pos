-- Rename (bukan drop/add) agar baris user yang ada tetap utuh.
ALTER TABLE "user" RENAME COLUMN "email" TO "username";
ALTER INDEX "user_email_key" RENAME TO "user_username_key";

-- Data dev: ubah "admin@klinik.test" jadi "admin". Belum ada data produksi.
UPDATE "user" SET "username" = lower(split_part("username", '@', 1));

-- Manual (tidak direpresentasikan di schema.prisma): username selalu huruf kecil,
-- sehingga UNIQUE efektif tidak peka huruf besar-kecil.
ALTER TABLE "user" ADD CONSTRAINT "user_username_lowercase_check" CHECK ("username" = lower("username"));
