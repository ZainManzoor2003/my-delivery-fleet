-- CreateEnum
CREATE TYPE "BusinessStatus" AS ENUM ('INCOMPLETE', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "OrderItemSize" AS ENUM ('small', 'medium', 'large', 'xlarge');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('pending', 'paid', 'failed', 'processed');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('succeeded', 'failed', 'processed');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('subscription', 'refund');

-- CreateEnum
CREATE TYPE "DeliverableAction" AS ENUM ('deliverable_action_meet_at_door', 'deliverable_action_leave_at_door');

-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('ASAP', 'SCHEDULE');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('Account', 'Billing', 'Dispatch', 'Order');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('IMAGE', 'PDF');

-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('BUSINESS', 'BILLING', 'DELIVERY');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "phone_number" VARCHAR(20),
    "image" TEXT,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" UUID NOT NULL,
    "type" "AddressType" NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "street" VARCHAR(255) NOT NULL,
    "apartment" VARCHAR(100),
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(50) NOT NULL,
    "postal_code" VARCHAR(20) NOT NULL,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "business_id" UUID,
    "payment_method_id" UUID,
    "order_id" UUID,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "businesses" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL DEFAULT 'restaurant',
    "name" VARCHAR(255) NOT NULL,
    "logo" TEXT,
    "phone" VARCHAR(50) NOT NULL,
    "avg_orders" INTEGER,
    "delivery_radius" DECIMAL(5,2),
    "routing_preference" VARCHAR(50) NOT NULL DEFAULT 'auto',
    "pickup_instructions" TEXT,
    "referral_code" VARCHAR(50) NOT NULL,
    "referred_by_code" VARCHAR(50),
    "referrer_code_used_by" UUID,
    "referred_code_used_at" TIMESTAMP,
    "stripe_customer_id" VARCHAR(255) NOT NULL,
    "service_charge_per_order" DECIMAL(10,2) NOT NULL DEFAULT 2.75,
    "status" "BusinessStatus" NOT NULL DEFAULT 'INCOMPLETE',
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "pos_integrations" (
    "id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "provider_name" VARCHAR(100) NOT NULL,
    "account_id" VARCHAR(255),
    "access_token" TEXT,
    "refresh_token" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "pos_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "order_number" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "customer_name" VARCHAR(255) NOT NULL,
    "customer_phone" VARCHAR(50) NOT NULL,
    "customer_email" VARCHAR(255),
    "notes" TEXT,
    "provider" VARCHAR(50),
    "provider_delivery_id" VARCHAR(255),
    "provider_quote_id" VARCHAR(255),
    "provider_quote" DECIMAL(10,2),
    "delivery_fee" DECIMAL(10,2),
    "tracking_url" TEXT,
    "customer_delivery_fee" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "customer_tip" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "customer_sub_total" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "service_fee" DECIMAL(10,2),
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "driver_tip" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "total_amount" DECIMAL(10,2),
    "delivery_instruction" TEXT,
    "handoff_type" "DeliverableAction",
    "delivery_type" "DeliveryType" DEFAULT 'ASAP',
    "status" VARCHAR(50) NOT NULL,
    "estimated_delivery_time" TIMESTAMP,
    "estimated_pickup_time" TIMESTAMP,
    "delivered_at" TIMESTAMP,
    "paid_at" TIMESTAMP,
    "driver_requested_at" TIMESTAMP,
    "driver_accepted_at" TIMESTAMP,
    "delivery_start_time" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "couriers" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "name" VARCHAR(255),
    "phone" VARCHAR(50),
    "photo_url" TEXT,
    "vehicle_type" VARCHAR(50),
    "vehicle_make" VARCHAR(100),
    "vehicle_model" VARCHAR(100),
    "vehicle_color" VARCHAR(50),
    "license_plate" VARCHAR(20),
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "is_imminent" BOOLEAN NOT NULL DEFAULT false,
    "location_updated_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "couriers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "size" "OrderItemSize" NOT NULL DEFAULT 'small',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(10,2),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "stripe_payment_method_id" VARCHAR(255) NOT NULL,
    "financial_connections_account_id" VARCHAR(255),
    "payment_type" VARCHAR(50) NOT NULL,
    "card_holder_name" VARCHAR(255),
    "card_last4" VARCHAR(4),
    "card_brand" VARCHAR(50),
    "card_exp_month" INTEGER,
    "card_exp_year" INTEGER,
    "ach_account_holder_name" VARCHAR(255),
    "ach_bank_name" VARCHAR(255),
    "ach_account_last4" VARCHAR(4),
    "ach_account_type" VARCHAR(50),
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_date" TIMESTAMP,
    "ownership_verified" BOOLEAN,
    "cvc_check_result" VARCHAR(50),
    "avs_check_result" VARCHAR(50),
    "last_balance_check" TIMESTAMP,
    "available_balance" BIGINT,
    "current_balance" BIGINT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "order_id" UUID,
    "invoice_id" UUID,
    "payment_method_id" UUID,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "stripe_payment_intent_id" VARCHAR(255),
    "status" "TransactionStatus" NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "plan_name" VARCHAR(100) NOT NULL,
    "monthly_fee" DECIMAL(10,2) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "current_period_start" DATE NOT NULL,
    "current_period_end" DATE NOT NULL,
    "stripe_subscription_id" VARCHAR(255),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "invoice_number" VARCHAR(50) NOT NULL,
    "week_start" DATE NOT NULL,
    "week_end" DATE NOT NULL,
    "total_driver_tips" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "total_delivery_fees" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "card_charges" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "total_orders" INTEGER NOT NULL DEFAULT 0,
    "subscription_fee" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "smart_marketing_charges" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'pending',
    "pdf_url" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "admin_notes" TEXT,
    "reviewed_by" TEXT,
    "stripe_refund_id" VARCHAR(255),
    "processed_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "ticket_number" VARCHAR(50) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'open',
    "priority" VARCHAR(50) NOT NULL DEFAULT 'medium',
    "order_id" UUID,
    "order_number" VARCHAR(50),
    "category" "TicketCategory" NOT NULL,
    "assigned_to" TEXT,
    "resolved_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_messages" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "sender_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" UUID NOT NULL,
    "file_name" VARCHAR(255),
    "file_size" BIGINT,
    "file_url" TEXT,
    "type" "AttachmentType" NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ticket_id" UUID,
    "ticket_message_id" UUID,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_id_key" ON "users"("id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "addresses_business_id_key" ON "addresses"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "addresses_payment_method_id_key" ON "addresses"("payment_method_id");

-- CreateIndex
CREATE UNIQUE INDEX "addresses_order_id_key" ON "addresses"("order_id");

-- CreateIndex
CREATE INDEX "addresses_business_id_idx" ON "addresses"("business_id");

-- CreateIndex
CREATE INDEX "addresses_payment_method_id_idx" ON "addresses"("payment_method_id");

-- CreateIndex
CREATE INDEX "addresses_order_id_idx" ON "addresses"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "businesses_user_id_key" ON "businesses"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "businesses_referral_code_key" ON "businesses"("referral_code");

-- CreateIndex
CREATE INDEX "businesses_user_id_idx" ON "businesses"("user_id");

-- CreateIndex
CREATE INDEX "businesses_type_idx" ON "businesses"("type");

-- CreateIndex
CREATE INDEX "businesses_status_idx" ON "businesses"("status");

-- CreateIndex
CREATE INDEX "businesses_referral_code_idx" ON "businesses"("referral_code");

-- CreateIndex
CREATE UNIQUE INDEX "admins_user_id_key" ON "admins"("user_id");

-- CreateIndex
CREATE INDEX "admins_user_id_idx" ON "admins"("user_id");

-- CreateIndex
CREATE INDEX "orders_business_id_idx" ON "orders"("business_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");

-- CreateIndex
CREATE INDEX "orders_customer_phone_idx" ON "orders"("customer_phone");

-- CreateIndex
CREATE UNIQUE INDEX "couriers_order_id_key" ON "couriers"("order_id");

-- CreateIndex
CREATE INDEX "couriers_order_id_idx" ON "couriers"("order_id");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_business_id_key" ON "payment_methods"("business_id");

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

-- CreateIndex
CREATE INDEX "transactions_business_id_idx" ON "transactions"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "invoices_business_id_idx" ON "invoices"("business_id");

-- CreateIndex
CREATE INDEX "refunds_status_idx" ON "refunds"("status");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_ticket_number_key" ON "tickets"("ticket_number");

-- CreateIndex
CREATE INDEX "tickets_business_id_idx" ON "tickets"("business_id");

-- CreateIndex
CREATE INDEX "tickets_status_idx" ON "tickets"("status");

-- CreateIndex
CREATE INDEX "attachments_ticket_id_idx" ON "attachments"("ticket_id");

-- CreateIndex
CREATE INDEX "attachments_ticket_message_id_idx" ON "attachments"("ticket_message_id");

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_integrations" ADD CONSTRAINT "pos_integrations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "couriers" ADD CONSTRAINT "couriers_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "admins"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "admins"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_ticket_message_id_fkey" FOREIGN KEY ("ticket_message_id") REFERENCES "ticket_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
