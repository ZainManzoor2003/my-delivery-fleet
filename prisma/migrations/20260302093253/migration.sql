-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "quote_expires_at" TIMESTAMP,
ADD COLUMN     "total_tip" DECIMAL(10,2) NOT NULL DEFAULT 0.00;
