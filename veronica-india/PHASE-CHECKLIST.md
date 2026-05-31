# Veronica India — Frontend Phase Checklist

> FE-first build against MSW mocks behind `NEXT_PUBLIC_USE_MOCKS`. We own the frontend only.
> Plan of record: `~/.claude/plans/declarative-humming-crystal.md`. Last audited: 2026-05-31.

Legend: `[x]` done · `[~]` partial · `[ ]` to do

---

## Phase 0 — Foundations + MSW  ✅ DONE (commit `1691cbf`, branch `phase-0-foundations`)

### Changes made
- [x] Deps installed: msw, @faker-js/faker, react-hook-form, zod 4, @hookform/resolvers 5, @dnd-kit/{core,sortable,utilities}, sonner, swr, nanoid
- [x] `tsconfig.json` path alias `@veronica/contracts` → `src/contracts/index.ts`
- [x] Local contracts authored: `src/contracts/{common,category,product,home,settings,index}.ts`
- [x] MSW scaffold: `public/mockServiceWorker.js`, `src/mocks/browser.ts`, `src/mocks/node.ts`, `src/instrumentation.ts` (node server, `onUnhandledRequest:'bypass'`)
- [x] `src/mocks/data/categories.ts` + `src/mocks/handlers/categories.ts` + handler barrel
- [x] `src/components/MswProvider.tsx` mounted in `src/app/layout.tsx`
- [x] `src/lib/backend.ts` typed fetcher with `getCategories()`
- [x] Env switch: `.env.local.example` (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_USE_MOCKS`)
- [x] `next.config.ts` image `remotePatterns` (Supabase + placeholder host)
- [x] Verified: typecheck ✓ · 96 tests ✓ · build ✓

### To do
- [ ] Nothing — phase complete and committed.

---

## Phase 1 — Admin UI  ✅ DONE (commit `feat(phase-1)`, branch `phase-1-admin`)

### Changes made
- [x] **Admin MSW mock layer** — `src/mocks/handlers/admin.ts` (full CRUD + auth/upload/orders/audit, token gate, schema validation); data: `src/mocks/data/{products,home,settings}.ts`; barrel wires `adminHandlers`; `admin.test.ts` (7 tests)
- [x] **Auth (step 2)** — `src/store/adminAuthStore.ts` (Zustand + persist → sessionStorage bearer token, `hydrated` flag); `src/lib/admin-api.ts` (authenticated client, schema-validated, 401→clear); `src/lib/admin-hooks.ts` (SWR); `AdminAuthProvider.tsx` (restore + validate)
- [x] **Layout rewrite** — `src/app/admin/layout.tsx`: cookie gate REMOVED; `AdminShell` redirects unauth → `/admin/login?returnTo=`; sonner `<Toaster>`
- [x] **Shell (step 3)** — `Sidebar` (desktop), `BottomNav` (mobile ≥44px tabs, safe-area), `TopBar`, `AdminShell`, shared `nav-items.ts`; brand-black / orange-active
- [x] **Login (step 4)** — `src/app/admin/login/page.tsx`: email+password → token store, inline 401, returnTo
- [x] **Dashboard** — `src/app/admin/page.tsx`: backend-driven via SWR (no more `data.ts`)
- [x] **Products list (step 5)** — card grid, 300ms debounced search (`use-debounced-value.ts`), status+flag filter chips, `StatusPill`, mobile FAB, SWR
- [x] **Product editor (step 6)** — `ProductEditor.tsx` shared new/edit; accordion sections (Basics/Images/Variants/Visibility/Specs/Accessories/Danger); RHF + `zodResolver`; sticky save bar; delete in danger zone
- [x] **Image uploader (step 7)** — `ImageUploader.tsx`: drag-drop + paste + picker, ≤5MB/type validation, `@dnd-kit/sortable` reorder, Primary badge, pending spinners
- [x] **Variants & pricing (step 8)** — `VariantsEditor.tsx` + pure `src/lib/sku-matrix.ts`: no-variants toggle, dimensions add/remove, auto-synced SKU matrix (preserves prices across value add/remove), bulk "set all prices" — 9 unit tests
- [x] **Categories (step 9)** — `src/app/admin/categories/page.tsx`: indented tree, product/sub counts, drawer editor, delete blocked on deps (409 handled)
- [x] **Home composer (step 10)** — `src/app/admin/home/page.tsx`: reorder + toggle 6 sections, Hero/Promo editors, Featured/Category pickers, explicit `PUT /admin/home`
- [x] **Settings (step 11)** — `src/app/admin/settings/page.tsx`: RHF + `SettingsSchema`, sticky save
- [x] **Stubs (step 12)** — `/admin/orders` ("coming later") + `/admin/audit` (minimal list)
- [x] **Removed legacy** — deleted `src/app/api/admin/**`, `ProductForm.tsx`, `DeleteProductButton.tsx` (+ legacy route test)
- [x] Verified: typecheck ✓ · **100 tests** ✓ · production build ✓ · lint clean for new code (no new errors)

### Deliberate simplifications (vs plan — flagged, not silently dropped)
- [ ] **Auto-save** was implemented as an **explicit Save** (sticky bar) for reliability — not 1.5s debounced autosave. Revisit if autosave is desired.
- [ ] **Category reorder** uses **up/down controls** (persisted via `sortOrder` PATCH) instead of `@dnd-kit` drag. (Image reorder DOES use dnd-kit.)
- [x] **Browser smoke test DONE** (Playwright, desktop + 390px): login → dashboard → products → create → categories → home → settings → mobile nav, **10/10, 0 console/page errors**. Caught + fixed a real MSW worker-race fault (commit `2077104`).
- [ ] **Lighthouse** (perf ≥90 / a11y ≥95) still not run — optional polish pass before integration.

---

## Phase 2 — Storefront read-paths  ✅ DONE (commit `20d8475 feat(phase-2)`, branch `phase-2-storefront`)

### Changes made
- [x] Extended `backend.ts`: `getCategoryBySlug` (CategoryWithBreadcrumb), `getCategoryById`, `listProducts` (cursor-paginated), `getProductsByCategory`, `searchProducts`, `getProductBySlug` — all schema-validated, revalidate/tags, client calls `await mocksReady`
- [x] Storefront MSW handlers (`src/mocks/handlers/storefront.ts`) over the same in-memory arrays the admin mutates: `/categories/:slug`, `/categories/by-id/:id`, `/products` (filter/search/paginate), `/products/:slug`
- [x] Home page → `getCategories` + `listProducts({bestseller})/({new})`; `ProductCarousel` now takes `ProductListItem`
- [x] Category page → `CategoryWithBreadcrumb` + `getProductsByCategory`
- [x] PDP → `getProductBySlug` + related; SKU/pricing helpers extracted to `src/lib/sku-helpers.ts` (+ unit tests)
- [x] Search → `backend.searchProducts`; deleted `src/app/api/search/route.ts`; Header search link already live
- [x] Slug fix `/category/health-faucets` → `health-faucet-sets` (Header/Footer/search) + permanent 301 in `next.config.ts`
- [x] Retired in-memory layer: deleted `src/lib/{data,api}.ts` + `data.test.ts` (no importers remain)
- [x] Added `backend.test.ts` + `sku-helpers.test.ts` to offset the retired `data.test.ts`
- [x] **Browser smoke 9/9** (home/category/PDP/search/redirect), **0 console errors, 0 escaped fetches**; admin smoke still 10/10
- [x] Verified: typecheck ✓ · **66 tests** ✓ · `next build` ✓

### Faults found & fixed during testing
- [x] **Build-time prerender crash**: home `/` statically prerendered → fetched the MSW-backed API which isn't reachable in build workers (`ECONNREFUSED`). Made home `force-dynamic` (TODO: ISR once real API is reachable at build).
- [x] **Broken storefront images**: mock data used `placeholder.com`, which serves `text/html` → `next/image` 400'd every image. Repointed all mock images to `placehold.co` (real PNGs).

### Deliberate notes
- [ ] **Lighthouse** (perf ≥90 / a11y ≥95) not run — optional polish.
- [ ] Home is `force-dynamic` for the mock phase; revisit ISR (`revalidate`) when the real API is reachable at build.

### Done-when ✅
No `@/lib/data`/`@/lib/api` imports remain; storefront renders off `backend`; build/tests/smoke pass.

---

## Cross-cutting / known debt
- [x] Duplicate product IDs (4 & 6) — resolved; mock data uses clean sequential ids
- [x] Stale slug `/category/health-faucets` → `health-faucet-sets` — fixed + 301 redirect (Phase 2)
- [x] Mock images were broken (`placeholder.com` serves HTML) — repointed to `placehold.co` (Phase 2)
- [ ] Orphaned Drizzle layer `src/db/**` + `data/veronica.db` — BE owner's concern; now fully dead (data.ts gone)
- [ ] Stray `random.md` (unrelated MoveOps content) — flag for deletion separately

## Open coordination items (flag to BE owner; don't block us)
- [ ] Lock `home_config` section keys: hero, categories, bestsellers, new, featured, promo
- [ ] Confirm Supabase Storage URL pattern for `next/image`
- [ ] Swap local `src/contracts` for published `@veronica/contracts` when ready (one-line alias removal)
- [ ] PDP category-by-id vs by-slug endpoint decision — currently uses `/categories/by-id/:id` (mock); prefer slug on the real API
- [ ] CORS allow-origin for `localhost:3000` against staging
