# Phase 2 (Backend) — Read Paths

> Renumbered from Phase 1 → Phase 2 on 2026-05-28 (Admin moved to Phase 1). Internal references to "Phase 2" inside this doc refer to the *next* phase (now Phase 3 Auth+Cart).

## What you'll build

A full set of read endpoints that the frontend can consume to render the storefront. After this phase, the existing in-memory `data.ts` on the frontend can be entirely retired — every product/category/search read comes from Postgres via this API.

Endpoints delivered:
- `GET /categories/:slug` — single category with breadcrumb + direct children
- `GET /products` — list with filters (category, bestseller, new, pagination)
- `GET /products/:slug` — full product detail
- `GET /products/by-category/:slug` — products in a category tree (recursive)
- `GET /search?q=` — full-text search via Postgres `tsvector`
- Plus server-side pricing helpers (min, max, discount) on product responses

Also: deploy the API to a real host (Cloudflare Workers OR Fly.io Mumbai — A/B tested in this phase) and bump the contracts package.

## Prerequisites

- [ ] Phase 0 (Backend) complete — `pnpm db:seed` populated the catalogue, `/healthz` and `/categories` return 200
- [ ] You can run the dev server locally and hit endpoints with `curl`
- [ ] You have decision on backend host: [TODO confirm with Ketan — Workers vs Fly.io] (or A/B test both per Task 1.7)

## Success criteria

- All 6 endpoints listed above respond with valid, schema-validated JSON
- p95 response time on `/products/:slug` < 100ms against Supabase Mumbai
- `@svcar/contracts@0.1.0` published with the new schemas
- API is deployed to a real host with a public HTTPS URL
- Frontend can call the deployed API and get categories (smoke test only — full FE swap is FE Phase 1)
- Every endpoint has at least one test

## Estimated effort

1-2 sessions (4-6 hours focused intern + Claude time).

---

## Task 1.1 — Add `/categories/:slug` endpoint

**Context**: The storefront needs to render a single category page with its breadcrumb (root → ... → this) and its direct children (for the subcategory pills).

**What to build**: an endpoint that takes a slug, returns the category plus its computed breadcrumb path and direct children.

**Files to touch**:
- `apps/api/src/routes/categories.ts` — add a new handler
- `packages/contracts/src/category.ts` — confirm `CategoryWithBreadcrumbSchema` covers this shape (it already does — verify)
- `apps/api/tests/categories.test.ts` — add tests

**Suggested Claude Code prompt**:
> Add a new endpoint `GET /categories/:slug` to `apps/api/src/routes/categories.ts`. It should:
>
> 1. Take `slug` from the URL params
> 2. Query `categories` by slug — return 404 if not found
> 3. Walk parent_id up to root, building the breadcrumb array (root first, ending with self)
> 4. Query direct children (where `parent_id = category.id`), ordered by `sort_order`
> 5. Return shape matching `CategoryWithBreadcrumbSchema` from `@svcar/contracts`
> 6. Validate the response via `CategoryWithBreadcrumbSchema.parse()` before sending
>
> Use Drizzle's relational query API (`db.query.categories.findFirst({with: ...})`) where it simplifies things, but it's fine to do it as separate selects if that's clearer.
>
> Add tests in `apps/api/tests/categories.test.ts` covering:
> - root category (breadcrumb has 1 entry, itself)
> - leaf subcategory (breadcrumb has 2 entries: parent + self)
> - 404 for unknown slug

**Verification commands**:
```bash
pnpm test apps/api/tests/categories.test.ts
# Expect: all category tests pass

# With dev server running:
curl -s http://localhost:8787/categories/kitchen-sinks | jq
# Expect: object with id, name, slug, breadcrumb (1 entry), children (2 entries: single-bowl, double-bowl)

curl -s http://localhost:8787/categories/single-bowl | jq
# Expect: breadcrumb has [kitchen-sinks, single-bowl], children is empty array

curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8787/categories/does-not-exist
# Expect: 404
```

**Acceptance criteria**:
- [ ] `/categories/:slug` returns 200 for valid slugs
- [ ] Response matches `CategoryWithBreadcrumbSchema`
- [ ] Breadcrumb is root-first, includes self
- [ ] Children are sorted by `sort_order`
- [ ] 404 for unknown slugs
- [ ] At least 3 tests pass
- [ ] Commit: `feat(phase-1): add /categories/:slug endpoint`

**Pitfalls**:
- Drizzle's relational query API requires the `relations` exports in `schema.ts` — they're already there but make sure `db.query.categories` autocompletes in your IDE.
- Recursive parent walks can cycle on bad data. Limit to 10 hops just in case.

---

## Task 1.2 — Add `/products` list endpoint with filters

**Context**: Storefront pages like home (bestsellers, new arrivals) and category pages need a paginated product list with filters.

**What to build**: `GET /products` with query params:
- `category=slug` — filter by direct category
- `bestseller=1` — only `is_bestseller=true`
- `new=1` — only `is_new=true`
- `limit=20` (default 20, max 50)
- `cursor=<id>` — pagination (id of last item from previous page)

Returns `ProductListItem[]` (light shape: no SKUs/dimensions, just enough for cards). Server computes `minPrice`, `maxBasePrice`, `bestDiscount`.

**Files to touch**:
- `apps/api/src/routes/products.ts` (new)
- `apps/api/src/app.ts` — register the router
- `apps/api/tests/products.test.ts` (new)
- `packages/contracts/src/product.ts` — confirm `ProductListItemSchema` covers it

**Suggested Claude Code prompt**:
> Create `apps/api/src/routes/products.ts` exporting `makeProductsRouter(db)`. Add `GET /` with these query params (validate with zod):
>
> - `category` (optional string slug)
> - `bestseller` (optional "1")
> - `new` (optional "1")
> - `limit` (optional number, default 20, max 50)
> - `cursor` (optional number — product id of the last item from previous page)
>
> Query: select products where `status='active'`, apply filters, order by `id ASC`, take `limit + 1` rows. The last row is "is there more?" indicator.
>
> For each product, compute `minPrice`, `maxBasePrice`, `bestDiscount` from its SKUs in a single follow-up query (join or sub-select to avoid N+1). Use the lowest `sale_price ?? price` for `minPrice`, the highest `price` for `maxBasePrice`, and `Math.max(...skus.map(s => ((s.price - s.salePrice) / s.price) * 100))` rounded for `bestDiscount`.
>
> Also include the primary image (`product_images` ordered by `sort_order`, take 1).
>
> Return `{ items: ProductListItem[], nextCursor: number | null }`. Validate with `z.object({ items: z.array(ProductListItemSchema), nextCursor: z.number().nullable() }).parse(payload)` before sending.
>
> Register the router in `apps/api/src/app.ts` as `/products`.
>
> Add tests: empty result, category filter, bestseller filter, pagination cursor.

**Verification commands**:
```bash
pnpm test apps/api/tests/products.test.ts

# With dev server:
curl -s "http://localhost:8787/products?limit=3" | jq
# Expect: { items: [3 products], nextCursor: <id> }

curl -s "http://localhost:8787/products?bestseller=1" | jq '.items | length'
# Expect: 4 (or however many bestsellers in seed)

curl -s "http://localhost:8787/products?category=kitchen-sinks" | jq '.items | length'
# Expect: products in kitchen-sinks category only

curl -s "http://localhost:8787/products?cursor=2&limit=2" | jq '.items[0].id'
# Expect: first id > 2
```

**Acceptance criteria**:
- [ ] All query params validated with zod (bad input returns 400)
- [ ] Filters compose correctly (`category=X&bestseller=1` works)
- [ ] Pagination via cursor works
- [ ] Each product has `minPrice`, `maxBasePrice`, `bestDiscount` computed correctly
- [ ] No N+1 queries (verify by running with `?log=true` or watching Postgres logs)
- [ ] `nextCursor` is `null` when on the last page
- [ ] At least 4 tests pass
- [ ] Commit: `feat(phase-1): add /products list endpoint with filters`

**Pitfalls**:
- Drizzle's `like` is case-sensitive — use `ilike` for case-insensitive matches.
- The seed data has duplicate product IDs from `data.ts` source — but Phase 0 seed reassigns them, so this should be a non-issue. Verify your seed handled it.
- `limit + 1` trick: if you fetch limit+1 and got that many rows, set `nextCursor = items[limit-1].id` and slice to limit. Otherwise nextCursor is null.

---

## Task 1.3 — Add `/products/:slug` detail endpoint

**Context**: Product detail page (PDP) needs the full product shape: images, dimensions with values, SKUs with prices and attributes, specs, included accessories.

**What to build**: `GET /products/:slug` returning the full `ProductSchema`.

**Files to touch**:
- `apps/api/src/routes/products.ts` — add handler
- `apps/api/tests/products.test.ts` — add tests

**Suggested Claude Code prompt**:
> Add `GET /:slug` to the products router. It should:
>
> 1. Query the product by slug (status='active') — 404 if not found
> 2. Fetch product_images, dimensions (with their values), skus in a single batched query using Drizzle's `with` relational loader
> 3. Sort dimensions by `sort_order`, values within each dimension by `sort_order`, images by `sort_order`, SKUs by id
> 4. Compose the response matching `ProductSchema` from `@svcar/contracts`
> 5. Validate with `ProductSchema.parse()` before sending
>
> Add tests covering:
> - existing slug returns full product with all nested arrays
> - 404 for unknown slug
> - draft products are NOT returned (status filter)

**Verification commands**:
```bash
pnpm test

# Sanity check shape:
curl -s http://localhost:8787/products/lavender-imported-range-single-bowl | jq 'keys'
# Expect: ["categoryId","description","dimensions","id","images","includedAccessories","isBestseller","isNew","name","skus","slug","specifications","status","tags"]

curl -s http://localhost:8787/products/lavender-imported-range-single-bowl | jq '.skus | length'
# Expect: 3 (Lavender has 3 SKUs in seed)

curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8787/products/does-not-exist
# Expect: 404
```

**Acceptance criteria**:
- [ ] Returns full product shape matching `ProductSchema`
- [ ] All nested arrays sorted correctly
- [ ] Draft products return 404 (status filter active)
- [ ] At least 3 tests pass
- [ ] Commit: `feat(phase-1): add /products/:slug detail endpoint`

---

## Task 1.4 — Add `/products/by-category/:slug` (recursive tree)

**Context**: When a user clicks "Kitchen Sinks" (a parent category with `Single Bowl` and `Double Bowl` children), they expect to see products from BOTH child categories. This endpoint walks the category tree.

**What to build**: `GET /products/by-category/:slug` — given a category slug, return all active products in that category and all its descendant categories, in list-item shape.

**Files to touch**:
- `apps/api/src/routes/products.ts`
- `apps/api/tests/products.test.ts`

**Suggested Claude Code prompt**:
> Add `GET /by-category/:slug` to the products router. Implement category-tree expansion using a Postgres recursive CTE:
>
> ```sql
> WITH RECURSIVE category_tree AS (
>   SELECT id FROM categories WHERE slug = $1
>   UNION ALL
>   SELECT c.id FROM categories c
>   JOIN category_tree ct ON c.parent_id = ct.id
> )
> SELECT * FROM products WHERE category_id IN (SELECT id FROM category_tree) AND status = 'active'
> ```
>
> Drizzle supports `sql` template literals for raw SQL. Use `db.execute(sql\`...\`)` and type the result.
>
> Return the same shape as `/products` (list of ProductListItem) — reuse the price-computation helper.
>
> Add tests for:
> - Parent category returns products from all children (e.g. "kitchen-sinks" returns products from "single-bowl" + "double-bowl")
> - Leaf category returns only its direct products
> - Unknown slug returns 404 (or empty array — pick one and document)

**Verification commands**:
```bash
pnpm test

curl -s http://localhost:8787/products/by-category/kitchen-sinks | jq '.items | length'
# Expect: 3 or 4 (Lavender + Jasmine + Svcar Drain Board, possibly more)

curl -s http://localhost:8787/products/by-category/single-bowl | jq '.items | length'
# Expect: 2 (just single-bowl products, fewer than kitchen-sinks)
```

**Acceptance criteria**:
- [ ] Recursive CTE works correctly
- [ ] Parent category returns descendants
- [ ] Leaf category returns direct products only
- [ ] Same response shape as `/products`
- [ ] Tests pass
- [ ] Commit: `feat(phase-1): add /products/by-category/:slug recursive endpoint`

---

## Task 1.5 — Add `/search?q=` with Postgres full-text search

**Context**: Searches across product name, description, and tags. For Phase 1, use Postgres `tsvector` — sufficient up to ~500 SKUs. Phase 6 evaluates Meilisearch if/when needed.

**What to build**: a search endpoint backed by a Postgres `tsvector` index.

**Files to touch**:
- `apps/api/src/db/schema.ts` — add a generated column `search_vector` on products
- `apps/api/src/routes/products.ts` (or new `apps/api/src/routes/search.ts`)
- `apps/api/src/app.ts`
- A new Drizzle migration to add the column + GIN index
- Tests

**Suggested Claude Code prompt**:
> Add full-text search:
>
> 1. In `apps/api/src/db/schema.ts`, add a generated column on products:
>    ```ts
>    searchVector: tsvector("search_vector").generatedAlwaysAs(
>      sql\`to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,'') || ' ' || coalesce(array_to_string(tags, ' '), ''))\`,
>      { mode: "stored" }
>    )
>    ```
>    Note: Drizzle doesn't have a built-in `tsvector` type. You'll need to use `customType` to declare it. If that's awkward, instead create the column in a raw migration SQL file.
>
> 2. Add a GIN index on it: `CREATE INDEX products_search_idx ON products USING GIN (search_vector);`
>
> 3. Generate and apply the migration: `pnpm db:generate` then `pnpm db:push` (or `db:migrate` if you've moved to migrations).
>
> 4. Create `apps/api/src/routes/search.ts` exporting `makeSearchRouter(db)` with `GET /` taking `q` query param. Use `websearch_to_tsquery('english', $q)` to parse the user input. Order by `ts_rank` desc. Limit 20.
>
> 5. Register the router at `/search` in `app.ts`.
>
> 6. Add tests for: matching by name, matching by tag, matching by description, empty query (returns 400 or empty), no matches (returns []).
>
> Validate output via the same shape as `/products` (ProductListItem array).

**Verification commands**:
```bash
pnpm db:push  # apply the new column + index
pnpm db:seed  # re-seed (or the search_vector will be empty for existing rows)

# In Supabase SQL editor:
# SELECT name, search_vector FROM products LIMIT 3;
# Should show non-null tsvector values.

pnpm test

curl -s "http://localhost:8787/search?q=sink" | jq '.items | length'
# Expect: several results

curl -s "http://localhost:8787/search?q=rustproof" | jq '.items[0].name'
# Expect: a product tagged RustProof

curl -s "http://localhost:8787/search?q=xyzxyz" | jq '.items | length'
# Expect: 0
```

**Acceptance criteria**:
- [ ] `search_vector` column exists on products with GIN index
- [ ] Search returns relevant results ranked by ts_rank
- [ ] Empty query handled (400 or empty result — your call, document in the doc string)
- [ ] At least 4 tests pass
- [ ] Commit: `feat(phase-1): add /search with Postgres FTS`

**Pitfalls**:
- The generated column is updated by Postgres automatically on insert/update. If you forget the `GENERATED ALWAYS AS ... STORED` syntax, queries will fail.
- The `english` config doesn't handle Indian product names brilliantly but is fine for now.

---

## Task 1.6 — Add `requestId` middleware + request logging context

**Context**: Phase 5 will add full observability. But even now, debugging is much easier if every log line carries a request id we can grep for.

**What to build**: a tiny middleware that generates or extracts a `x-request-id` header, attaches it to the Hono context, and includes it in the logger output.

**Files to touch**:
- `apps/api/src/middleware/request-id.ts` (new)
- `apps/api/src/middleware/logger.ts` (update to use context value)
- `apps/api/src/app.ts` (register the new middleware before logger)

**Suggested Claude Code prompt**:
> Create `apps/api/src/middleware/request-id.ts`. It should:
>
> 1. Generate a request id (use `crypto.randomUUID()`) if the request doesn't have an `x-request-id` header
> 2. Otherwise use the incoming header value (validate it's a sensible string — max 64 chars, alphanumeric + dash)
> 3. Store it on Hono's context with `c.set("requestId", id)`
> 4. Set it on the response header `x-request-id`
>
> Update `apps/api/src/middleware/logger.ts` to include `request_id: c.get("requestId")` in every log line.
>
> Register both middlewares in `app.ts`: request-id first, then logger.
>
> Add a test verifying:
> - request without x-request-id gets one assigned in the response header
> - request with x-request-id has it echoed back

**Verification commands**:
```bash
pnpm test

curl -i http://localhost:8787/healthz | grep -i x-request-id
# Expect: x-request-id: <uuid>

curl -i -H "x-request-id: test-123" http://localhost:8787/healthz | grep -i x-request-id
# Expect: x-request-id: test-123

# And the server log line should now include "request_id": "..."
```

**Acceptance criteria**:
- [ ] Request id middleware in place
- [ ] Logger output includes `request_id`
- [ ] Tests pass
- [ ] Commit: `feat(phase-1): add request id middleware`

---

## Task 1.7 — Deploy to staging on Cloudflare Workers OR Fly.io Mumbai

**Context**: We've kept the code portable. Now we deploy. Two paths — pick one (or do both temporarily to A/B latency, per the planning doc).

**Decision**: [TODO confirm with Ketan — Workers vs Fly.io for production. If unsure, do both as below and measure.]

**What to build** (Path A — Cloudflare Workers):

Files to touch:
- `apps/api/src/entry/workers.ts` (new)
- `apps/api/src/db/client-http.ts` (new — Neon serverless HTTP driver OR Hyperdrive setup)
- `apps/api/wrangler.toml` (new)

Suggested Claude Code prompt:
> Add Cloudflare Workers deployment.
>
> 1. Create `apps/api/src/entry/workers.ts`:
>    - export default object with `fetch(request, env)` 
>    - Inside, lazily create the db client from `env.DATABASE_URL` using Neon's HTTP driver (`drizzle-orm/neon-http` + `@neondatabase/serverless`)
>    - Construct the app via `createApp({ db })` and delegate `app.fetch(request)`
>
> 2. Add `@neondatabase/serverless` and `drizzle-orm/neon-http` deps to `apps/api/package.json`.
>
> 3. Create `apps/api/wrangler.toml`:
>    ```toml
>    name = "svcar-api-staging"
>    main = "src/entry/workers.ts"
>    compatibility_date = "2024-08-01"
>    compatibility_flags = ["nodejs_compat"]
>    ```
>
> 4. Document how to set secrets: `wrangler secret put DATABASE_URL --name svcar-api-staging`. The DATABASE_URL for Workers should use Supabase's pooler URL in transaction mode.
>
> 5. Deploy: `wrangler deploy`
>
> 6. Smoke test: hit the deployed URL's /healthz and /categories.

**What to build** (Path B — Fly.io Mumbai):

Files to touch:
- `apps/api/Dockerfile` (new)
- `apps/api/fly.toml` (new)

Suggested Claude Code prompt:
> Add Fly.io deployment.
>
> 1. Create `apps/api/Dockerfile`:
>    - Node 20 alpine base
>    - Copy package.json + pnpm-lock.yaml from repo root
>    - Install pnpm, run `pnpm install --frozen-lockfile`
>    - Copy source, run `pnpm --filter @svcar/api build`
>    - Run `CMD ["node", "apps/api/dist/entry/node.js"]`
>
> 2. Create `apps/api/fly.toml` with primary_region = "bom" (Mumbai)
>
> 3. Initialize: `fly launch --no-deploy --copy-config --region bom`
>
> 4. Set secret: `fly secrets set DATABASE_URL=<supabase-url>`
>
> 5. Deploy: `fly deploy`
>
> 6. Smoke test: hit the .fly.dev URL's /healthz and /categories.

**Verification commands**:
```bash
# Whatever you chose, replace URL:
curl -s https://svcar-api-staging.<host>.workers.dev/healthz
# OR
curl -s https://svcar-api.fly.dev/healthz

# Should return: {"status":"ok",...}

# Measure latency from your machine:
curl -s -o /dev/null -w "%{time_total}s\n" https://<url>/categories
# Expect: < 0.3s from India
```

**Acceptance criteria**:
- [ ] Decision made: Workers OR Fly.io (or both for A/B testing)
- [ ] API deployed and publicly accessible
- [ ] `/healthz` and `/categories` return 200 over HTTPS
- [ ] DATABASE_URL set as a secret, not committed
- [ ] p95 latency from India < 200ms
- [ ] Commit: `feat(phase-1): deploy to staging on <chosen platform>`

**Pitfalls**:
- Workers cannot use the standard `postgres` driver (TCP). MUST use Neon serverless or Hyperdrive (both HTTP-based).
- Fly.io free tier auto-stops machines after idle. Set `auto_stop_machines = false` for staging, or accept ~1s cold starts.

---

## Task 1.8 — Bump and publish `@svcar/contracts@0.1.0`

**Context**: We added new schemas. The frontend needs them.

**What to build**: bump version, publish.

**Files to touch**:
- `packages/contracts/package.json` — version bump

**Suggested Claude Code prompt**:
> 1. In `packages/contracts/package.json`, bump version from `0.0.1` to `0.1.0` (we added new schemas, that's a minor bump per semver).
> 2. Build: `pnpm --filter @svcar/contracts build`
> 3. Publish: `pnpm --filter @svcar/contracts publish --access restricted --no-git-checks`
> 4. Verify visible: `pnpm view @svcar/contracts version --registry https://npm.pkg.github.com`
> 5. Tag the release: `git tag contracts-v0.1.0 && git push origin contracts-v0.1.0`

**Verification commands**:
```bash
pnpm view @svcar/contracts version --registry https://npm.pkg.github.com
# Expect: 0.1.0
```

**Acceptance criteria**:
- [ ] `@svcar/contracts@0.1.0` published
- [ ] Git tag pushed
- [ ] Commit: `chore: bump contracts to 0.1.0`

---

## Common pitfalls across this phase

- **N+1 queries are a silent killer.** Always check query count for list endpoints. Use Drizzle's `with` loader or a join.
- **Forgot to validate output.** Every endpoint should `.parse()` its response with a contract schema. Catches schema drift early.
- **Cursor pagination off-by-one.** When you fetch `limit + 1`, the cursor is the id of `items[limit - 1]`, not `items[limit]`.
- **Recursive CTE without an upper bound.** If category data has a cycle, the CTE never terminates. Add `WHERE depth < 10` or trust the data.

## What's next

→ Phase 3: [Auth + cart](./phase-3-auth-and-cart.md) — phone OTP, JWT, and server-side cart persistence.
