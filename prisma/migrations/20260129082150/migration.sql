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

-- CreateIndex
CREATE UNIQUE INDEX "couriers_order_id_key" ON "couriers"("order_id");

-- CreateIndex
CREATE INDEX "couriers_order_id_idx" ON "couriers"("order_id");

-- AddForeignKey
ALTER TABLE "couriers" ADD CONSTRAINT "couriers_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
