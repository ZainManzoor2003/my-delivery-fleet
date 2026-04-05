-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "total_service_charges" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "total_uber_quote" DECIMAL(10,2) NOT NULL DEFAULT 0.00;
