/*
  Warnings:

  - You are about to drop the column `image_url` on the `image_generations` table. All the data in the column will be lost.
  - You are about to drop the `profiles` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[order_id]` on the table `coupon_usages` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[coupon_id,user_id]` on the table `coupon_usages` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `discount_type` on the `coupons` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type` on the `credit_transactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `image_generations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `payment_orders` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ImageGenerationStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "CouponDiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "CreditTransactionType" AS ENUM ('PURCHASE', 'USAGE', 'REFUND', 'ADJUSTMENT', 'REWARD');

-- DropForeignKey
ALTER TABLE "coupon_usages" DROP CONSTRAINT "coupon_usages_order_id_fkey";

-- DropIndex
DROP INDEX "coupon_usages_coupon_id_order_id_key";

-- AlterTable
ALTER TABLE "coupons" ADD COLUMN     "max_uses_per_user" INTEGER DEFAULT 1,
DROP COLUMN "discount_type",
ADD COLUMN     "discount_type" "CouponDiscountType" NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "credit_accounts" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "credit_transactions" DROP COLUMN "type",
ADD COLUMN     "type" "CreditTransactionType" NOT NULL;

-- AlterTable
ALTER TABLE "image_generations" DROP COLUMN "image_url",
ADD COLUMN     "negative_prompt" TEXT,
ADD COLUMN     "num_outputs" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "output_urls" TEXT[],
ADD COLUMN     "style_preset" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "ImageGenerationStatus" NOT NULL;

-- AlterTable
ALTER TABLE "payment_orders" DROP COLUMN "status",
ADD COLUMN     "status" "OrderStatus" NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "pricing_plans" ALTER COLUMN "updated_at" DROP DEFAULT;

-- DropTable
DROP TABLE "profiles";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" TIMESTAMP(3),
    "username" TEXT,
    "password_hash" TEXT,
    "avatar_url" TEXT,
    "google_id" TEXT,
    "github_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_github_id_key" ON "users"("github_id");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_usages_order_id_key" ON "coupon_usages"("order_id");

-- CreateIndex
CREATE INDEX "coupon_usages_user_id_idx" ON "coupon_usages"("user_id");

-- CreateIndex
CREATE INDEX "coupon_usages_coupon_id_idx" ON "coupon_usages"("coupon_id");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_usages_coupon_id_user_id_key" ON "coupon_usages"("coupon_id", "user_id");

-- CreateIndex
CREATE INDEX "credit_transactions_user_id_idx" ON "credit_transactions"("user_id");

-- CreateIndex
CREATE INDEX "credit_transactions_reference_id_idx" ON "credit_transactions"("reference_id");

-- CreateIndex
CREATE INDEX "image_generations_user_id_idx" ON "image_generations"("user_id");

-- CreateIndex
CREATE INDEX "payment_orders_user_id_idx" ON "payment_orders"("user_id");

-- CreateIndex
CREATE INDEX "payment_orders_plan_id_idx" ON "payment_orders"("plan_id");

-- AddForeignKey
ALTER TABLE "credit_accounts" ADD CONSTRAINT "credit_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "payment_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_generations" ADD CONSTRAINT "image_generations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
