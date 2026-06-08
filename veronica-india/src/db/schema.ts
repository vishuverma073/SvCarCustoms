import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ─── Categories ──────────────────────────────────────────────
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  image: text("image"),
  sortOrder: integer("sort_order").default(0),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

// ─── Products ────────────────────────────────────────────────
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  categoryId: integer("category_id").references(() => categories.id),
  basePrice: real("base_price").notNull(),
  salePrice: real("sale_price"),
  discount: integer("discount"),
  isBestseller: integer("is_bestseller", { mode: "boolean" }).default(false),
  isNew: integer("is_new", { mode: "boolean" }).default(false),
  status: text("status", { enum: ["active", "draft"] }).default("active"),
  tags: text("tags"), // JSON array of strings like ["RustProof", "AcidResistant"]
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

// ─── Product Images ──────────────────────────────────────────
export const productImages = sqliteTable("product_images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  alt: text("alt"),
  sortOrder: integer("sort_order").default(0),
});

// ─── Product Variants ────────────────────────────────────────
export const productVariants = sqliteTable("product_variants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g. "Size"
  value: text("value").notNull(), // e.g. "24×18"
  priceAdjustment: real("price_adjustment").default(0),
});

// ─── Orders ──────────────────────────────────────────────────
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderNumber: text("order_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  items: text("items").notNull(), // JSON string
  totalAmount: real("total_amount").notNull(),
  status: text("status", {
    enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
  }).default("pending"),
  notes: text("notes"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

// ─── Type Exports ────────────────────────────────────────────
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;
export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
