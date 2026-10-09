-- Role Dokter dan Kasir digabung menjadi Karyawan. Dokter lama tetap bisa dipilih sebagai dokter lewat is_doctor.
ALTER TABLE "user" ADD COLUMN "is_doctor" BOOLEAN NOT NULL DEFAULT false;

UPDATE "user" SET "is_doctor" = true WHERE "role" = 'DOKTER';
UPDATE "user" SET "role" = 'KARYAWAN' WHERE "role" IN ('DOKTER', 'KASIR');

-- AlterEnum
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'KARYAWAN');
ALTER TABLE "user" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
