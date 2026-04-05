/*
  Warnings:

  - You are about to drop the column `address` on the `businesses` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `businesses` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `businesses` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('BUSINESS', 'BILLING');

-- AlterTable
ALTER TABLE "businesses" DROP COLUMN "address",
DROP COLUMN "latitude",
DROP COLUMN "longitude";

-- CreateTable
CREATE TABLE "addresses" (
    "id" UUID NOT NULL,
    "type" "AddressType" NOT NULL,
    "street" VARCHAR(255) NOT NULL,
    "apartment" VARCHAR(100),
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(50) NOT NULL,
    "postal_code" VARCHAR(20) NOT NULL,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "business_id" UUID,
    "payment_method_id" UUID,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "addresses_business_id_key" ON "addresses"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "addresses_payment_method_id_key" ON "addresses"("payment_method_id");

-- CreateIndex
CREATE INDEX "addresses_business_id_idx" ON "addresses"("business_id");

-- CreateIndex
CREATE INDEX "addresses_payment_method_id_idx" ON "addresses"("payment_method_id");

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
