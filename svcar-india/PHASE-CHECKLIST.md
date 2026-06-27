# Svcar India — Frontend Phase Checklist

> FE-first build against MSW mocks behind `NEXT_PUBLIC_USE_MOCKS`. We own the frontend only.
> Plan of record: `~/.claude/plans/declarative-humming-crystal.md`. Last audited: 2026-05-31.
> **📋 Backend flip list: [INTEGRATION.md](./INTEGRATION.md)** — every mock/seam to swap when the real backend lands.

Legend: `[x]` done · `[~]` partial · `[ ]` to do

---

## Phase 0 — Foundations + MSW  ✅ DONE (commit `1691cbf`, branch `phase-0-foundations`)

### Changes made
- [x] Deps installed: msw, @faker-js/faker, react-hook-form, zod 4, @hookform/resolvers 5, @dnd-kit/{core,sortable,utilities}, sonner, swr, nanoid
- [x] `tsconfig.json` path alias `@svcar/contracts` → `src/contracts/index.ts`
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

## Phase 3 — Auth + Cart  ✅ DONE (commit `baffd2a feat(phase-3)`, branch `phase-3-auth-cart`)

> Built FE-first against MSW (its doc lists the backend as a prereq; we mocked it). Flips to real API at integration.

### Changes made
- [x] Contracts: `auth.ts` (User, OTP, AuthSession, UpdateMe) + `cart.ts` (Cart, ServerCartItem, Add/Update)
- [x] `authStore` (Zustand, **in-memory** access token — never localStorage)
- [x] `backend.ts`: `sendOtp/verifyOtp/refresh/logout/getMe/updateMe` + cart methods + **authenticated fetcher** (Bearer, one refresh-and-retry on 401)
- [x] `AuthProvider`: silent refresh on mount → cart sync
- [x] `/login`: phone → 6-box OTP (auto-advance, paste, `one-time-code` autofill), resend countdown, returnTo
- [x] Auth-aware `Header`: Sign In / account dropdown (Account, My Orders, Logout) / hydration skeleton
- [x] `cartStore`: `serverId` + `syncWithServer` (guest→server merge by SKU on login; optimistic mutation sync)
- [x] `/account` (auth-gated profile, editable name/email) + `/orders` stub
- [x] MSW `account.ts` handlers + data (OTP `123456`, token gate, in-memory cart)
- [x] **Fixed Phase-2 miss**: Header search link was commented out → now live
- [x] **Fixed bug found in smoke**: OTP `onComplete` stale-closure (auto-submit didn't fire) → pass completed code through
- [x] Verified: typecheck ✓ · **72 tests** ✓ (added auth+cart integration suite) · build ✓ · **browser smoke 8/8** (guest-cart-merge, session-survives-reload), 0 console errors

### Faked seams (flip at integration)
- [ ] **Mock refresh**: httpOnly refresh cookie can't be simulated cross-origin (:3000↔:8787) → client keeps a localStorage marker (`MOCK_REFRESH_MARKER`) as the stand-in. Real API uses the cookie (`credentials:"include"` already set); drop the marker.
- [ ] OTP is the fixed code `123456` (no real SMS); `PATCH /me` persistence is in-memory.

---

## Deep audit & fixes (2026-05-31, branch `phase-3-auth-cart`)

4 adversarial review agents swept phases 0–3; findings verified against the code, then the confirmed-impactful ones fixed (FE/mocks only — no backend built).

### Fixed
- [x] **Cart wiped on reload when logged in** — `cartStore.syncWithServer` reconciled to an empty mock server cart. Now reads the server first and pushes only items it lacks (matched by SKU+variant) → restores rather than wipes; also `persist` now strips `serverId` (`partialize`) so a rehydrated guest cart can't PATCH/DELETE stale server line ids. Regression test added (`src/store/cartStore.test.ts`).
- [x] **Server cart leaked across users** — `/auth/logout` mock now clears `serverCart` so the next user doesn't inherit it. (Covered by the new test.)
- [x] **App-wide hang if MSW worker fails to start** — `MswProvider` now `try/finally`-signals `mocksReady`, so a worker-start failure no longer deadlocks every fetch.
- [x] **Storefront nav ignored admin category changes** — `GET /categories` now computes roots live from the shared `categories` array instead of a module-load snapshot.
- [x] **VariantsEditor wiped prices on dimension rename** — renaming now migrates each SKU's `dimensionValues` key so entered prices survive.
- [x] **Category reorder was a no-op after adding categories** (siblings sharing `sortOrder:0`) — reorder now renumbers the sibling list by position (distinct, contiguous) instead of swapping equal scalars.
- [x] **PDP crashed for a 0-image product** — gallery falls back to a placeholder image instead of passing `undefined` to `next/image`.
- [x] Verified: typecheck ✓ · **76 tests** ✓ · `next build` ✓ · browser smoke **auth 9/9 (incl. new cart-survives-reload), storefront 9/9, admin 10/10**, 0 console errors.

### Deferred (documented, not yet fixed — lower impact / real-API-flip)
- [ ] Sparse SKU matrix can strand a selection / add a fallback price (not reachable with current full-cartesian mock data).
- [ ] `authedFetch`: concurrent-401 refresh stampede (no in-flight dedup); post-refresh 401 doesn't `clearAuth`.
- [ ] Admin PATCH handlers don't validate bodies (UI always sends valid data).
- [ ] Search has no in-flight race/AbortController guard.
- [ ] Category page derives parent from `breadcrumb[length-2]` — revisit at flip if the real API returns ancestors-only.
- [ ] Real `204 No Content` → `schema.parse(null)` (mocks always return a body); admin logout doesn't clear SWR cache.

---

## Phase 4 — Razorpay checkout  ✅ DONE (branch `phase-4-checkout`)
> Built FE-first against MSW. Decisions (confirmed with user): **mock Razorpay modal** behind `NEXT_PUBLIC_USE_MOCKS` (real `checkout.razorpay.com` SDK swaps in at integration with no UI rewrite); **GST-inclusive totals** — free ship ≥ ₹5,000 else ₹99, GST 18% shown as an "incl." breakdown, never added on top.

### Changes made
- [x] Contracts: `address.ts` (Address + INDIAN_STATES + label/pincode) + `order.ts` (Order, OrderItem, OrderTotals, OrderListItem, Create/Verify req/resp); wired into the barrel
- [x] Shared money rules in `src/lib/checkout.ts` (subtotal/shipping/GST-inclusive/total) — used by cart, checkout summary AND the mock so they never drift
- [x] `src/lib/razorpay.ts` — `RazorpayOptions`/`RazorpayResponse` types + real-SDK script loader + `window.Razorpay` typing (the swap seam)
- [x] `MockRazorpayModal` — faithful payment sheet (UPI/Card tabs, Pay/processing, "simulate failed payment", dismiss) driving the SAME `handler`/`ondismiss` callbacks as the real SDK
- [x] `backend.ts`: `listAddresses/createAddress/updateAddress/removeAddress` + `createOrder/verifyOrder/getOrders/getOrder` (all authed, schema-validated)
- [x] Mock layer: `data/orders.ts` (per-user addresses + orders, pending-by-Razorpay-id) + `handlers/checkout.ts` (address CRUD, `/checkout/order`, `/checkout/verify` → clears cart, paginated `/me/orders`, `/me/orders/:num`)
- [x] Components: `AddressForm` (validated, Indian-states dropdown, default handling), `AddressList` (radio-select + edit/delete), `CheckoutSummary`, `PayButton` (createOrder → modal/SDK → verify → success, WhatsApp fallback on failure)
- [x] Pages: `/checkout` (auth-gated, 2-col, server-cart source of truth, empty→/cart redirect), `/orders/[orderNumber]` (detail + `?just=paid` one-time celebration + 404 state), `/orders` (history, cursor "load more", empty state)
- [x] Cart CTA rewired: **Proceed to checkout** (primary; "Sign in to checkout" for guests) + WhatsApp now secondary; delivery fee aligned to shared ₹99 rule
- [x] Verified: typecheck ✓ · **91 tests** ✓ (added `checkout.test.ts` + `backend-checkout.test.ts`) · `next build` ✓ · browser smoke **checkout 10/10** (guest→login→address→pay→success→history→cart-cleared), auth 9/9 · store 9/9 · admin 10/10, 0 console errors

### Faked seams (flip at integration)
- [ ] **Payment**: the mock modal stands in for Razorpay's hosted checkout. Flip `USE_MOCKS=false` → `PayButton` loads the real SDK; `createOrder`/`verifyOrder` then hit the real backend (which talks to Razorpay + verifies the signature server-side). No UI changes needed.
- [ ] **Order/address persistence is in-memory** (resets on a hard reload, like the cart) — a real backend persists. Order history is reachable via client-side nav within a session.
- [ ] Razorpay key is `rzp_test_mockkey`; real test KEY_ID provided at integration.

## Phase 5 — Caching + observability  ✅ DONE (branch `phase-5-caching`)
> Thin FE slice (the heavy caching/infra is backend's). User-confirmed: **env-gated `@sentry/nextjs`** (inert until a DSN is set) + **Vercel Analytics + Speed Insights** (no-ops off Vercel).

### Changes made
- [x] **5.1 ISR tag audit** (`backend.ts`): standardized public-read tags to the convention the backend will call — `categories` · `category-<slug>` · `category-id-<id>` · `products` · `category-products-<slug>` · `product-<slug>`; `listProducts` now `revalidate:600` + per-category tag; authed methods (`authedFetch`, `postJson`) set `cache:"no-store"`
- [x] **5.2 `/api/revalidate`** route handler: POST, `x-revalidate-secret` header (401 on mismatch, 503 if `REVALIDATE_SECRET` unset), `{tags:[]}` body (400 if missing) → `revalidateTag(tag,{expire:0})` per tag → `{revalidated,tags,now}`. Verified via curl: 200/401/400.
- [x] **5.3 Sentry (env-gated)**: installed `@sentry/nextjs` (v10); `src/lib/sentry.ts` (DSN gate + `beforeSend` PII scrub of otp/token/phone/password params); `instrumentation-client.ts` (client init, replay OFF); `instrumentation.ts` extended (server/edge init alongside MSW) + `onRequestError`; `app/global-error.tsx` reports render crashes. **Off until `NEXT_PUBLIC_SENTRY_DSN` is set** — nothing inits, no events.
- [x] **5.4 Vercel Analytics + Speed Insights**: mounted in root layout (no-ops off Vercel)
- [x] Env: added `REVALIDATE_SECRET` + `NEXT_PUBLIC_SENTRY_DSN` to `.env.local.example`
- [x] Verified: typecheck ✓ · **91 tests** ✓ · `next build` ✓ · revalidate curl 200/401/400 ✓ · browser smoke store 9/9 · admin 10/10 · auth 9/9 · checkout 10/10, 0 console errors

### Seams / not finishable FE-only (documented)
- [ ] **Home ISR**: stays `force-dynamic` under mocks (build-time fetch to MSW fails); flip to `revalidate` once the real API is reachable at build (Phase 2 note).
- [ ] **5.5 production cache-hit ≥80%**: needs a real deploy — verify `x-vercel-cache` HIT on `/`, `/product/*`, `/category/*` and NO caching on `/account`,`/cart`.
- [ ] **Next 16 `revalidateTag(tag,{expire:0})`**: new Cache Components signature; verify invalidation against real traffic at integration.
- [ ] **Sentry source maps**: add `withSentryConfig` + `SENTRY_AUTH_TOKEN` at integration for readable stack traces.
- [ ] Backend must call `POST /api/revalidate` with the shared secret after product/category mutations.

## Phase 6 — Search + polish / SEO  ✅ DONE (branch `phase-6-search-polish`)
> SEO + UX finishing pass. Production domain is env-driven (`NEXT_PUBLIC_SITE_URL`, default svcarindia.com); two new backend endpoints mocked (pincode, order events).

### Changes made
- [x] **6.1 sitemap + robots** — `src/app/sitemap.ts` (static + all categories + active products; **graceful try/catch** so a mock-mode build degrades to static pages instead of failing) + `src/app/robots.ts` (allows `/`, disallows account/checkout/admin/api, sitemap URL). `src/lib/site.ts` = `SITE_URL` helper; `layout.tsx` `metadataBase` now env-driven.
- [x] **6.2 JSON-LD + product metadata** — product page: `generateMetadata` (title/description/canonical/OG) + Schema.org `Product` JSON-LD (AggregateOffer from sku-helpers)
- [x] **6.3 OG images** — `product/[slug]/opengraph-image.tsx` (1200×630 branded card via `next/og`, product image + name + price, safe fallback). Verified: 200 image/png 1200×630.
- [x] **6.4 Pincode autofill** — contract `PincodeLookup` + mock `data/pincodes.ts` (~12 metros) + `GET /pincode/:pincode` handler + `backend.lookupPincode` + `AddressForm` debounced (400ms) autofill (won't overwrite typed fields; 404 → non-blocking hint)
- [x] **6.5 Order tracking timeline** — contract `OrderEvent` + `GET /me/orders/:num/events` mock (derived from status) + `backend.getOrderEvents` + `OrderTimeline` component (completed=orange, upcoming=grey) on the order detail page
- [x] **6.6 Empty states + custom 404 + search race fix** — on-brand `(store)/not-found.tsx` (renders with Header/Footer chrome); audited cart/orders/search/category empty states (all present); added latest-wins request guard to search; `sr-only` h1 on search
- [x] **6.7 a11y/SEO pass** — verified all 14 `<Image>` have alt + 29 aria-labels; added search h1; SEO surfaces (metadata/JSON-LD/sitemap) boost SEO score
- [x] Env: `NEXT_PUBLIC_SITE_URL` added to `.env.local.example`
- [x] Verified: typecheck ✓ · **94 tests** ✓ (+pincode, +order-events) · `next build` ✓ (robots/sitemap/OG/JSON-LD routes) · curl robots+sitemap(23 urls)+OG(png)+JSON-LD ✓ · browser smoke store 9/9 · admin 10/10 · auth 9/9 · checkout 10/10, 0 console errors

### Seams / can't finish FE-only (documented in INTEGRATION.md)
- [ ] **6.7 Lighthouse** perf ≥90 / a11y ≥95 / SEO ≥95 — needs a real deploy + clean profile (the doc itself notes preview ≠ prod); did the static a11y/SEO fixes
- [ ] **6.8 Launch checklist** — deploy/ops only (Razorpay live keys, prod env, CORS, domain, GSC sitemap submit) → all in INTEGRATION.md §0/§4/§10
- [ ] Pincode mock covers ~12 metros — real backend needs the full PIN dataset
- [ ] Order events are derived from status (mock); real backend emits real fulfilment events

---

## Cross-cutting / known debt
- [x] Duplicate product IDs (4 & 6) — resolved; mock data uses clean sequential ids
- [x] Stale slug `/category/health-faucets` → `health-faucet-sets` — fixed + 301 redirect (Phase 2)
- [x] Mock images were broken (`placeholder.com` serves HTML) — repointed to `placehold.co` (Phase 2)
- [ ] Orphaned Drizzle layer `src/db/**` + `data/svcar.db` — BE owner's concern; now fully dead (data.ts gone)
- [ ] Stray `random.md` (unrelated MoveOps content) — flag for deletion separately

## Open coordination items (flag to BE owner; don't block us)
- [ ] Lock `home_config` section keys: hero, categories, bestsellers, new, featured, promo
- [ ] Confirm Supabase Storage URL pattern for `next/image`
- [ ] Swap local `src/contracts` for published `@svcar/contracts` when ready (one-line alias removal)
- [ ] PDP category-by-id vs by-slug endpoint decision — currently uses `/categories/by-id/:id` (mock); prefer slug on the real API
- [ ] CORS allow-origin for `localhost:3000` against staging
