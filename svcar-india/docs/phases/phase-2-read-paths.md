# Phase 2 (Frontend) — Read Paths

> Renumbered from Phase 1 → Phase 2 on 2026-05-28 (Admin moved to Phase 1). Internal references to "Phase 2" inside this doc refer to the *next* phase (now Phase 3 Auth+Cart).

## What you'll build

Swap every catalog read on the storefront from the in-memory `src/lib/data.ts` to fetch calls against the real `svcar-api`. After this phase, deleting `data.ts` doesn't break anything.

You'll also fix the long-standing `/category/health-faucets` → `/category/health-faucet-sets` slug mismatch, un-comment the search link in the header, and wire ISR caching with revalidation tags.

## Prerequisites

- [ ] Backend Phase 1 complete — API is deployed to staging with `/categories`, `/categories/:slug`, `/products`, `/products/:slug`, `/products/by-category/:slug`, `/search`
- [ ] `@svcar/contracts@0.1.0` published to GitHub Packages
- [ ] Backend staging URL known (e.g. `https://svcar-api-staging.workers.dev` or `https://svcar-api.fly.dev`)
- [ ] Frontend Phase 0 complete (renamed repo, stub `src/lib/backend.ts` exists)

## Success criteria

- Every Server Component fetch in `src/app/(store)/**` reads from the backend, not from `lib/data.ts`
- All existing pages render identically to before (no visual regressions)
- `/category/health-faucet-sets` works; `/category/health-faucets` redirects to it (no 404)
- Search page works end-to-end against the backend
- Page reload after admin edit (when admin is wired in Phase 4) will show the change — wire up `revalidateTag` calls now even though admin won't trigger them until Phase 4
- `pnpm test` passes
- Lighthouse perf score ≥ 90 on `/` and `/product/[slug]`

## Estimated effort

1-2 sessions (~5 hours).

---

## Task 1.1 — Update `@svcar/contracts` and extend `src/lib/backend.ts`

**Context**: The contracts package was bumped in backend Phase 1. We need to install the new version and extend our backend client to cover the new endpoints.

**Files to touch**:
- `package.json` — bump `@svcar/contracts` to `^0.1.0`
- `src/lib/backend.ts` — add methods for new endpoints
- `.env.local` — set `NEXT_PUBLIC_API_URL` to the staging URL

**Suggested Claude Code prompt**:
> Bump `@svcar/contracts` to `^0.1.0` in `package.json`, run `pnpm install`. Verify the new schemas (`CategoryWithBreadcrumbSchema`, `ProductSchema`, `ProductListItemSchema`) are exported from `@svcar/contracts`.
>
> Then extend `src/lib/backend.ts` with these methods (all return Promises, all validate with the corresponding schema):
>
> - `getCategories()` — already exists, no change
> - `getCategoryBySlug(slug)` — calls `/categories/:slug`, parses `CategoryWithBreadcrumbSchema`
> - `listProducts(params)` — calls `/products` with query params, parses `{ items: ProductListItem[], nextCursor: number | null }`
> - `getProductBySlug(slug)` — calls `/products/:slug`, parses `ProductSchema`
> - `getProductsByCategory(slug)` — calls `/products/by-category/:slug`, parses items
> - `searchProducts(query)` — calls `/search?q=`, parses items
>
> All methods should:
> - Use `fetch` with `next: { revalidate: 3600, tags: [...] }` for ISR caching
> - Tag list endpoints with `["products", "category-${slug}"]` etc.
> - Tag detail endpoints with `["product-${slug}"]`
> - Throw a descriptive error if response is non-2xx
> - Validate the response body via the contracts schema before returning

**Verification commands**:
```bash
pnpm install
pnpm typecheck
# Expect: no errors

# Sanity-check a method by adding a one-off page or test:
# (We'll properly use these in Tasks 1.2+)
```

**Acceptance criteria**:
- [ ] `@svcar/contracts@^0.1.0` installed
- [ ] `src/lib/backend.ts` has 6 methods
- [ ] All methods are typed against contract schemas
- [ ] All methods use `next.tags` for ISR
- [ ] `pnpm typecheck` passes
- [ ] Commit: `feat(phase-1): extend backend client with category/product/search methods`

**Pitfalls**:
- `next: { tags: [...] }` only works in Server Components. If a client component uses this fetch, it'll error.
- The schema parse can throw if the API response doesn't match. Bubble the error up; don't swallow it.

---

## Task 1.2 — Swap home page to fetch from backend

**Context**: The home page currently calls `getCategories()`, `getBestsellers()`, `getNewArrivals()` from `src/lib/api.ts` (which wraps `src/lib/data.ts`). Replace these with backend calls.

**Files to touch**:
- `src/app/(store)/page.tsx`

**Suggested Claude Code prompt**:
> In `src/app/(store)/page.tsx`, replace all imports from `@/lib/api` with calls through `backend` from `@/lib/backend`. Specifically:
>
> - `getCategories()` → `backend.getCategories()`
> - `getBestsellers()` → `backend.listProducts({ bestseller: 1, limit: 4 })` (extract `.items`)
> - `getNewArrivals()` → `backend.listProducts({ new: 1, limit: 4 })` (extract `.items`)
>
> The existing `<ProductCarousel products={...}>` component might expect the old `Product` shape (full with skus/dimensions). We're now passing `ProductListItem[]` (no skus, but with `minPrice`/`maxBasePrice`/`bestDiscount` pre-computed). Update `ProductCarousel` (and downstream `ProductCard`) props to accept the lighter shape — the pricing fields are already computed server-side now, so the client doesn't need to recompute.
>
> Don't change visual layout. The render output should be identical.
>
> Verify by running `pnpm dev` and visiting `http://localhost:3000`.

**Verification commands**:
```bash
pnpm dev
# Browser: http://localhost:3000
# - Hero loads
# - "Shop by Category" shows 4 categories
# - "Our Bestsellers" shows 4 product cards
# - "New Arrivals" shows new products
# - No console errors

pnpm typecheck
pnpm test
```

**Acceptance criteria**:
- [ ] Home page renders identically to before
- [ ] All data comes from `backend.*` methods, not `@/lib/api` or `@/lib/data`
- [ ] No console errors in DevTools
- [ ] `pnpm typecheck` passes
- [ ] Lighthouse perf ≥ 90 on `/`
- [ ] Commit: `feat(phase-1): home page reads from backend`

---

## Task 1.3 — Swap category pages

**Context**: `/category/[slug]` is the second most-trafficked page. Replace its in-memory reads with backend calls.

**Files to touch**:
- `src/app/(store)/category/[slug]/page.tsx`
- `src/components/store/CategoryProductGrid.tsx` (if it expected the old shape)

**Suggested Claude Code prompt**:
> In `src/app/(store)/category/[slug]/page.tsx`, replace the imports from `@/lib/api` with `backend` from `@/lib/backend`:
>
> - `getCategoryBySlug(slug)` → `backend.getCategoryBySlug(slug)` (now returns the category WITH breadcrumb and children pre-computed by the server)
> - `getCategoryChildren(id)` → use `category.children` from the backend response
> - `getCategoryBreadcrumb(id)` → use `category.breadcrumb` from the backend response
> - `getProductsByCategory(slug)` → `backend.getProductsByCategory(slug)`
> - `getProductsByDirectCategory(id)` → not needed; the backend `/products/by-category/:slug` already handles both leaf and parent cases
> - `getCategories()` → `backend.getCategories()` for the sidebar
>
> Update `CategoryProductGrid` and downstream components to consume `ProductListItem[]` shape (with pre-computed `minPrice`, etc.).
>
> Test all 4 root categories + at least 2 subcategories visually. Don't break the mobile category tab strip or the desktop sidebar.

**Verification commands**:
```bash
pnpm dev
# Visit each in browser:
# - /category/kitchen-sinks
# - /category/single-bowl
# - /category/double-bowl
# - /category/health-faucet-sets
# - /category/abs-faucets
# - /category/bathroom-accessories
# - /category/plumbing-fittings

# For each:
# - Breadcrumb correct
# - Sidebar shows root categories
# - Subcategory pills (if any) show
# - Products render
# - No console errors

pnpm typecheck
```

**Acceptance criteria**:
- [ ] All category routes render correctly
- [ ] Breadcrumb is correct for nested categories
- [ ] Subcategory pills show on parent categories
- [ ] No data comes from `@/lib/data` anymore (grep to confirm)
- [ ] `pnpm typecheck` passes
- [ ] Commit: `feat(phase-1): category pages read from backend`

---

## Task 1.4 — Swap product detail page

**Context**: Product detail page (PDP) is the deepest read — it uses dimensions, SKUs, attributes, and related products. Most complex swap in this phase.

**Files to touch**:
- `src/app/(store)/product/[slug]/page.tsx`
- `src/components/store/ProductPageClient.tsx` (may need prop tweaks)

**Suggested Claude Code prompt**:
> In `src/app/(store)/product/[slug]/page.tsx`:
>
> 1. Replace `getProductBySlug(slug)` with `backend.getProductBySlug(slug)`. Returns the full `Product` shape with dimensions, skus, images, specs, accessories.
> 2. Replace `getCategoryById(product.categoryId)` with a backend call — add `backend.getCategoryById(id)` if it doesn't exist (we may need a new endpoint, see Pitfalls). Actually, since `/categories/:slug` is what we have, prefer fetching by slug if you know it; otherwise add `backend.getCategoryById(id)`.
> 3. For related products: `backend.getProductsByCategory(category.slug)` and filter out the current product, take 4.
> 4. Build breadcrumb the same way as before but using the backend-returned data.
>
> No visual changes. The page should look identical.
>
> Click through several products: those with single-dimension variants, multi-dimension, no variants, with/without spec tables.

**Verification commands**:
```bash
pnpm dev
# Browser, test products:
# /product/lavender-imported-range-single-bowl (3 SKUs, 1 dimension "Overall Size")
# /product/jasmine-single-bowl-sink (multi-dimension: Size + Weight, 8 SKUs)
# /product/svcar-brass-health-faucet-set (no dimensions, single SKU)

# For each:
# - All images load
# - Variant pills work (clicking changes price)
# - Cascading availability works (selecting one dimension limits the next)
# - Specs table renders
# - Related products show
# - No console errors

pnpm typecheck
pnpm test
```

**Acceptance criteria**:
- [ ] PDP works for all product variant shapes
- [ ] Variant selection works (price changes per SKU)
- [ ] Specs table renders correctly
- [ ] Related products section populated
- [ ] No `@/lib/data` imports in product page or PDP component
- [ ] Commit: `feat(phase-1): product detail page reads from backend`

**Pitfalls**:
- We may need a `GET /categories/by-id/:id` endpoint on the backend if the product page needs category info by id. [TODO confirm with backend intern — add the endpoint or refactor to use slug everywhere.]
- The `getSKUBySelections` and `getAvailableValues` helpers currently live in `@/lib/data`. They should move to `@/lib/sku-helpers.ts` as pure client-side functions operating on the `Product` shape — they don't need backend access since the data is already loaded.

---

## Task 1.5 — Wire up search page

**Context**: The `/search` page exists but is currently unreachable from the header (the link is commented out). After this task: search is live and reachable.

**Files to touch**:
- `src/app/(store)/search/page.tsx`
- `src/app/api/search/route.ts` — delete this (replaced by backend endpoint)
- `src/components/store/Header.tsx` — uncomment the search link

**Suggested Claude Code prompt**:
> 1. In `src/app/(store)/search/page.tsx`, replace the `fetch("/api/search?q=...")` call with `backend.searchProducts(query)`. Use the same debounce pattern.
>
> 2. Delete `src/app/api/search/route.ts` — we don't need a Next.js API route anymore; the frontend talks to the backend directly.
>
> 3. In `src/components/store/Header.tsx`, uncomment the Search link (currently around line 89). Verify it shows on both mobile and desktop nav.
>
> 4. Test: type "sink", "rustproof", "xyz" — confirm debounced search, results, and empty state.

**Verification commands**:
```bash
pnpm dev
# Browser:
# - Header shows search icon (desktop) and entry in mobile menu
# - Click search icon → land on /search
# - Type "sink" — results appear after ~300ms
# - Type "rustproof" — products tagged RustProof appear
# - Type "xyzxyz" — empty state appears
# - Backspace to empty — back to "Popular Categories" view

pnpm typecheck
```

**Acceptance criteria**:
- [ ] `src/app/api/search/route.ts` deleted
- [ ] Search calls hit the backend `/search` endpoint
- [ ] Search link visible in header
- [ ] Debounce still works (~300ms)
- [ ] Empty state, results, and trending searches all work
- [ ] Commit: `feat(phase-1): wire search to backend, expose in header`

---

## Task 1.6 — Fix the `/category/health-faucets` slug mismatch

**Context**: Header, footer, and search page popular-categories all link to `/category/health-faucets`. But the actual category slug is `health-faucet-sets`. This is a 404 today. Pick one and align.

**Decision**: keep the canonical slug `health-faucet-sets` (matches backend seed). Redirect the old one.

**Files to touch**:
- `next.config.ts` — add a redirect
- `src/components/store/Header.tsx` — already commented; once uncommented in 1.5, links should point at the right slug
- `src/components/store/Footer.tsx`
- `src/app/(store)/search/page.tsx` (popular categories list)

**Suggested Claude Code prompt**:
> Two changes:
>
> 1. Update all hardcoded references to `/category/health-faucets` → `/category/health-faucet-sets` in:
>    - `src/components/store/Header.tsx`
>    - `src/components/store/Footer.tsx`
>    - `src/app/(store)/search/page.tsx` (the popular-categories block)
>    - Anywhere else `grep -rn "/category/health-faucets" src/` finds.
>
> 2. Add a 301 redirect in `next.config.ts`:
>    ```ts
>    async redirects() {
>      return [
>        {
>          source: "/category/health-faucets",
>          destination: "/category/health-faucet-sets",
>          permanent: true,
>        },
>      ];
>    },
>    ```
>
> This protects any external links / bookmarks that already exist.

**Verification commands**:
```bash
grep -rn "/category/health-faucets[^-]" src/
# Expect: no results (or only in next.config.ts as the redirect source)

pnpm dev
# Browser:
# - /category/health-faucets → redirects to /category/health-faucet-sets
# - Header link → /category/health-faucet-sets directly
# - Footer link → /category/health-faucet-sets directly
```

**Acceptance criteria**:
- [ ] No hardcoded `/category/health-faucets` in source (except the redirect rule)
- [ ] Old URL redirects correctly with 301
- [ ] Commit: `fix(phase-1): use canonical health-faucet-sets slug, redirect old URL`

---

## Task 1.7 — Delete the in-memory data layer

**Context**: After all reads route through `backend.*`, the old `src/lib/data.ts` and `src/lib/api.ts` are dead code. Delete them. Move any pure helpers (SKU selection logic) into their own file.

**Files to touch**:
- `src/lib/sku-helpers.ts` (new — moved from data.ts: `getSKUBySelections`, `getAvailableValues`, possibly `getMinPrice`, `getMaxBasePrice`, `getBestDiscount` if still needed client-side)
- `src/lib/data.ts` — delete
- `src/lib/api.ts` — delete
- `src/lib/data.test.ts` — delete (the BE tests cover this surface now)
- All imports of `@/lib/data` or `@/lib/api` — update to `@/lib/sku-helpers` or `@/lib/backend`

**Suggested Claude Code prompt**:
> 1. Identify pure functions in `src/lib/data.ts` that don't touch the categories/products arrays — specifically `getSKUBySelections`, `getAvailableValues`, `getMinPrice`, `getMaxBasePrice`, `getBestDiscount`. Move them to a new `src/lib/sku-helpers.ts` with the same exports. They should accept `Product` (now from `@svcar/contracts`) as input.
>
> 2. Update all imports across `src/` that point at `@/lib/data` or `@/lib/api` to use `@/lib/sku-helpers` or `@/lib/backend` as appropriate. Find them with `grep -rn "@/lib/data\|@/lib/api" src/`.
>
> 3. Delete `src/lib/data.ts`, `src/lib/api.ts`, `src/lib/data.test.ts`.
>
> 4. Delete the admin pages that depend on the old mutation functions (`src/app/admin/products/page.tsx`, `src/app/admin/categories/page.tsx`, etc.) — they're broken now and will be rebuilt in Phase 4. Leave a stub `/admin` page that says "Under reconstruction".
>
> 5. Delete `src/app/api/admin/**` routes — also will be rebuilt in Phase 4.
>
> 6. Run `pnpm typecheck` and `pnpm test`. Fix any remaining errors.

**Verification commands**:
```bash
# Should find nothing:
grep -rn "from \"@/lib/data\"" src/
grep -rn "from \"@/lib/api\"" src/

ls src/lib/
# Expect: backend.ts, sku-helpers.ts, utils.ts, utils.test.ts (and maybe a few others — but NO data.ts or api.ts)

pnpm typecheck
pnpm test
pnpm dev
# Click through entire storefront — should still work
```

**Acceptance criteria**:
- [ ] `src/lib/data.ts`, `src/lib/api.ts`, `src/lib/data.test.ts` deleted
- [ ] `src/lib/sku-helpers.ts` exists with the pure helpers
- [ ] No source file imports from the deleted modules
- [ ] Admin pages stubbed (will be rebuilt in Phase 4)
- [ ] Admin API routes deleted (will be rebuilt in Phase 4)
- [ ] `pnpm typecheck` and `pnpm test` pass
- [ ] Storefront still works
- [ ] Commit: `refactor(phase-1): retire in-memory data layer`

---

## Task 1.8 — Smoke test + Lighthouse

**Context**: Final sanity check for the phase.

**What to do**:

**Suggested Claude Code prompt**:
> Run a full smoke test:
>
> 1. `pnpm build && pnpm start` (production-mode build)
> 2. Click through: home, each root category, 3 product pages (one with single dimension, one with multi-dimension, one with no variants), cart (empty), search ("sink", "rustproof", "xyz"), /about, /category/health-faucets (verify redirect).
> 3. For each, check DevTools console for errors.
> 4. Run Lighthouse on `/` and `/product/lavender-imported-range-single-bowl`. Report scores.
> 5. Check Network tab: API calls go to `NEXT_PUBLIC_API_URL`, not to `/api/*` (we deleted those).

**Verification commands**:
```bash
pnpm build
pnpm start
# Manual browser walkthrough as above
```

**Acceptance criteria**:
- [ ] All pages load without console errors
- [ ] Network panel shows API calls to backend, not to old `/api/*` routes
- [ ] Lighthouse on `/`: perf ≥ 90, a11y ≥ 95, best-practices ≥ 90, SEO ≥ 90
- [ ] Lighthouse on PDP: perf ≥ 85 (images are heavier), a11y ≥ 95
- [ ] Phase 1 status updated in `docs/phases/README.md`
- [ ] Commit: any pending fixes, then merge to `main`

---

## Common pitfalls across this phase

- **Server Components vs Client Components**: `backend.*` calls only work in Server Components (because `next.tags` requires it). Client components must receive data as props.
- **The `images` field** on `ProductListItem` is required (non-empty array). If a seed product has no images, the API will fail to validate. Confirm with the BE intern and add a placeholder image if needed.
- **CORS**: when calling the deployed API from `localhost:3000`, the API needs `Access-Control-Allow-Origin: http://localhost:3000`. If you see CORS errors, ping the BE intern to add CORS middleware.
- **Don't break SEO**: the canonical slug change (health-faucets → health-faucet-sets) should be a 301 (permanent), not 302.

## What's next

→ Phase 3: [Auth + cart](./phase-3-auth-and-cart.md) — phone OTP login and server-side cart sync.
