-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('CREEM', 'STRIPE', 'PAYPAL');

-- CreateTable
CREATE TABLE "payment_product_mappings" (
    "id" UUID NOT NULL,
    "pricing_plan_id" UUID NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "provider_prod_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payment_product_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_product_mappings_provider_provider_prod_id_idx" ON "payment_product_mappings"("provider", "provider_prod_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_product_mappings_pricing_plan_id_provider_key" ON "payment_product_mappings"("pricing_plan_id", "provider");

-- AddForeignKey
ALTER TABLE "payment_product_mappings" ADD CONSTRAINT "payment_product_mappings_pricing_plan_id_fkey" FOREIGN KEY ("pricing_plan_id") REFERENCES "pricing_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
