/*
  Warnings:

  - You are about to drop the column `ach_account_number` on the `payment_methods` table. All the data in the column will be lost.
  - You are about to drop the column `ach_routing_number` on the `payment_methods` table. All the data in the column will be lost.
  - You are about to drop the column `card_number` on the `payment_methods` table. All the data in the column will be lost.
  - You are about to drop the column `cvc` on the `payment_methods` table. All the data in the column will be lost.
  - You are about to drop the column `stripePaymentMethodId` on the `payment_methods` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripe_payment_method_id]` on the table `payment_methods` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[financial_connections_account_id]` on the table `payment_methods` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `stripe_payment_method_id` to the `payment_methods` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "payment_methods" DROP COLUMN "ach_account_number",
DROP COLUMN "ach_routing_number",
DROP COLUMN "card_number",
DROP COLUMN "cvc",
DROP COLUMN "stripePaymentMethodId",
ADD COLUMN     "available_balance" BIGINT,
ADD COLUMN     "avs_check_result" VARCHAR(50),
ADD COLUMN     "current_balance" BIGINT,
ADD COLUMN     "cvc_check_result" VARCHAR(50),
ADD COLUMN     "financial_connections_account_id" VARCHAR(255),
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_balance_check" TIMESTAMP,
ADD COLUMN     "ownership_verified" BOOLEAN,
ADD COLUMN     "stripe_payment_method_id" VARCHAR(255) NOT NULL,
ADD COLUMN     "verification_date" TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_stripe_payment_method_id_key" ON "payment_methods"("stripe_payment_method_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_financial_connections_account_id_key" ON "payment_methods"("financial_connections_account_id");

-- CreateIndex
CREATE INDEX "payment_methods_business_id_idx" ON "payment_methods"("business_id");

-- CreateIndex
CREATE INDEX "payment_methods_stripe_payment_method_id_idx" ON "payment_methods"("stripe_payment_method_id");

-- CreateIndex
CREATE INDEX "payment_methods_payment_type_idx" ON "payment_methods"("payment_type");
