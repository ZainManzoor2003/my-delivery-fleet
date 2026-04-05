-- Rename surcharge columns to new names (preserving existing data)
ALTER TABLE "businesses" RENAME COLUMN "surcharge_restaurant_short" TO "surcharge_base_quote";
ALTER TABLE "businesses" RENAME COLUMN "surcharge_restaurant_long" TO "surcharge_extended";

-- Create SurchargeType enum
CREATE TYPE "SurchargeType" AS ENUM ('BASE_QUOTE', 'EXTENDED_QUOTE', 'CATERING', 'RETAIL');

-- Add surcharge_type column to orders
ALTER TABLE "orders" ADD COLUMN "surcharge_type" "SurchargeType";
