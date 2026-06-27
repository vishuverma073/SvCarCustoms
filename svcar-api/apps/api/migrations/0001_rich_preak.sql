CREATE TABLE "home_config" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"sections" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	CONSTRAINT "home_config_singleton" CHECK ("home_config"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"store_name" text DEFAULT 'Svcar India' NOT NULL,
	"support_phone" text DEFAULT '+919350529717' NOT NULL,
	"support_email" text DEFAULT 'svcarsanitarygoods@gmail.com' NOT NULL,
	"store_address" jsonb NOT NULL,
	"gst_rate" numeric(4, 2) DEFAULT '18.00' NOT NULL,
	"shipping_free_above" numeric(10, 2) DEFAULT '5000' NOT NULL,
	"shipping_flat_fee" numeric(10, 2) DEFAULT '200' NOT NULL,
	"whatsapp_number" text DEFAULT '+919350529717' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "settings_singleton" CHECK ("settings"."id" = 1)
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "category_pin_order" integer;--> statement-breakpoint
ALTER TABLE "home_config" ADD CONSTRAINT "home_config_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "products_category_pin_idx" ON "products" USING btree ("category_id","category_pin_order");