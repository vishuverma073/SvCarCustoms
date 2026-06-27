# Svcar Frontend — Backend Integration Runbook

> **Single source of truth for the mock → real-backend flip.**
> Everything below is **currently working against MSW mocks** (FE Phases 0–5: typecheck + 91 tests + browser smokes all green). Nothing here is broken — each item is a *seam* that swaps to the real backend later. When the backend lands, work this list top-to-bottom.
>
> Owner split: **we own the frontend**; a separate dev owns the backend (`svcar-api`). Last updated: 2026-05-31 (after Phase 5).

---

## 0. The master switch (do this first)

| What | Now (mock) | At integration |
|---|---|---|
| `NEXT_PUBLIC_USE_MOCKS` | `true` → MSW intercepts every API call | set **`false`** → all calls hit the real API |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8787` (just the origin MSW pretends to be) | set to the real staging/prod API origin |

Files that read these: [src/lib/api-config.ts](src/lib/api-config.ts). With `USE_MOCKS=false`, MSW never starts ([MswProvider.tsx](src/components/MswProvider.tsx), [instrumentation.ts](src/instrumentation.ts)) and `await mocksReady` resolves instantly — the mock layer becomes inert. You can delete `src/mocks/**` once stable.

**CORS:** the real API must allow the FE origin (`localhost:3000` in dev, prod domain later) with `credentials` (cookies) enabled.

---

## 1. Contracts (the shape guarantee)

- **Now:** local zod schemas in `src/contracts/*`, exposed as `@svcar/contracts` via a **tsconfig path alias** ([tsconfig.json](tsconfig.json) `paths`).
- **At integration:** `npm i @svcar/contracts`, then **delete the alias + the `src/contracts/` folder**. Module resolution falls through to the package — zero import-site edits. TypeScript then flags any drift between our assumed shapes and the real package at compile time.
- ⚠️ The real API responses **must match these shapes** (every response is `zod.parse`d in [src/lib/backend.ts](src/lib/backend.ts), so a mismatch fails loudly). Section 8 lists the full endpoint surface.

---

## 2. Customer auth (phone OTP)  — `src/lib/backend.ts`, `src/mocks/handlers/account.ts`

| Seam | Now (mock) | At integration |
|---|---|---|
| OTP code | fixed **`123456`**; `/auth/otp/send` returns it as `devHint` | real SMS; drop `devHint` |
| Access token | string `"mock-user-token"`, kept in-memory ([authStore](src/store/authStore.ts)) | real short-lived JWT; keep in memory (no change) |
| Refresh | **localStorage marker** `svcar-mock-refresh` (the phone), replayed to `/auth/refresh` because a cross-origin httpOnly cookie can't be simulated. See `MOCK_REFRESH_MARKER` in [backend.ts](src/lib/backend.ts) | real **httpOnly refresh cookie** (`credentials:"include"` is already set). **Delete** writeMarker/readMarker/clearMarker + the `USE_MOCKS ? {phone} : {}` branch in `doRefresh()` |
| Auth bypass | mock `/auth/refresh` accepts any phone (dev convenience) | real backend validates the cookie/session |

**Hardening to revisit (deferred, documented in PHASE-CHECKLIST):** in-flight refresh de-dup (concurrent 401s), `clearAuth()` on a post-refresh 401.

---

## 3. Admin auth  — `src/mocks/handlers/admin.ts`, `src/store/adminAuthStore.ts`

| Seam | Now (mock) | At integration |
|---|---|---|
| Credentials | `admin@test.local` / `admin123` → token `"mock-token"` (`MOCK_EMAIL/PASSWORD/TOKEN` in [settings.ts](src/mocks/data/settings.ts)) | real admin login; same `POST /admin/login {email,password} → {accessToken, admin}` shape |
| Token storage | sessionStorage (Bearer) — fine as-is | unchanged |
| ⚠️ Question for backend | — | confirm admin auth is **bearer token**, not a static API key header. If it's an API-key scheme, adjust [admin-api.ts](src/lib/admin-api.ts) |

---

## 4. Payments — Razorpay  — `src/lib/razorpay.ts`, `src/components/checkout/PayButton.tsx`, `MockRazorpayModal.tsx`

| Seam | Now (mock) | At integration |
|---|---|---|
| Payment UI | **`MockRazorpayModal`** (faithful sheet, "simulate success/failure") shown when `USE_MOCKS` | real `checkout.razorpay.com` SDK auto-loads via `loadRazorpay()` — **no UI rewrite** (same `handler`/`ondismiss` callbacks) |
| Order create | mock `/checkout/order` returns `razorpayKeyId: "rzp_test_mockkey"` + fake `order_<num>` | real backend creates a Razorpay order, returns the real test/live `KEY_ID` + `razorpayOrderId` |
| Verify | mock `/checkout/verify` trusts any signature | real backend **verifies the signature server-side** + reconciles via webhook |
| Payment id | `pay_mock_<rand>` from the modal | real `razorpay_payment_id` |

**Need from you / backend:** Razorpay test-mode `KEY_ID` (public, safe in client). Backend Phase 3 endpoints `/checkout/order` + `/checkout/verify` + the Razorpay webhook must exist.

---

## 5. Data persistence (in-memory → real DB)

All mock state lives in memory and **resets on a hard page reload** (a real DB persists). Within a session (client-side nav) everything works; the unit tests prove the handler logic. No FE change needed — just real persistence behind the same endpoints.

| Data | Mock store | Endpoints |
|---|---|---|
| Cart | `serverCart` ([account.ts](src/mocks/data/account.ts)); cleared on logout/order | `/me/cart*` |
| Addresses | per-user Map ([orders.ts](src/mocks/data/orders.ts)) | `/me/addresses*` |
| Orders | per-user Map + pending-by-Razorpay-id | `/checkout/*`, `/me/orders*` |
| Products / categories / home / settings | mutable arrays the admin edits + storefront reads | `/admin/*`, public reads |

---

## 6. Image upload + storage  — `src/lib/admin-api.ts` (`uploadImage`), `src/mocks/handlers/admin.ts`

- **Now:** `POST /admin/upload` returns a **placehold.co** URL (no real file stored). All mock catalog images are `placehold.co` PNGs.
- **At integration:** real upload to Supabase Storage (or chosen bucket) returning the real public URL. Confirm the **Supabase Storage URL pattern** and add its hostname to `images.remotePatterns` in [next.config.ts](next.config.ts) (already allows `*.supabase.co` + `placehold.co`).

---

## 7. Caching + observability (Phase 5)

| Seam | Now | At integration |
|---|---|---|
| ISR revalidation webhook | [/api/revalidate](src/app/api/revalidate/route.ts) live; returns **503** until `REVALIDATE_SECRET` is set | set `REVALIDATE_SECRET`; **backend must POST it** with `{tags:[...]}` after every product/category mutation. Tag names: `categories`, `category-<slug>`, `category-id-<id>`, `products`, `category-products-<slug>`, `product-<slug>` |
| Next 16 `revalidateTag` | uses new Cache-Components signature `revalidateTag(tag,{expire:0})` | verify invalidation against real traffic |
| Home page caching | `force-dynamic` ([src/app/(store)/page.tsx](src/app/(store)/page.tsx)) because build-time fetch to MSW fails | flip to ISR (`export const revalidate = 3600`) once the real API is reachable at build |
| Sentry | `@sentry/nextjs` wired but **OFF** until `NEXT_PUBLIC_SENTRY_DSN` is set; PII scrubbed | paste DSN; add `withSentryConfig` + `SENTRY_AUTH_TOKEN` for **source-map upload** (readable stack traces) |
| Vercel Analytics / Speed Insights | mounted, no-op off Vercel | real data once deployed on Vercel |
| Prod cache-hit ≥80% (Task 5.5) | un-testable under mocks | verify `x-vercel-cache: HIT` on `/`, `/product/*`, `/category/*`; confirm **no** caching on `/account`, `/cart` |

---

## 8. Endpoint surface the backend must implement

The exact contract every mock handler answers (paths relative to `NEXT_PUBLIC_API_URL`). Shapes = the `@svcar/contracts` schemas.

**Public (storefront, GET, ISR-cacheable):**
- `GET /categories` → `Category[]` (roots only)
- `GET /categories/:slug` → `CategoryWithBreadcrumb`
- `GET /categories/by-id/:id` → `CategoryWithBreadcrumb`  *(prefer slug on real API — coordination item)*
- `GET /products?category&bestseller&new&featured&q&limit&cursor` → `{ items: ProductListItem[], nextCursor }`
- `GET /products/:slug` → `Product`
- `GET /pincode/:pincode` → `{ pincode, city, state }` *(Phase 6 — address autofill; 404 if unknown; mock covers ~12 metros)*

**Customer auth + profile:**
- `POST /auth/otp/send {phone}` → `{ sent }`
- `POST /auth/otp/verify {phone, code}` → `{ accessToken, user }`
- `POST /auth/refresh` *(httpOnly cookie)* → `{ accessToken, user }`
- `POST /auth/logout` → `{ ok }`
- `GET /me` · `PATCH /me {name,email}` → `User`  *(Bearer)*

**Cart / addresses / orders (Bearer, `no-store`):**
- `GET /me/cart`, `POST /me/cart/items`, `PATCH·DELETE /me/cart/items/:id` → `Cart`
- `GET·POST /me/addresses`, `PATCH·DELETE /me/addresses/:id` → `Address`
- `POST /checkout/order {addressId,notes}` → `{ orderNumber, razorpayOrderId, razorpayKeyId, amount }`
- `POST /checkout/verify {razorpayOrderId,razorpayPaymentId,razorpaySignature}` → `{ order }`
- `GET /me/orders?cursor&limit` → `{ items: OrderListItem[], nextCursor }`
- `GET /me/orders/:orderNumber` → `Order`
- `GET /me/orders/:orderNumber/events` → `OrderEvent[]` *(Phase 6 — tracking timeline; mock derives from status)*

**Admin (Bearer admin token):**
- `POST /admin/login {email,password}` → `{ accessToken, admin }`
- `GET·POST /admin/products`, `GET·PATCH·DELETE /admin/products/:id`
- `GET·POST /admin/categories`, `PATCH·DELETE /admin/categories/:id` *(409 if it has children/products)*
- `GET·PUT /admin/home`, `GET·PUT /admin/settings`
- `POST /admin/upload` → `{ url }`
- `GET /admin/orders` → `{ items, nextCursor }`, `GET /admin/audit` → audit rows

**Called BY the backend (not the FE):**
- `POST /api/revalidate` with header `x-revalidate-secret` + `{ tags: string[] }`

---

## 9. Money rules (must match server-side)

Catalog prices are **GST-inclusive**. The FE computes totals in [src/lib/checkout.ts](src/lib/checkout.ts); the **backend must charge the same**:
- `subtotal` = Σ(price × qty), tax-inclusive
- `shippingFee` = **₹0 if subtotal ≥ ₹5,000, else ₹99**
- `gstIncluded` = tax already inside subtotal (display only, 18%) — **never added on top**
- `total` = `subtotal + shippingFee`

---

## 10. Config + cleanup (not blocking, do before prod)

- [ ] **Set `NEXT_PUBLIC_SITE_URL`** to the production domain — drives `sitemap.xml`, `robots.txt`, canonical URLs, OG images, JSON-LD ([src/lib/site.ts](src/lib/site.ts)). `metadataBase` now reads from it.
- [ ] **SEO is FE-computed** (Phase 6): JSON-LD `Product` schema + per-product OG images + sitemap are generated client/build-side from product data. If the backend later returns its own `structuredData` (BE Phase 6), swap the inline computation in [product/[slug]/page.tsx](src/app/(store)/product/[slug]/page.tsx). **Submit `sitemap.xml` to Google Search Console only after the prod deploy** (else it indexes 404s).
- [ ] Sitemap during a **mock-mode build** degrades to static pages only (build workers can't reach MSW); the real API at build produces the full sitemap.
- [ ] Hardcoded WhatsApp/phone `9350529717` appears in cart, footer, about, PDP, PayButton — confirm it's the real business number (or source from `settings.whatsappNumber`)
- [ ] **Delete orphaned Drizzle prototype** `src/db/{index,schema,seed}.ts` + `data/svcar.db` (dead — nothing imports it; backend owns the real DB)
- [ ] Delete `src/mocks/**` + the contracts alias once integration is stable
- [ ] Slug redirect `/category/health-faucets → health-faucet-sets` ([next.config.ts](next.config.ts)) — keep if old links exist

---

## 11. Known FE issues deferred to integration (from the Phase 0–3 audit)

Documented, low-impact, mostly real-API-flip concerns (see PHASE-CHECKLIST.md "Deferred"):
- Category page derives parent from `breadcrumb[length-2]` — revisit if the real API returns ancestors-only.
- `authedFetch` real `204 No Content` → `schema.parse(null)` would throw (mocks always return a body).
- Sparse-SKU products can strand a variant selection (not reachable with current full-matrix mock data).
- Search has no in-flight race guard; admin logout doesn't clear SWR cache.
