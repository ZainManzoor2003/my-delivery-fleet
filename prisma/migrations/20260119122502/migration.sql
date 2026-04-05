/*
  Warnings:

  - You are about to drop the column `delivery_address_line1` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `delivery_address_line2` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `delivery_city` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `delivery_latitude` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `delivery_longitude` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `delivery_state` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `delivery_zip` on the `orders` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[order_id]` on the table `addresses` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "AddressType" ADD VALUE 'DELIVERY';

-- AlterTable
ALTER TABLE "addresses" ADD COLUMN     "order_id" UUID;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "delivery_address_line1",
DROP COLUMN "delivery_address_line2",
DROP COLUMN "delivery_city",
DROP COLUMN "delivery_latitude",
DROP COLUMN "delivery_longitude",
DROP COLUMN "delivery_state",
DROP COLUMN "delivery_zip";

-- CreateIndex
CREATE UNIQUE INDEX "addresses_order_id_key" ON "addresses"("order_id");

-- CreateIndex
CREATE INDEX "addresses_order_id_idx" ON "addresses"("order_id");

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
