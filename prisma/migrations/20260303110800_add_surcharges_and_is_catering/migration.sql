-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "surcharge_catering" DECIMAL(10,2) NOT NULL DEFAULT 4.99,
ADD COLUMN     "surcharge_restaurant_long" DECIMAL(10,2) NOT NULL DEFAULT 0.99,
ADD COLUMN     "surcharge_restaurant_short" DECIMAL(10,2) NOT NULL DEFAULT 1.24,
ADD COLUMN     "surcharge_retail" DECIMAL(10,2) NOT NULL DEFAULT 1.69;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "is_catering" BOOLEAN NOT NULL DEFAULT false;
