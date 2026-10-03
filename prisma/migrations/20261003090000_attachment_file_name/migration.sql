ALTER TABLE "attachment" ADD COLUMN "file_name" TEXT NOT NULL DEFAULT '';
ALTER TABLE "attachment" ALTER COLUMN "file_name" DROP DEFAULT;
