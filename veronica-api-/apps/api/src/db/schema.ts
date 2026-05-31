import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  jsonb,
  numeric,
  timestamp,
  uuid,
  bigserial,
  index,
  uniqueIndex,
  pgEnum,
  check,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────────

export const productStatusEnum = pgEnum("product_status", ["active", "draft", "archived"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

// ─── Catalog ─────────────────────────────────────────────────

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    // Self-referencing tree. AnyPgColumn cast avoids the circular-type error.
    parentId: integer("parent_id").references((): AnyPgColumn => categories.id),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    imageUrl: text("image_url"),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("categories_parent_id_idx").on(t.parentId)],
);

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    status: productStatusEnum("status").default("draft").notNull(),
    isBestseller: boolean("is_bestseller").default(false).notNull(),
    isNew: boolean("is_new").default(false).notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    // Pin-to-top within a category for admin ordering; null = unpinned.
    categoryPinOrder: integer("category_pin_order"),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    specifications: jsonb("specifications").$type<{ name: string; value: string }[]>(),
    includedAccessories: text("included_accessories").array(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("products_category_id_idx").on(t.categoryId),
    index("products_status_bestseller_idx").on(t.status, t.isBestseller),
    index("products_status_new_idx").on(t.status, t.isNew),
    index("products_category_pin_idx").on(t.categoryId, t.categoryPinOrder),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: text("alt"),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (t) => [index("product_images_product_sort_idx").on(t.productId, t.sortOrder)],
);

export const dimensions = pgTable(
  "dimensions",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (t) => [index("dimensions_product_id_idx").on(t.productId)],
);

export const dimensionValues = pgTable(
  "dimension_values",
  {
    id: serial("id").primaryKey(),
    dimensionId: integer("dimension_id")
      .notNull()
      .references(() => dimensions.id, { onDelete: "cascade" }),
    value: text("value").notNull(),
    label: text("label"),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (t) => [index("dimension_values_dimension_sort_idx").on(t.dimensionId, t.sortOrder)],
);

export const skus = pgTable(
  "skus",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    skuCode: text("sku_code").notNull().unique(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    salePrice: numeric("sale_price", { precision: 10, scale: 2 }),
    dimensionValues: jsonb("dimension_values").$type<Record<string, string>>().notNull(),
    attributes: jsonb("attributes").$type<Record<string, string>>(),
    stock: integer("stock"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("skus_product_id_idx").on(t.productId)],
);

// ─── Identity ────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  phone: text("phone").notNull().unique(),
  name: text("name"),
  email: text("email"),
  // bcrypt hash for admin email+password login; null for customers (OTP auth, Phase 3).
  passwordHash: text("password_hash"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const otpCodes = pgTable(
  "otp_codes",
  {
    id: serial("id").primaryKey(),
    phone: text("phone").notNull(),
    codeHash: text("code_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    attempts: integer("attempts").default(0).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
  },
  (t) => [index("otp_codes_phone_expires_idx").on(t.phone, t.expiresAt)],
);

export const addresses = pgTable(
  "addresses",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: text("label"),
    line1: text("line1").notNull(),
    line2: text("line2"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    pincode: text("pincode").notNull(),
    landmark: text("landmark"),
    isDefault: boolean("is_default").default(false).notNull(),
  },
  (t) => [index("addresses_user_id_idx").on(t.userId)],
);

// ─── Cart ────────────────────────────────────────────────────

export const carts = pgTable("carts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const cartItems = pgTable(
  "cart_items",
  {
    id: serial("id").primaryKey(),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    skuId: integer("sku_id")
      .notNull()
      .references(() => skus.id),
    qty: integer("qty").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("cart_items_cart_sku_unique").on(t.cartId, t.skuId),
    check("cart_items_qty_positive", sql`${t.qty} > 0`),
  ],
);

// ─── Orders ──────────────────────────────────────────────────

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: text("order_number").notNull().unique(),
    userId: uuid("user_id").references(() => users.id), // nullable: guest checkout
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    customerEmail: text("customer_email"),
    shippingAddress: jsonb("shipping_address").$type<Record<string, unknown>>().notNull(),
    subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
    shippingFee: numeric("shipping_fee", { precision: 10, scale: 2 }).notNull(),
    gstAmount: numeric("gst_amount", { precision: 10, scale: 2 }).notNull(),
    total: numeric("total", { precision: 10, scale: 2 }).notNull(),
    status: orderStatusEnum("status").default("pending").notNull(),
    razorpayOrderId: text("razorpay_order_id").unique(),
    razorpayPaymentId: text("razorpay_payment_id"),
    razorpaySignature: text("razorpay_signature"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("orders_user_created_idx").on(t.userId, t.createdAt.desc()),
    index("orders_status_created_idx").on(t.status, t.createdAt.desc()),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    skuId: integer("sku_id")
      .notNull()
      .references(() => skus.id),
    productName: text("product_name").notNull(),
    skuCode: text("sku_code").notNull(),
    variantLabel: text("variant_label"),
    imageUrl: text("image_url"),
    unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
    qty: integer("qty").notNull(),
    lineTotal: numeric("line_total", { precision: 10, scale: 2 }).notNull(),
  },
  (t) => [index("order_items_order_id_idx").on(t.orderId)],
);

// ─── Audit ───────────────────────────────────────────────────

export const auditLog = pgTable(
  "audit_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    actorUserId: uuid("actor_user_id").references(() => users.id),
    action: text("action").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id").notNull(),
    changes: jsonb("changes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("audit_log_resource_idx").on(t.resourceType, t.resourceId, t.createdAt.desc()),
    index("audit_log_actor_idx").on(t.actorUserId, t.createdAt.desc()),
  ],
);

// ─── Admin config (singletons) ───────────────────────────────

/** Shape stored in settings.store_address (and reused for order shipping snapshots). */
export type StoreAddress = {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
};

type HeroConfig = {
  imageUrl: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
  showFrom?: string;
  showTo?: string;
};
type PromoConfig = { imageUrl: string; headline: string; ctaText: string; ctaHref: string };

/** One configurable section of the storefront home page (home_config.sections). */
export type HomeSection =
  | { key: "hero"; enabled: boolean; order: number; config: HeroConfig }
  | { key: "bestsellers"; enabled: boolean; order: number; config: Record<string, never> }
  | { key: "categories"; enabled: boolean; order: number; config: { categoryIds: number[] } }
  | { key: "new"; enabled: boolean; order: number; config: Record<string, never> }
  | { key: "featured"; enabled: boolean; order: number; config: { productIds: number[] } }
  | { key: "promo"; enabled: boolean; order: number; config: PromoConfig };

/** Single-row storefront home page composition (id is pinned to 1). */
export const homeConfig = pgTable(
  "home_config",
  {
    id: integer("id").primaryKey().default(1),
    sections: jsonb("sections").$type<HomeSection[]>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    updatedBy: uuid("updated_by").references(() => users.id),
  },
  (t) => [check("home_config_singleton", sql`${t.id} = 1`)],
);

/** Single-row store settings (id is pinned to 1). */
export const settings = pgTable(
  "settings",
  {
    id: integer("id").primaryKey().default(1),
    storeName: text("store_name").notNull().default("Veronica India"),
    supportPhone: text("support_phone").notNull().default("+919350529717"),
    supportEmail: text("support_email").notNull().default("veronicasanitarygoods@gmail.com"),
    storeAddress: jsonb("store_address").$type<StoreAddress>().notNull(),
    gstRate: numeric("gst_rate", { precision: 4, scale: 2 }).notNull().default("18.00"),
    shippingFreeAbove: numeric("shipping_free_above", { precision: 10, scale: 2 })
      .notNull()
      .default("5000"),
    shippingFlatFee: numeric("shipping_flat_fee", { precision: 10, scale: 2 })
      .notNull()
      .default("200"),
    whatsappNumber: text("whatsapp_number").notNull().default("+919350529717"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [check("settings_singleton", sql`${t.id} = 1`)],
);

// ─── Relations ───────────────────────────────────────────────

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "parent_child",
  }),
  children: many(categories, { relationName: "parent_child" }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
  dimensions: many(dimensions),
  skus: many(skus),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const dimensionsRelations = relations(dimensions, ({ one, many }) => ({
  product: one(products, {
    fields: [dimensions.productId],
    references: [products.id],
  }),
  values: many(dimensionValues),
}));

export const dimensionValuesRelations = relations(dimensionValues, ({ one }) => ({
  dimension: one(dimensions, {
    fields: [dimensionValues.dimensionId],
    references: [dimensions.id],
  }),
}));

export const skusRelations = relations(skus, ({ one }) => ({
  product: one(products, {
    fields: [skus.productId],
    references: [products.id],
  }),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, { fields: [carts.userId], references: [users.id] }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  sku: one(skus, { fields: [cartItems.skuId], references: [skus.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  sku: one(skus, { fields: [orderItems.skuId], references: [skus.id] }),
}));
