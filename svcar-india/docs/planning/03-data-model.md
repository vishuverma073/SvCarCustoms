# 03 — Data Model

## Goals

- Faithfully express the *live* domain model from [src/lib/data.ts](../../src/lib/data.ts), not the stale [src/db/schema.ts](../../src/db/schema.ts).
- Support: category trees, products with N variant dimensions, SKUs as dimension-combinations with prices + free-form attributes, multiple images, orders with line items, users with phone-OTP auth, addresses, OTP codes, audit log.
- Be denormalization-friendly where it helps (JSON columns for SKU attributes, product tags) without losing relational integrity where it matters.

## Tables

### `categories` — self-referencing tree

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `parent_id` | int FK → categories.id, nullable | null = root |
| `name` | text not null | |
| `slug` | text unique not null | |
| `description` | text | |
| `image_url` | text | |
| `sort_order` | int default 0 | |
| `created_at` | timestamptz default now() | |
| `updated_at` | timestamptz default now() | |

Indexes: `(parent_id)`, `(slug)`.

### `products`

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `category_id` | int FK → categories.id not null | leaf categories preferred but allowed at any level |
| `name` | text not null | |
| `slug` | text unique not null | |
| `description` | text | |
| `status` | text check (status in ('active','draft','archived')) default 'draft' | |
| `is_bestseller` | bool default false | |
| `is_new` | bool default false | |
| `tags` | text[] | Postgres array — GIN-indexable |
| `specifications` | jsonb | `[{name, value}, ...]` |
| `included_accessories` | text[] | |
| `created_at` | timestamptz default now() | |
| `updated_at` | timestamptz default now() | |

Indexes: `(category_id)`, `(slug)`, `(status, is_bestseller)`, `(status, is_new)`, GIN on `tags`.

### `product_images`

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `product_id` | int FK → products.id ON DELETE CASCADE | |
| `url` | text not null | |
| `alt` | text | |
| `sort_order` | int default 0 | |

Indexes: `(product_id, sort_order)`.

### `dimensions` — named variant axes per product

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `product_id` | int FK → products.id ON DELETE CASCADE | |
| `name` | text not null | e.g. "Size", "Weight", "Color" |
| `sort_order` | int default 0 | |

Indexes: `(product_id)`.

### `dimension_values`

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `dimension_id` | int FK → dimensions.id ON DELETE CASCADE | |
| `value` | text not null | e.g. "24×18", "Heavy" |
| `label` | text | optional display override |
| `sort_order` | int default 0 | |

Indexes: `(dimension_id, sort_order)`.

### `skus` — purchasable units (product × dimension-combination)

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `product_id` | int FK → products.id ON DELETE CASCADE | |
| `sku_code` | text unique not null | human-readable (LAV-1816) |
| `price` | numeric(10,2) not null | MRP in INR |
| `sale_price` | numeric(10,2) nullable | null = no sale |
| `dimension_values` | jsonb | `{"Size": "24×18", "Weight": "Heavy"}` — denormalized for query speed |
| `attributes` | jsonb | `{"Bowl Size": "22×16", "mm": "610×510"}` — free-form per-SKU details |
| `stock` | int nullable | nullable = not tracked |
| `created_at` | timestamptz default now() | |
| `updated_at` | timestamptz default now() | |

Indexes: `(product_id)`, `(sku_code)`, GIN on `dimension_values`.

**Why JSON for `dimension_values`**: it makes SKU lookup by selection (`{"Size": "24×18"}`) a single GIN-indexed query. The alternative is a junction table `sku_dimension_values(sku_id, dimension_value_id)` — more normalized, more joins, no query advantage in our access pattern.

### `users`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK default gen_random_uuid() | |
| `phone` | text unique not null | E.164 format: `+919350529717` |
| `name` | text | |
| `email` | text | optional |
| `is_admin` | bool default false | |
| `created_at` | timestamptz default now() | |

### `otp_codes` — short-lived OTPs

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `phone` | text not null | |
| `code_hash` | text not null | bcrypt-hashed |
| `expires_at` | timestamptz not null | typically now() + 5 min |
| `attempts` | int default 0 | rate-limit per OTP |
| `consumed_at` | timestamptz | non-null = used |

Indexes: `(phone, expires_at)`. Cleanup cron deletes expired.

### `addresses`

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `user_id` | uuid FK → users.id ON DELETE CASCADE | |
| `label` | text | "Home", "Office" |
| `line1` | text not null | |
| `line2` | text | |
| `city` | text not null | |
| `state` | text not null | |
| `pincode` | text not null | |
| `landmark` | text | |
| `is_default` | bool default false | |

Indexes: `(user_id)`.

### `carts`

For logged-in users we persist server-side; guests use localStorage via Zustand.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK default gen_random_uuid() | |
| `user_id` | uuid FK → users.id unique | one cart per user |
| `updated_at` | timestamptz default now() | |

### `cart_items`

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `cart_id` | uuid FK → carts.id ON DELETE CASCADE | |
| `sku_id` | int FK → skus.id | |
| `qty` | int not null check (qty > 0) | |
| `added_at` | timestamptz default now() | |

Unique on `(cart_id, sku_id)`.

### `orders`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK default gen_random_uuid() | |
| `order_number` | text unique not null | `VE2026053000001` — human-readable |
| `user_id` | uuid FK → users.id | nullable for guest checkout |
| `customer_name` | text not null | snapshot at order time |
| `customer_phone` | text not null | snapshot |
| `customer_email` | text | snapshot |
| `shipping_address` | jsonb not null | full snapshot |
| `subtotal` | numeric(10,2) not null | |
| `shipping_fee` | numeric(10,2) not null | |
| `gst_amount` | numeric(10,2) not null | |
| `total` | numeric(10,2) not null | |
| `status` | text check (status in ('pending','paid','confirmed','shipped','delivered','cancelled','refunded')) default 'pending' | |
| `razorpay_order_id` | text unique | Razorpay's order ID |
| `razorpay_payment_id` | text | filled on payment success |
| `razorpay_signature` | text | for verification |
| `notes` | text | customer note |
| `created_at` | timestamptz default now() | |
| `updated_at` | timestamptz default now() | |

Indexes: `(user_id, created_at desc)`, `(razorpay_order_id)`, `(status, created_at desc)`.

### `order_items`

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `order_id` | uuid FK → orders.id ON DELETE CASCADE | |
| `sku_id` | int FK → skus.id | |
| `product_name` | text not null | snapshot |
| `sku_code` | text not null | snapshot |
| `variant_label` | text | e.g. "24×18 / Heavy" |
| `image_url` | text | snapshot |
| `unit_price` | numeric(10,2) not null | snapshot |
| `qty` | int not null check (qty > 0) | |
| `line_total` | numeric(10,2) not null | |

Indexes: `(order_id)`.

### `audit_log` — admin actions

| Column | Type | Notes |
|---|---|---|
| `id` | bigserial PK | |
| `actor_user_id` | uuid FK → users.id | |
| `action` | text not null | `product.create`, `product.update`, `category.delete`, etc. |
| `resource_type` | text not null | `product`, `category`, `order` |
| `resource_id` | text not null | stringified ID |
| `changes` | jsonb | `{before, after}` for updates |
| `created_at` | timestamptz default now() | |

Indexes: `(resource_type, resource_id, created_at desc)`, `(actor_user_id, created_at desc)`.

---

## Seed migration plan

A one-shot script reads from [src/lib/data.ts](../../src/lib/data.ts) → writes to Postgres:

1. Walk `categories[]` → insert preserving `parentId` relationships (insert roots first).
2. Walk `products[]` → insert into `products`, then `product_images`, `dimensions`, `dimension_values`, `skus`.
3. Verify counts match.
4. Idempotent: use `ON CONFLICT (slug) DO UPDATE` so it's safe to re-run.

Script lives at `apps/api/scripts/seed-from-data.ts` (or root of `svcar-api`).

---

## Indexing strategy

Hot read paths and the indexes that serve them:

| Query | Index |
|---|---|
| Get product by slug | `products(slug)` |
| List products in a category tree | `products(category_id)` + recursive CTE on `categories` |
| Get bestsellers | `products(status, is_bestseller)` partial index where `status='active' and is_bestseller=true` |
| Search by tag | GIN on `products(tags)` |
| Find SKU by selection | GIN on `skus(dimension_values jsonb_path_ops)` |
| User's orders | `orders(user_id, created_at desc)` |
| Admin order list | `orders(status, created_at desc)` |
| OTP lookup | `otp_codes(phone, expires_at)` |

---

## What we throw away from the current schema

The existing [src/db/schema.ts](../../src/db/schema.ts):
- ❌ `product_variants` table — replaced by `dimensions` + `dimension_values` + `skus` tuple
- ❌ flat `tags` text column — becomes Postgres `text[]` with GIN index
- ❌ `discount` column on products — derived from `price`/`sale_price` per SKU
- ✅ `categories`, `products`, `product_images`, `orders` — keep concepts, refine columns
