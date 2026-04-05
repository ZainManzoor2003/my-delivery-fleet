-- CreateEnum
CREATE TYPE "BusinessStatus" AS ENUM ('INCOMPLETE', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "status" "BusinessStatus" NOT NULL DEFAULT 'INCOMPLETE';

-- CreateIndex
CREATE INDEX "businesses_status_idx" ON "businesses"("status");
