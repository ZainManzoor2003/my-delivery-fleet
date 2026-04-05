-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "total_customer_delivery_fees" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "total_customer_tips" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "total_tips" DECIMAL(10,2) NOT NULL DEFAULT 0.00;
