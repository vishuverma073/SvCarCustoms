# Phase 0 (Backend) — Foundations

## What you'll build

The full backend scaffold from scratch: a pnpm monorepo with a `contracts` package (shared zod schemas) and an `api` app (Hono + Drizzle), a Postgres database on Supabase Mumbai with the production schema applied, one working endpoint (`/healthz` + `/categories`), tests, CI, and the contracts package published to GitHub Packages.

End state of Phase 0: a clean Hono service runs locally against real Postgres, returns seeded categories from the database, has green tests + CI, and the FE intern can install `@veronica/contracts@0.1.0` and start building.

## Prerequisites

- [ ] Node.js 20.11.1 installed (`nvm install` will match `.nvmrc` once you create it)
- [ ] pnpm 9.x: `npm install -g pnpm@9`
- [ ] Claude Code installed and authenticated
- [ ] GitHub account `ketan18710` (or your own) with permission to create the `veronica-api` repo
- [ ] GitHub Personal Access Token with `write:packages` + `read:packages` scope (https://github.com/settings/tokens)
- [ ] [TODO confirm with Ketan] Supabase account ready (Phase 0 Task 0.5 creates the project — make sure you have the login)
- [ ] [TODO confirm with Ketan] MSG91 DLT template registration started (5-15 day approval — kick this off now even though you don't need it until Phase 3)

## Success criteria

- `pnpm install && pnpm typecheck && pnpm test` all pass
- `pnpm dev` starts the API; `curl http://localhost:8787/healthz` returns 200
- `curl http://localhost:8787/categories` returns the 4 seeded root categories from Postgres
- `@veronica/contracts@0.1.0` published to GitHub Packages
- GitHub repo exists at `github.com/ketan18710/veronica-api` with CI passing
- M0 integration milestone passes (see [integration-milestones.md](../integration-milestones.md))

## Estimated effort

1-2 sessions (~5 hours).

## Coordinate with FE

The FE intern is doing their own Phase 0 (renaming the repo, installing MSW, setting up mocks). The main handoff: once you publish `@veronica/contracts@0.1.0`, ping them — they can install it and proceed.

---

## Task 0.1 — Initialize the workspace structure

**Context**: A pnpm monorepo with two packages — `apps/api` (the Hono service) and `packages/contracts` (shared types).

**Files to create** (at the root of `/Users/ketanverma/Desktop/Personal/veronica-api/`):
- `package.json` (workspace root)
- `pnpm-workspace.yaml`
- `tsconfig.base.json`
- `.gitignore` (already exists from the planning phase — keep it)
- `.nvmrc`
- `.editorconfig`
- `.npmrc.example` (template for GitHub Packages auth)

**Suggested Claude Code prompt**:
> I'm at `/Users/ketanverma/Desktop/Personal/veronica-api/`. Set up a pnpm workspace.
>
> 1. Create `package.json` at the root:
>    - name: "veronica-api-workspace"
>    - version: "0.0.0"
>    - private: true
>    - packageManager: "pnpm@9.0.0"
>    - engines: node >=20.11.0
>    - scripts: `build`, `dev`, `test`, `typecheck`, `db:generate`, `db:push`, `db:migrate`, `db:studio`, `db:seed` — each delegating to `pnpm --filter @veronica/api ...`
>
> 2. Create `pnpm-workspace.yaml` with packages `apps/*` and `packages/*`.
>
> 3. Create `tsconfig.base.json` — strict mode, ES2022 target, ESNext module, Bundler moduleResolution, noUncheckedIndexedAccess true, isolatedModules true, sourceMap true.
>
> 4. Create `.nvmrc` with `20.11.1`.
>
> 5. Create `.editorconfig` — 2-space indent, LF endings, UTF-8, trim trailing whitespace.
>
> 6. Create `.npmrc.example`:
>    ```
>    @veronica:registry=https://npm.pkg.github.com/
>    //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
>    ```
>
> Run `pnpm install` afterwards (will succeed with empty workspace — generates pnpm-lock.yaml). Don't add any deps yet.

**Verification commands**:
```bash
cd /Users/ketanverma/Desktop/Personal/veronica-api
pnpm install
# Expect: success, lockfile generated, no errors

cat pnpm-workspace.yaml
# Expect: packages list with apps/* and packages/*

ls -la
# Expect to see: package.json, pnpm-workspace.yaml, tsconfig.base.json, .nvmrc, .editorconfig, .npmrc.example, .gitignore, README.md, docs/, pnpm-lock.yaml, node_modules/
```

**Acceptance criteria**:
- [ ] All 6 root config files present
- [ ] `pnpm install` succeeds
- [ ] No code files yet (apps/ and packages/ don't exist; they get created in 0.2/0.3)
- [ ] Commit: `chore(phase-0): workspace init`

---

## Task 0.2 — Set up `@veronica/contracts` package

**Context**: Shared zod schemas + TS types. Published to GitHub Packages; consumed by both this repo (via workspace protocol) and `veronica-web` (via real npm install).

**Files to create**:
- `packages/contracts/package.json`
- `packages/contracts/tsconfig.json`
- `packages/contracts/README.md`
- `packages/contracts/src/index.ts`
- `packages/contracts/src/common.ts` (Id, Slug, Url, Price, Timestamp schemas)
- `packages/contracts/src/category.ts` (`CategorySchema`, `CategoryListSchema`, `CategoryWithBreadcrumbSchema`)
- `packages/contracts/src/product.ts` (`ProductSchema`, `DimensionSchema`, `ProductListItemSchema`)
- `packages/contracts/src/sku.ts` (`SkuSchema`)
- `packages/contracts/src/order.ts` (`OrderStatusSchema` placeholder)

**Suggested Claude Code prompt**:
> Create the `@veronica/contracts` package.
>
> 1. `packages/contracts/package.json`:
>    - name: `@veronica/contracts`, version `0.0.1`, type `module`
>    - main `./dist/index.js`, types `./dist/index.d.ts`
>    - exports `.`: { import: ./dist/index.js, types: ./dist/index.d.ts }
>    - files: ["dist"]
>    - scripts: `build` (tsc), `typecheck` (tsc --noEmit), `test` (echo no tests + exit 0), `clean`
>    - dependencies: zod ^3.23
>    - devDependencies: typescript ^5.4
>    - publishConfig.registry: https://npm.pkg.github.com
>    - repository: { type: git, url: https://github.com/ketan18710/veronica-api.git, directory: packages/contracts }
>
> 2. `packages/contracts/tsconfig.json`: extends `../../tsconfig.base.json`, outDir `./dist`, rootDir `./src`, include `src/**/*`.
>
> 3. `packages/contracts/README.md`: brief explainer that this is the shared schema package.
>
> 4. `packages/contracts/src/common.ts`:
>    - `IdSchema = z.number().int().positive()`
>    - `SlugSchema = z.string().min(1).regex(/^[a-z0-9-]+$/)`
>    - `UrlSchema = z.string().refine(v => v.startsWith("/") || /^https?:\/\//.test(v))`
>    - `PriceSchema = z.number().nonnegative()`
>    - `TimestampSchema = z.string().datetime()`
>    - Export each as both schema and inferred type
>
> 5. `packages/contracts/src/category.ts`:
>    - `CategorySchema = z.object({ id, parentId: IdSchema.nullable(), name, slug: SlugSchema, description: z.string(), image: UrlSchema.optional(), sortOrder: z.number().int() })`
>    - `CategoryListSchema = z.array(CategorySchema)`
>    - `CategoryWithBreadcrumbSchema = CategorySchema.extend({ breadcrumb: z.array(CategorySchema), children: z.array(CategorySchema) })`
>
> 6. `packages/contracts/src/sku.ts`:
>    - `SkuSchema = z.object({ id, skuCode: z.string().min(1), price: PriceSchema, salePrice: PriceSchema.nullable(), dimensionValues: z.record(z.string(), z.string()), attributes: z.record(z.string(), z.string()).optional(), stock: z.number().int().nullable().optional() })`
>
> 7. `packages/contracts/src/product.ts`:
>    - `DimensionValueSchema`, `DimensionSchema`, `SpecificationSchema`
>    - `ProductStatusSchema = z.enum(["active", "draft", "archived"])`
>    - `ProductSchema` with all fields per the data model
>    - `ProductListItemSchema` — light shape with min/max prices computed
>
> 8. `packages/contracts/src/order.ts`:
>    - `OrderStatusSchema = z.enum(["pending","paid","confirmed","shipped","delivered","cancelled","refunded"])`
>    - Note: detailed order schemas come in Phase 4
>
> 9. `packages/contracts/src/index.ts`: re-export everything from common, category, product, sku, order.
>
> 10. Build and verify:
>    ```bash
>    pnpm --filter @veronica/contracts build
>    ls packages/contracts/dist/  # expect: index.js, index.d.ts, category.js, etc.
>    ```

**Verification commands**:
```bash
pnpm --filter @veronica/contracts build
ls packages/contracts/dist/
# Expect: index.js, index.d.ts, common.{js,d.ts}, category.{js,d.ts}, product.{js,d.ts}, sku.{js,d.ts}, order.{js,d.ts}

pnpm --filter @veronica/contracts typecheck
# Expect: no errors
```

**Acceptance criteria**:
- [ ] All files created
- [ ] Build outputs to `dist/`
- [ ] Typecheck passes
- [ ] Commit: `feat(phase-0): @veronica/contracts package skeleton`

---

## Task 0.3 — Set up `@veronica/api` package (Hono skeleton)

**Files to create**:
- `apps/api/package.json`
- `apps/api/tsconfig.json`
- `apps/api/vitest.config.ts`
- `apps/api/drizzle.config.ts`
- `apps/api/.env.example`
- `apps/api/src/app.ts` (creates Hono app, takes deps)
- `apps/api/src/entry/node.ts` (Node runtime entry — uses @hono/node-server)
- `apps/api/src/lib/env.ts` (zod-validated env loader)
- `apps/api/src/db/client.ts` (Drizzle client factory; uses postgres-js)
- `apps/api/src/middleware/logger.ts` (structured JSON request log)
- `apps/api/src/middleware/request-id.ts` (generates/echoes x-request-id)
- `apps/api/src/routes/health.ts` (GET / → { status, timestamp, version })

**Suggested Claude Code prompt**:
> Create the `@veronica/api` package.
>
> 1. `apps/api/package.json`:
>    - name `@veronica/api`, version `0.0.1`, type `module`, private true
>    - scripts: `dev` (tsx watch src/entry/node.ts), `build` (tsc), `start` (node dist/entry/node.js), `test` (vitest run), `test:watch` (vitest), `typecheck` (tsc --noEmit), `db:generate` (drizzle-kit generate), `db:push` (drizzle-kit push), `db:migrate` (drizzle-kit migrate), `db:studio` (drizzle-kit studio), `db:seed` (tsx scripts/seed-from-data.ts)
>    - dependencies: `@hono/node-server` ^1.11, `@veronica/contracts` workspace:*, `drizzle-orm` ^0.45, `hono` ^4.7, `postgres` ^3.4, `zod` ^3.23
>    - devDependencies: `@types/node` ^20.12, `drizzle-kit` ^0.31, `tsx` ^4.7, typescript ^5.4, vitest ^4.0
>
> 2. `apps/api/tsconfig.json`: extends `../../tsconfig.base.json`, outDir `./dist`, rootDir `./src`, types `["node"]`, paths `{ "@/*": ["./src/*"] }`.
>
> 3. `apps/api/vitest.config.ts`: globals true, environment node, include `tests/**/*.test.ts`.
>
> 4. `apps/api/drizzle.config.ts`:
>    - schema `./src/db/schema.ts`, out `./migrations`, dialect `postgresql`
>    - dbCredentials.url from `process.env.DATABASE_URL`
>
> 5. `apps/api/.env.example`:
>    ```
>    DATABASE_URL=postgresql://postgres:postgres@localhost:5432/veronica
>    PORT=8787
>    LOG_LEVEL=info
>    NODE_ENV=development
>    ```
>
> 6. `apps/api/src/lib/env.ts`: export `loadEnv()` that parses `process.env` with a zod schema. Required: `DATABASE_URL` (url), optional: `PORT` (default 8787), `LOG_LEVEL` (default info), `NODE_ENV` (default development). Throw on invalid with field-level error messages.
>
> 7. `apps/api/src/db/client.ts`: export `createDbClient(url)` returning a drizzle instance over postgres-js. Comment: "When deployed to Cloudflare Workers in Phase 2, swap this driver for drizzle-orm/neon-http."
>
> 8. `apps/api/src/middleware/request-id.ts`: middleware that reads `x-request-id` header (validate format ≤64 chars alphanumeric+dash) or generates via `crypto.randomUUID()`. Sets via `c.set("requestId", id)` and on response header.
>
> 9. `apps/api/src/middleware/logger.ts`: middleware that times the request, then console.logs a JSON line with ts, level (error if status≥500, warn if ≥400, else info), msg "request", method, path, status, elapsed_ms, request_id (from context).
>
> 10. `apps/api/src/routes/health.ts`: export a Hono router. `GET /` returns `{ status: "ok", timestamp: ISO string, version: process.env.npm_package_version ?? "0.0.1" }`.
>
> 11. `apps/api/src/app.ts`: export `createApp({ db }: { db: DbClient })` returning a Hono instance with request-id + logger middleware applied, `app.route("/healthz", healthRouter)`, generic notFound + onError handlers (latter logs to console as JSON then returns 500 with `{ error: "Internal Server Error" }`).
>
> 12. `apps/api/src/entry/node.ts`: loads env, creates db client, calls `createApp({ db })`, starts server with `serve({ fetch: app.fetch, port })`. Console.log the listening URL.

**Verification commands**:
```bash
pnpm install
pnpm --filter @veronica/api typecheck
# Expect: no errors

# Copy env file:
cp apps/api/.env.example apps/api/.env
# Edit DATABASE_URL to point at local Postgres or a Supabase project

pnpm dev
# Expect: "veronica-api listening on http://localhost:8787"

# In another terminal:
curl http://localhost:8787/healthz
# Expect: 200 { "status": "ok", "timestamp": "...", "version": "0.0.1" }

curl http://localhost:8787/healthz -i | grep -i x-request-id
# Expect: header present
```

**Acceptance criteria**:
- [ ] All files created
- [ ] Typecheck passes
- [ ] Dev server starts
- [ ] `/healthz` returns 200 with structured body
- [ ] `x-request-id` response header present
- [ ] Logger emits JSON lines on each request
- [ ] Commit: `feat(phase-0): Hono api skeleton with health endpoint`

---

## Task 0.4 — Drizzle schema

**Context**: This is the canonical Postgres schema, modeled on the in-memory `veronica-catelog/src/lib/data.ts` shape (which has richer types than the old `src/db/schema.ts` in that repo — do NOT use the old schema). Phase 1 adds a few admin-specific columns + tables on top of this baseline.

**File to create**:
- `apps/api/src/db/schema.ts`

**Suggested Claude Code prompt**:
> Create `apps/api/src/db/schema.ts` using Drizzle's pg-core. Import: `pgTable, serial, text, integer, boolean, jsonb, numeric, timestamp, uuid, bigserial, index, uniqueIndex, pgEnum, type AnyPgColumn` from `drizzle-orm/pg-core`, and `relations` from `drizzle-orm`.
>
> Define these tables in this order (because of FK references):
>
> 1. Enums: `productStatusEnum` (active|draft|archived), `orderStatusEnum` (pending|paid|confirmed|shipped|delivered|cancelled|refunded).
>
> 2. `categories` — self-referencing tree:
>    - id (serial PK), parentId (integer FK → categories.id, nullable), name (text not null), slug (text unique not null), description (text), imageUrl (text), sortOrder (int default 0 not null), createdAt + updatedAt (timestamptz defaultNow notNull)
>    - Indexes: parent_id, slug
>    - Use `AnyPgColumn` cast for the self-reference: `parentId: integer("parent_id").references((): AnyPgColumn => categories.id)`
>
> 3. `products`:
>    - id, categoryId (FK), name, slug (unique), description, status (productStatusEnum default draft), isBestseller (bool default false), isNew (bool default false), tags (text[]), specifications (jsonb of `{name, value}[]`), includedAccessories (text[]), createdAt, updatedAt
>    - Indexes: categoryId, slug, (status, isBestseller), (status, isNew)
>
> 4. `productImages`: id, productId (FK ON DELETE CASCADE), url (notNull), alt, sortOrder. Index: (productId, sortOrder).
>
> 5. `dimensions`: id, productId (FK CASCADE), name, sortOrder. Index: productId.
>
> 6. `dimensionValues`: id, dimensionId (FK CASCADE), value, label, sortOrder. Index: (dimensionId, sortOrder).
>
> 7. `skus`:
>    - id, productId (FK CASCADE), skuCode (unique notNull), price (numeric 10,2 notNull), salePrice (numeric 10,2 nullable), dimensionValues (jsonb of `Record<string,string>` notNull), attributes (jsonb of `Record<string,string>` nullable), stock (int nullable), createdAt, updatedAt
>    - Index: productId
>
> 8. `users`: id (uuid PK defaultRandom), phone (unique notNull), name, email, isAdmin (bool default false), createdAt
>
> 9. `otpCodes`: id, phone, codeHash, expiresAt, attempts (int default 0), consumedAt. Index: (phone, expiresAt).
>
> 10. `addresses`: id, userId (FK CASCADE), label, line1, line2, city, state, pincode, landmark, isDefault. Index: userId.
>
> 11. `carts`: id (uuid PK defaultRandom), userId (FK CASCADE, unique), updatedAt.
>
> 12. `cartItems`: id, cartId (FK CASCADE), skuId (FK), qty (int notNull check >0), addedAt. Unique on (cartId, skuId).
>
> 13. `orders`:
>    - id (uuid PK), orderNumber (text unique notNull), userId (FK nullable for guest), customerName, customerPhone, customerEmail, shippingAddress (jsonb notNull), subtotal, shippingFee, gstAmount, total (all numeric 10,2 notNull), status (orderStatusEnum default pending), razorpayOrderId (text unique nullable), razorpayPaymentId, razorpaySignature, notes, createdAt, updatedAt
>    - Indexes: (userId, createdAt desc), razorpayOrderId, (status, createdAt desc)
>
> 14. `orderItems`: id, orderId (FK CASCADE), skuId (FK), productName, skuCode, variantLabel, imageUrl, unitPrice, qty, lineTotal. Index: orderId.
>
> 15. `auditLog`: id (bigserial PK), actorUserId (FK nullable), action (notNull), resourceType (notNull), resourceId (notNull), changes (jsonb), createdAt. Indexes: (resourceType, resourceId, createdAt desc), (actorUserId, createdAt desc).
>
> Then add Drizzle `relations` exports for every table that has relationships: categoriesRelations, productsRelations, productImagesRelations, dimensionsRelations, dimensionValuesRelations, skusRelations, cartsRelations, cartItemsRelations, ordersRelations, orderItemsRelations.
>
> The `categories` relations use a `relationName: "parent_child"` to distinguish parent-vs-children on the self-reference.

**Verification commands**:
```bash
pnpm --filter @veronica/api typecheck
# Expect: no errors

# Generate migration SQL (won't apply yet):
pnpm db:generate
# Expect: a SQL file created under apps/api/migrations/
cat apps/api/migrations/0000_*.sql | head -50
# Eyeball: CREATE TYPE, CREATE TABLE statements for all 15 tables
```

**Acceptance criteria**:
- [ ] schema.ts compiles
- [ ] `pnpm db:generate` produces a migration file
- [ ] Migration includes all 15 tables + enums + indexes
- [ ] No raw SQL escapes — pure Drizzle
- [ ] Commit: `feat(phase-0): Drizzle schema for categories, products, users, orders, audit`

**Pitfalls**:
- The self-referencing `parentId` on `categories` requires the `AnyPgColumn` type cast to avoid TS circular type errors.
- Numeric columns return as strings in postgres-js by default. Convert in your route handlers where needed.

---

## Task 0.5 — Create Supabase project (intern action — manual)

**Context**: Real Postgres in Mumbai region. Free tier handles all of dev.

**What to do**:

1. https://supabase.com/dashboard → "New project"
2. Name: `veronica-dev`
3. Database password: strong, saved in password manager
4. **Region**: `Mumbai (ap-south-1)` — critical for India latency
5. Plan: Free
6. Wait ~2 minutes for provisioning
7. Settings → Database → Connection string → URI under "Connection pooling" → "Transaction" mode
8. The URL looks like `postgresql://postgres.xxx:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`
9. Replace `[PASSWORD]` with your saved one
10. **Important**: Add `-dev` to the project name somehow OR set a `DATABASE_URL_DEV_MARKER=true` env var locally — this lets us guard destructive scripts later (per agent-council).

**Acceptance criteria**:
- [ ] Supabase project exists in Mumbai
- [ ] Connection string saved (in password manager — never commit)
- [ ] Project is on Free tier (will pause after 1 week idle — that's OK for dev; we use Pro for prod)

---

## Task 0.6 — Configure `.env` + apply schema

**Files to touch**:
- `apps/api/.env` (create, gitignored)

**Suggested Claude Code prompt**:
> Copy `apps/api/.env.example` to `apps/api/.env`. I'll fill in `DATABASE_URL` myself. Then run `pnpm db:push` to apply the schema to Postgres. If drizzle-kit asks confirmation prompts, accept the safe defaults. Report what tables were created.

**Verification commands**:
```bash
pnpm db:push

# In Supabase SQL editor:
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
# Expect 15 tables: addresses, audit_log, carts, cart_items, categories, dimensions, dimension_values, order_items, orders, otp_codes, product_images, products, skus, users
# (note: there are 14 tables + enum types separately. Confirm by checking Supabase Studio's table list.)
```

**Acceptance criteria**:
- [ ] `apps/api/.env` exists and is gitignored (verify `git status` doesn't show it)
- [ ] `pnpm db:push` succeeds
- [ ] All 14 tables visible in Supabase Studio
- [ ] `product_status` and `order_status` enum types exist

---

## Task 0.7 — `/categories` endpoint

**Files to create**:
- `apps/api/src/routes/categories.ts`

**Suggested Claude Code prompt**:
> Create `apps/api/src/routes/categories.ts` exporting `makeCategoriesRouter(db)`. The router has one route:
>
> `GET /` — returns root categories (where `parent_id IS NULL`), ordered by `sort_order` asc.
>
> Map each DB row to the `CategorySchema` shape from `@veronica/contracts`. Validate the response with `CategoryListSchema.parse()` before sending.
>
> Register in `apps/api/src/app.ts` with `app.route("/categories", makeCategoriesRouter(deps.db))`.

**Verification commands**:
```bash
# DB is empty for now (no seed) — endpoint should return []:
curl http://localhost:8787/categories
# Expect: []
```

(After Task 0.8 seed, this will return real data.)

**Acceptance criteria**:
- [ ] Route exists + registered
- [ ] Empty DB returns `[]`
- [ ] Output validated against contracts schema
- [ ] Commit: `feat(phase-0): GET /categories endpoint`

---

## Task 0.8 — Seed-from-data script

**Context**: The existing `veronica-catelog/src/lib/data.ts` has 8 categories + 12 products with full variant data. We need this in Postgres.

**Important**: the source has **duplicate product IDs** (id 4 and id 6 each appear twice). The seed script must NOT preserve source IDs — let Postgres assign new serials. Build a `(sourceIndex → newId)` map for cross-references.

**Files to create**:
- `apps/api/scripts/seed-data.ts` — fixture, mirrors the shape from veronica-catelog data.ts
- `apps/api/scripts/seed-from-data.ts` — the actual seeder

**Suggested Claude Code prompt**:
> Create the seed script.
>
> 1. Read `/Users/ketanverma/Desktop/Personal/veronica-catelog/src/lib/data.ts` (this is the FE repo). Extract the `categories` and `products` arrays.
>
> 2. Copy that data verbatim into a new file `apps/api/scripts/seed-data.ts`, exported as `export const categoriesData = [...]` and `export const productsData = [...]`. Don't reference the FE repo at runtime — this is a one-time copy.
>
> 3. Create `apps/api/scripts/seed-from-data.ts`:
>    - Load env, create db client
>    - **DATABASE_URL guard**: refuse to run unless `process.env.DATABASE_URL` contains "-dev" OR `process.env.I_AM_SURE_NOT_PROD === "true"` (per agent council)
>    - In a transaction:
>      a. Insert categories root-first (filter `parentId === null` first, then children). Use `ON CONFLICT (slug) DO UPDATE SET ...` for idempotency. Build a `sourceCategoryId → dbCategoryId` map.
>      b. For each product:
>         - Insert product (translate `categoryId` via the map). `ON CONFLICT (slug) DO UPDATE`.
>         - Delete existing rows in `product_images`, `dimensions`, `dimension_values`, `skus` for this product (so re-seeds are idempotent).
>         - Insert images, dimensions (build `sourceDimensionId → dbDimensionId` map), dimension_values, skus.
>         - For SKUs, convert source `dimensionValues` from source ids to value strings (since the DB stores values by dimension NAME, not id).
>    - Log progress: `Seeded X categories, Y products, Z SKUs, W images`
>    - Commit transaction (or rollback if anything fails).

**Verification commands**:
```bash
pnpm db:seed
# Expect: "Seeded 8 categories, 12 products, ~25 SKUs, ~30 images"

# Verify counts in Supabase:
SELECT COUNT(*) FROM categories;   -- 8
SELECT COUNT(*) FROM products;     -- 12
SELECT COUNT(*) FROM skus;         -- 25-ish
SELECT COUNT(*) FROM product_images; -- 30-ish

# Idempotency check:
pnpm db:seed
# Re-run. Counts should be unchanged.

# Now categories endpoint returns real data:
curl http://localhost:8787/categories | jq
# Expect: 4 root categories (Kitchen Sinks, Health Faucet Sets, Bathroom Accessories, Plumbing & Fittings)
```

**Acceptance criteria**:
- [ ] Seed script runs cleanly
- [ ] Counts match expected
- [ ] Re-running is idempotent (no duplicates)
- [ ] DATABASE_URL guard active (try a fake prod URL → script refuses)
- [ ] `/categories` returns real data
- [ ] Commit: `feat(phase-0): seed-from-data script`

---

## Task 0.9 — Tests

**Files to create**:
- `apps/api/tests/health.test.ts`
- `apps/api/tests/categories.test.ts`

**Suggested Claude Code prompt**:
> Create vitest tests.
>
> `tests/health.test.ts`: import `createApp`, mock db as `{} as DbClient`, call `app.request("/healthz")`. Assert status 200, body has status="ok" + ISO timestamp. Also test unknown route → 404 with `{ error: "Not Found" }`.
>
> `tests/categories.test.ts`: same setup, but mock the db with `select().from().where().orderBy()` chain returning a fake category row. Assert 200 + body matches the contracts schema. Also test empty result returns [].

**Verification commands**:
```bash
pnpm test
# Expect: 4 passed (2 from each test file)
```

**Acceptance criteria**:
- [ ] Both test files pass
- [ ] Tests don't hit the real DB (mocked)
- [ ] Commit: `test(phase-0): /healthz and /categories tests`

---

## Task 0.10 — CI

**Files to create**:
- `.github/workflows/ci.yml`

**Suggested Claude Code prompt**:
> Create `.github/workflows/ci.yml`:
> - Trigger: pull_request + push to main
> - Job `test` on ubuntu-latest:
>   1. checkout
>   2. pnpm/action-setup@v4 with version 9
>   3. actions/setup-node@v4 with node 20.11.1, cache: pnpm
>   4. `pnpm install --frozen-lockfile`
>   5. `pnpm --filter @veronica/contracts build`
>   6. `pnpm typecheck`
>   7. `pnpm test`

**Acceptance criteria**:
- [ ] Workflow file exists
- [ ] Will run on PRs once pushed to GitHub (Task 0.11)
- [ ] Commit: `ci(phase-0): GitHub Actions test workflow`

---

## Task 0.11 — Push to GitHub + publish `@veronica/contracts@0.1.0`

**What to do** (mix of manual + Claude):

1. **Manual**: https://github.com/new → owner `ketan18710`, name `veronica-api`, Private, no README/gitignore/license (we have them).
2. **Claude prompt**:
   > I'm at `/Users/ketanverma/Desktop/Personal/veronica-api`. Initialize git if not already (`git init`). Stage all files except `.env` and `node_modules` (already gitignored). Commit `chore: initial scaffold` with the Co-Authored-By line for Claude. Add remote `origin` as `https://github.com/ketan18710/veronica-api.git`. Push `main`. Then verify CI ran by checking `gh pr` after opening a no-op PR.
3. **Set up GitHub Packages auth locally**:
   - Create PAT with `write:packages` if not already
   - `export GITHUB_TOKEN=ghp_...`
   - `cp .npmrc.example .npmrc` (gitignored — added to .gitignore in Task 0.1)
4. **Publish contracts**:
   ```bash
   pnpm --filter @veronica/contracts build
   pnpm --filter @veronica/contracts publish --access restricted --no-git-checks
   pnpm view @veronica/contracts version --registry https://npm.pkg.github.com
   # Expect: 0.1.0
   ```
5. **Notify FE intern**: "@veronica/contracts@0.1.0 is published. You can install it."

**Acceptance criteria**:
- [ ] Repo on GitHub
- [ ] CI passes on push to main
- [ ] `@veronica/contracts@0.1.0` published to GitHub Packages
- [ ] FE intern notified
- [ ] `.env` and `.npmrc` confirmed NOT in the pushed files
- [ ] Commit: `chore(phase-0): initial push + contracts v0.1.0 release`

---

## Common pitfalls across this phase

- **Don't commit `.env` or `.npmrc`.** Both have secrets. Verify with `git status` before every commit.
- **Numeric columns**: postgres-js returns numerics as strings. If `price: "3060"` shows up where you expected a number, convert: `parseFloat(row.price)`.
- **Don't preserve source product IDs**: data.ts has duplicates (id 4 and 6 each twice). Let Postgres assign new ones; build mappings.
- **Workers compatibility**: we use `postgres-js` (TCP) for Node dev. When Phase 2 Task 1.7 deploys to Cloudflare Workers, swap to `drizzle-orm/neon-http`. Keep that swap-path in mind — avoid Node-specific APIs in route handlers.
- **Migration vs db:push**: use `db:generate` to create migration files (commit them). `db:push` is for fast dev iteration only — don't ship to prod with `db:push`.

## What's next

→ Phase 1: [Admin API](./phase-1-admin.md) — auth, products/categories/home/uploads/settings CRUD. The biggest BE phase.

Before Phase 1 starts, both interns sync at [M0 — Integration milestone](../integration-milestones.md#m0--after-phase-0-foundations).
