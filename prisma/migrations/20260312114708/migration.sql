-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "is_cleared_from_tracking" BOOLEAN NOT NULL DEFAULT false;
