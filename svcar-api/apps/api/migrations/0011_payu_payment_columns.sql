-- PayU support: a payment_provider discriminator on orders plus PayU's per-attempt
-- transaction id (unique) and PayU payment id (mihpayid). Existing Razorpay orders
-- default to provider "razorpay"; PayU columns stay null until an order uses PayU.
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_provider" text DEFAULT 'razorpay' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payu_txn_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payu_payment_id" text;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "orders" ADD CONSTRAINT "orders_payu_txn_id_unique" UNIQUE("payu_txn_id");
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
