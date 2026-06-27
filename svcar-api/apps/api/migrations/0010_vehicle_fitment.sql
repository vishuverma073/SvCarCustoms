-- Vehicle fitment: vehicle_makes / vehicle_models reference data, product_fitments
-- mapping products to compatible cars, and a fits_all_vehicles flag on products
-- (universal accessories default to true and carry no product_fitments rows).
CREATE TABLE IF NOT EXISTS "vehicle_makes" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "vehicle_makes_slug_unique" UNIQUE("slug")
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vehicle_models" (
  "id" serial PRIMARY KEY NOT NULL,
  "make_id" integer NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "year_start" integer,
  "year_end" integer,
  "sort_order" integer DEFAULT 0 NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_fitments" (
  "id" serial PRIMARY KEY NOT NULL,
  "product_id" integer NOT NULL,
  "make" text NOT NULL,
  "model" text NOT NULL,
  "year_start" integer,
  "year_end" integer
);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "fits_all_vehicles" boolean DEFAULT true NOT NULL;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "vehicle_models" ADD CONSTRAINT "vehicle_models_make_id_vehicle_makes_id_fk" FOREIGN KEY ("make_id") REFERENCES "public"."vehicle_makes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "product_fitments" ADD CONSTRAINT "product_fitments_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vehicle_makes_sort_idx" ON "vehicle_makes" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vehicle_models_make_id_idx" ON "vehicle_models" USING btree ("make_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_fitments_product_id_idx" ON "product_fitments" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_fitments_make_model_idx" ON "product_fitments" USING btree ("make","model");
