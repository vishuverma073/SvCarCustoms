-- Email-based OTP auth: email is now the login identity; phone is delivery-only.
ALTER TABLE "users" ALTER COLUMN "phone" DROP NOT NULL;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN duplicate_table THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'otp_codes' AND column_name = 'phone'
  ) THEN
    ALTER TABLE "otp_codes" RENAME COLUMN "phone" TO "email";
  END IF;
END $$;--> statement-breakpoint
DROP INDEX IF EXISTS "otp_codes_phone_expires_idx";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "otp_codes_email_expires_idx" ON "otp_codes" USING btree ("email","expires_at");
