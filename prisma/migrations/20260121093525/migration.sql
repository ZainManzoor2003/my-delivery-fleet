/*
  Warnings:

  - You are about to drop the column `card_type` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `payment_method` on the `orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "orders" DROP COLUMN "card_type",
DROP COLUMN "payment_method";
