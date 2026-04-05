/*
  Warnings:

  - Made the column `stripe_customer_id` on table `businesses` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "businesses" ALTER COLUMN "stripe_customer_id" SET NOT NULL;
