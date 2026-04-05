/*
  Warnings:

  - You are about to drop the column `pickup_time` on the `orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "orders" DROP COLUMN "pickup_time",
ADD COLUMN     "driver_accepted_at" TIMESTAMP;
