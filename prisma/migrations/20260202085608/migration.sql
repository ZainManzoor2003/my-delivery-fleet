/*
  Warnings:

  - You are about to drop the column `delivery_fee` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `sub_total` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `tax_amount` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `tax_rate` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `tip_amount` on the `orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "orders" DROP COLUMN "delivery_fee",
DROP COLUMN "sub_total",
DROP COLUMN "tax_amount",
DROP COLUMN "tax_rate",
DROP COLUMN "tip_amount",
ADD COLUMN     "customer_delivery_fee" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "customer_sub_total" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "customer_tip" DECIMAL(10,2) NOT NULL DEFAULT 0.00;
