-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "hash" SET DEFAULT '',
ALTER COLUMN "steamId" SET DEFAULT '';
