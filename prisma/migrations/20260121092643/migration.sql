/*
  Warnings:

  - You are about to drop the column `description` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `total_price` on the `order_items` table. All the data in the column will be lost.
  - The `size` column on the `order_items` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `size` on the `orders` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "OrderItemSize" AS ENUM ('small', 'medium', 'large', 'xlarge');

-- AlterTable
ALTER TABLE "order_items" DROP COLUMN "description",
DROP COLUMN "total_price",
DROP COLUMN "size",
ADD COLUMN     "size" "OrderItemSize" NOT NULL DEFAULT 'small';

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "size";
