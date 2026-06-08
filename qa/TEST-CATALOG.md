# Veronica Functional Test Catalog

> The executable spec. Every case has a **stable ID**, a **layer**, a **priority**, and a
> **Given/When/Then**. Security cases live in [SECURITY-TEST-CATALOG.md](SECURITY-TEST-CATALOG.md);
> strategy/tooling in [QA-STRATEGY.md](QA-STRATEGY.md).
>
> **Layers:** `U`=unit · `I`=integration (real Postgres / real HTTP) · `C`=component (browser DOM) ·
> `E`=E2E (Playwright, real stack) · `CON`=contract. **Priority:** P0 (money/auth/data) → P3 (polish).
>
> Many U-layer cases already exist (31 BE + 101 FE). They are listed for completeness and marked
> **(exists)**; everything else is to-build. Source of truth for rules is cited inline, e.g.
> [pricing.ts:53](veronica-api-/apps/api/src/lib/pricing.ts#L53).

## How the cases were enumerated

Cases are derived with explicit test-design techniques, not ad-hoc:
- **Equivalence Partitioning (EP)** + **Boundary-Value Analysis (BVA)** for numeric inputs (qty, price, pincode, money thresholds).
- **Decision tables** for rule combinations (shipping × subtotal × settings; default-address rules).
- **State-transition** testing for the order lifecycle and auth/refresh sessions.
- **Pairwise / combinatorial** for the variant→SKU matrix (full cartesian is too large; pairwise covers all dimension-value pairs).
- **CRUD + RBAC matrices** for admin resources (anon/customer/admin × create/read/update/delete).

---

## 1. Catalog & Categories  — `*-CATALOG-*`

Endpoints: `GET /categories`, `GET /categories/:slug`, `GET /products`, storefront home.

| ID | Layer | Pri | Given / When / Then |
|---|---|---|---|
| BE-CATALOG-001 | I | P1 | **Given** seeded categories **When** `GET /categories` **Then** only root categories return, sorted by `sortOrder` asc. |
| BE-CATALOG-002 | I | P2 | **Given** empty DB **When** `GET /categories` **Then** `200` with `[]` (not 404). |
| BE-CATALOG-003 | I | P1 | **Given** a category with breadcrumb ancestry **When** `GET /categories/:slug` **Then** breadcrumb + children resolve correctly (self-referencing tree). |
| BE-CATALOG-004 | I | P2 | **When** `GET /categories/:slug` for unknown slug **Then** `404`. |
| BE-CATALOG-005 | I | P1 | **Given** active+draft+archived products **When** `GET /products?category=` **Then** only `active` products appear. |
| BE-CATALOG-006 | I | P2 | **When** `GET /products?bestseller=true` / `?new=true` / `?featured=true` **Then** flag filters apply (decision table: each flag × on/off). |
| BE-CATALOG-007 | I | P1 | **Given** 25 products, page size N **When** paginating with `cursor` **Then** no item is skipped or duplicated across pages; final page returns `nextCursor=null`. |
| BE-CATALOG-008 | I | P2 | **When** `GET /products?limit=0` / negative / huge **Then** clamped to sane bounds (BVA). |
| BE-CATALOG-009 | I | P1 | **When** `GET /products/:slug` **Then** full shape: images (sorted), dimensions, SKUs, specs, JSON-LD structured data. |
| BE-CATALOG-010 | I | P2 | **When** `GET /products/:slug` with 0 images **Then** no crash; `image` null-safe (regression: FE PDP crashed on 0-image). |
| FE-CATALOG-011 | E | P1 | **When** visiting `/` **Then** hero + category grid + bestseller/new/featured carousels render from live data, 0 console errors. |
| FE-CATALOG-012 | E | P1 | **When** visiting `/category/[slug]` **Then** breadcrumb + product grid render; grid is 1/2/3-col at 360/`sm`/`lg`. |
| CON-CATALOG-013 | CON | P1 | **Then** every `/categories`,`/products` response validates against `@veronica/contracts` schemas (provider + consumer). |

---

## 2. Product detail & SKU / variant matrix  — `*-SKU-*`

Rules: min/max price across SKUs, best discount, resolve SKU by selected dimension values, sale vs base price.

| ID | Layer | Pri | Given / When / Then |
|---|---|---|---|
| FE-SKU-001 **(exists)** | U | P1 | Min/max price across a SKU set; best discount % across the matrix. |
| FE-SKU-002 **(exists)** | U | P1 | Resolve the correct SKU given a full dimension-value combo. |
| FE-SKU-003 | C | P1 | **Given** a product with dims Size×Finish **When** user picks values **Then** the matching SKU's price/stock/image update; **pairwise** over all value pairs. |
| FE-SKU-004 | C | P2 | **Given** a sparse matrix (some combos missing) **When** user selects an unavailable combo **Then** UI disables it / shows unavailable (no stranded selection, no fallback-price bug). |
| FE-SKU-005 | C | P2 | **When** only one dimension value is left selectable **Then** it's auto-resolvable; available-value filtering correct. |
| BE-SKU-006 | I | P1 | **Given** SKU with `salePrice` set **Then** `unitPrice` everywhere uses `salePrice ?? price` ([me.ts:55](veronica-api-/apps/api/src/routes/me.ts#L55)). |
| FE-SKU-007 **(exists)** | U | P2 | Admin SKU-matrix sync: add/remove dimension values preserves prices for surviving combos, drops orphans (regression: variant price wipe on rename). |

---

## 3. Search  — `*-SEARCH-*`

Endpoint: `GET /search?q=` (Postgres FTS), cursor pagination.

| ID | Layer | Pri | Given / When / Then |
|---|---|---|---|
| BE-SEARCH-001 | I | P1 | **When** `q` matches a product name/tag **Then** relevant products rank first (real FTS, not mock). |
| BE-SEARCH-002 | I | P2 | **When** `q=''` / whitespace / missing **Then** `400` or empty per contract (EP: empty/blank/valid/oversized). |
| BE-SEARCH-003 | I | P2 | **When** `q` has FTS operators / special chars (`& | ! :* '`) **Then** no 500; query is sanitized (links to SEC-INJ-002). |
| BE-SEARCH-004 | I | P1 | **When** paginating search results with cursor **Then** stable ordering, no dup/skip (BVA on page boundaries). |
| BE-SEARCH-005 | I | P3 | **When** `q` matches nothing **Then** `200` with `[]`. |
| FE-SEARCH-006 | C | P2 | **Given** rapid typing **When** queries race **Then** latest-wins (AbortController guard) — known FE gap, regression test. |
| FE-SEARCH-007 | E | P1 | **When** searching from the storefront **Then** results grid renders, empty state shows for no matches. |

---

## 4. Cart  — `*-CART-*`

Endpoints: `GET/POST /me/cart/items`, `PATCH/DELETE /me/cart/items/:id`. Upsert by `(cartId, skuId)`; qty math server-side.

| ID | Layer | Pri | Given / When / Then |
|---|---|---|---|
| BE-CART-001 **(exists)** | U | P1 | Add item → cart returns items, subtotal, itemCount. |
| BE-CART-002 | I | P1 | **Given** SKU already in cart **When** POST same SKU again **Then** qty **increments** via `onConflictDoUpdate` ([me.ts:181-187](veronica-api-/apps/api/src/routes/me.ts#L181-L187)), not duplicate line. |
| BE-CART-003 | I | P1 | **When** POST non-existent `skuId` **Then** `404` "SKU not found". |
| BE-CART-004 | I | P1 | **When** `PATCH /me/cart/items/:id {qty:0}` **Then** the line is **deleted** ([me.ts:204-205](veronica-api-/apps/api/src/routes/me.ts#L204-L205)). |
| BE-CART-005 | I | P0 | **Given** user A owns cart line X **When** user B PATCH/DELETEs line X **Then** `404` (owner-scoped) — see SEC-AUTHZ-002. |
| BE-CART-006 | I | P2 | **When** `:id` is non-integer **Then** `400` "Invalid id" (BVA: `abc`, `1.5`, `-1`, huge). |
| BE-CART-007 | I | P1 | **Given** no cart yet **When** GET/POST cart **Then** cart is lazily created exactly once; concurrent create race re-reads (no dup cart) ([me.ts:22-34](veronica-api-/apps/api/src/routes/me.ts#L22-L34)). |
| BE-CART-008 | I | P1 | **When** adding qty that exceeds stock / qty ≤ 0 / non-int qty **Then** validated per `AddCartItemRequestSchema` (EP+BVA on qty). |
| FE-CART-009 **(exists)** | U | P0 | Guest cart persists on reload (rehydrate strips `serverId`); not wiped (regression). |
| FE-CART-010 **(exists)** | U | P0 | On login, guest items merge to server cart idempotently; on logout server cart cleared, no bleed to next user. |
| FE-CART-011 | C | P1 | **When** changing qty / removing in cart UI **Then** subtotal + shipping + total update live; empty-cart state shows. |
| BE-CART-012 | I | P1 | **Given** a SKU price changed since add **When** building the cart **Then** it reflects **current** price (cart never trusts stored price). |
| E2E-CART-013 | E | P1 | **When** guest adds to cart → logs in **Then** the item survives the merge and shows in the cart on the real stack. |

---

## 5. Checkout & money math  — `*-CHECKOUT-*`

Rules ([pricing.ts](veronica-api-/apps/api/src/lib/pricing.ts), [checkout.ts](veronica-api-/apps/api/src/lib/checkout.ts), FE [checkout.ts](veronica-india/src/lib/checkout.ts)):
GST **inclusive** (18% default), shipping **₹99** below **₹5000** else free (also free when subtotal 0), all math in **paise** integers, `gst = round(subtotal − subtotal/(1+rate))`, **`total = subtotal + shippingFee`** (GST never added on top). Settings can override (`gstRate` stored as %).

### Money decision table (shipping)

| Subtotal (₹) | Expected shipping | Note | ID |
|---|---|---|---|
| 0 | 0 | empty cart → free | BE-CHECKOUT-001 |
| 0.01 | 99 | just above zero | BE-CHECKOUT-002 |
| 4999.99 | 99 | just below threshold (BVA−) | BE-CHECKOUT-003 |
| 5000.00 | 0 | exactly threshold (BVA=) | BE-CHECKOUT-004 |
| 5000.01 | 0 | just above threshold (BVA+) | BE-CHECKOUT-005 |

| ID | Layer | Pri | Given / When / Then |
|---|---|---|---|
| BE-CHECKOUT-006 **(exists)** | U | P0 | Subtotal 3000 + ₹99 = total **3099** (309900 paise); GST inside, not added. |
| BE-CHECKOUT-007 | U | P0 | **Given** price 999.50 × qty 3 **Then** no float drift (paise rounding) — assert exact integer paise ([pricing.ts:56](veronica-api-/apps/api/src/lib/pricing.ts#L56)). |
| BE-CHECKOUT-008 | U | P1 | **Given** admin sets `gstRate=12`, `flatFee=49`, `freeAbove=2000` **Then** pricing honours settings (config override path). |
| BE-CHECKOUT-009 | U | P1 | **Then** FE `computeTotals` and BE `calculatePricing` agree on the same lines+settings (cross-repo money parity) — prevents customer-vs-charged drift. |
| BE-CHECKOUT-010 | I | P0 | **When** `POST /checkout/order` **Then** order total is computed from **current SKU prices**, never the client's number ([checkout.ts:63-94](veronica-api-/apps/api/src/routes/checkout.ts#L63-L94)) — see SEC-PAY-001. |
| BE-CHECKOUT-011 | I | P1 | **When** order created **Then** `orders`+`orderItems` persist **atomically** in one transaction; Razorpay order id patched after ([checkout.ts:125-165](veronica-api-/apps/api/src/routes/checkout.ts#L125-L165)). |
| BE-CHECKOUT-012 | I | P1 | **When** a cart SKU vanished **Then** `400` "no longer available" (fail-fast, don't silently drop). |
| BE-CHECKOUT-013 | I | P1 | **When** `addressId` given **Then** ownership verified (other user's address → `400`); else inline `address` used. |
| BE-CHECKOUT-014 | I | P1 | **When** neither `addressId` nor `address` **Then** `400`; empty cart **Then** `400`. |
| BE-CHECKOUT-015 | I | P1 | **Then** cart is **not** cleared on order-create, only on verify success ([checkout.ts:204](veronica-api-/apps/api/src/routes/checkout.ts#L204), [checkout.ts:262-268](veronica-api-/apps/api/src/routes/checkout.ts#L262-L268)). |
| FE-CHECKOUT-016 | C | P1 | **When** entering a 6-digit pincode **Then** city/state autofill (debounced); unknown pincode is non-blocking. |
| FE-CHECKOUT-017 | C | P1 | Address form validation: state dropdown (Indian states), `pincode` regex `^[1-9][0-9]{5}$` (BVA: `000000`, `12345`, `1234567`, `110001`). |
| E2E-CHECKOUT-018 | E | P0 | Full path: login → address → pay (stub modal) → success → order in history → cart cleared (the golden journey). |

---

## 6. Order lifecycle & tracking  — `*-ORDER-*`

State machine: `pending → paid → confirmed → shipped → out_for_delivery → delivered`; plus `cancelled`, `refunded`. Endpoints `GET /me/orders`, `/me/orders/:orderNumber`, `/:orderNumber/events`.

### State-transition cases

| From | Event | To | Allowed? | ID |
|---|---|---|---|---|
| pending | valid signature verify | paid | ✅ | BE-ORDER-001 |
| pending | invalid signature | cancelled | ✅ (set cancelled) | BE-ORDER-002 |
| paid | webhook captured (replay) | paid | ✅ idempotent | BE-ORDER-003 |
| paid/confirmed | re-verify | no-op `200` | ✅ idempotent | BE-ORDER-004 |
| delivered | verify/pay again | (blocked) | ❌ must not regress | BE-ORDER-005 |
| any | admin manual note | +event row | ✅ append-only | BE-ORDER-006 |

| ID | Layer | Pri | Given / When / Then |
|---|---|---|---|
| BE-ORDER-007 | I | P0 | **Given** user A's order **When** user B `GET /me/orders/:orderNumber` **Then** `404` (owner-scoped, [me.ts:367-371](veronica-api-/apps/api/src/routes/me.ts#L367-L371)) — see SEC-AUTHZ-001. |
| BE-ORDER-008 | I | P1 | **When** `GET /me/orders` paginates by `createdAt` cursor **Then** newest-first, no dup/skip; invalid cursor → `400`. |
| BE-ORDER-009 | I | P1 | **Then** order detail totals (`subtotal/shippingFee/gstAmount/total`) match what was charged; line items immutable snapshot (productName/skuCode captured at order time). |
| BE-ORDER-010 | I | P1 | **When** `GET /:orderNumber/events` **Then** timeline ordered by `createdAt` asc, includes `placed` + `paid` after a paid order. |
| FE-ORDER-011 | E | P1 | **When** viewing `/orders/[orderNumber]?just=paid` **Then** items, totals, tracking timeline render; celebration toast on `just=paid`. |
| BE-ORDER-012 | I | P2 | **Then** `orderNumber` format `^VE[0-9A-Z]{10}$`, derived from UUID (no sequential volume leak). |
| BE-ORDER-013 | I | P2 | **Then** an `order_backups` snapshot is written on `created` and again on `paid` (append-only, survives order mutation). |

---

## 7. Auth — OTP, JWT, refresh, profile  — `*-AUTH-*`

Customer: phone OTP → access (15min) + refresh (30d, httpOnly cookie, JTI revocable). Admin: email+password (bcrypt) → 8h token. Rate limits: OTP 1/min + 5/hour.

| ID | Layer | Pri | Given / When / Then |
|---|---|---|---|
| BE-AUTH-001 **(exists)** | U | P1 | Valid phone → OTP stored+sent; rate-limited 1/min, 5/hour. |
| BE-AUTH-002 | I | P0 | **When** verify with correct OTP **Then** access token + refresh cookie issued; user upserted by phone. |
| BE-AUTH-003 | I | P1 | **When** wrong OTP **Then** `401`; attempts counter increments; OTP locks after max attempts. |
| BE-AUTH-004 | I | P1 | **When** expired OTP **Then** `401` (BVA around `expiresAt`). |
| BE-AUTH-005 | I | P0 | **When** `POST /auth/refresh` with valid cookie **Then** new access + **rotated** refresh; old JTI usable? → see SEC-AUTH-005 (replay). |
| BE-AUTH-006 | I | P0 | **When** logout **Then** refresh JTI blacklisted (`token_revocations`); subsequent refresh with it → `401`. |
| BE-AUTH-007 **(exists)** | U | P1 | `GET /me` returns profile; `PATCH /me` updates name/email; `email:''` clears to null ([me.ts:131-161](veronica-api-/apps/api/src/routes/me.ts#L131-L161)). |
| BE-AUTH-008 | I | P2 | `PATCH /me` with invalid email / name > 120 chars → `400` (BVA). |
| FE-AUTH-009 **(exists/regression)** | C | P1 | OTP 6-box: auto-advance, paste, autofill; auto-submit fires (regression: stale-closure bug). |
| E2E-AUTH-010 | E | P1 | Full login: phone → OTP → authenticated; `returnTo` redirect honoured; session survives reload (silent refresh). |
| BE-AUTH-011 | I | P1 | Admin login: correct creds → 8h token; wrong password → `401`; short password (<8) → `400`; bcrypt compare used. |

> JWT tampering / alg-none / key-confusion / brute-force cases are in [SECURITY-TEST-CATALOG.md](SECURITY-TEST-CATALOG.md) `SEC-AUTH-*`.

---

## 8. Admin CRUD + RBAC + audit  — `*-ADMIN-*`

Resources: products, categories, home, settings, uploads, orders, audit-log. RBAC: anon=401, customer-token=403, admin=ok. Every mutation writes an audit row with before/after.

### RBAC matrix (apply to every admin mutation endpoint)

| Caller | Expected | ID pattern |
|---|---|---|
| no token | `401` | BE-ADMIN-00x.a |
| valid **customer** token | `403` | BE-ADMIN-00x.b |
| valid **admin** token | `200/201` | BE-ADMIN-00x.c |
| admin token whose `is_admin` was revoked | `403` within 60s (cache TTL, [auth.ts:48-67](veronica-api-/apps/api/src/middleware/auth.ts#L48-L67)) | BE-ADMIN-00x.d |

| ID | Layer | Pri | Given / When / Then |
|---|---|---|---|
| BE-ADMIN-001 | I | P1 | Product create with nested dimensions/SKUs/images persists fully; missing `name` → `400`; audit `product.create` row written. |
| BE-ADMIN-002 | I | P1 | Product PATCH replaces nested arrays atomically; `404` on unknown id; audit `product.update` with before/after diff. |
| BE-ADMIN-003 | I | P1 | Product DELETE soft-deletes (status→archived); audit `product.delete`. |
| BE-ADMIN-004 | I | P1 | Category create auto-slugs; PATCH prevents **parent cycles**; audit rows written. |
| BE-ADMIN-005 | I | P1 | Category DELETE blocked (`400`/`409`) when it has children or products (returns counts). |
| BE-ADMIN-006 | I | P1 | Category reorder via `sortOrder` actually persists ordering (regression: reorder no-op). |
| BE-ADMIN-007 | I | P1 | `PUT /admin/home` atomically replaces sections; validates each section (discriminated union); audit `home_config.update` with diff. |
| BE-ADMIN-008 | I | P1 | `PATCH /admin/settings` partial update; public `GET /settings` exposes **subset only** (no private fields); audit diff. |
| BE-ADMIN-009 | I | P1 | `POST /admin/uploads` accepts images ≤5MB; rejects non-image (`400`) and >5MB (`400`); returns public URL — see SEC-FILE-001. |
| BE-ADMIN-010 | I | P1 | `GET /admin/audit-log` filters by actor/resource/date, paginates; entries include actor name/email. |
| FE-ADMIN-011 | E | P1 | Admin login → create product → product visible on storefront (cross-surface); 0 console errors. |
| FE-ADMIN-012 | C | P2 | Product editor + variants editor: slug auto-gen, image reorder, danger-zone delete. |
| CON-ADMIN-013 | CON | P0 | FE-expected admin routes match BE-mounted routes — **catches `/admin/login`↔`/admin/auth/login`, `/admin/upload`↔`/admin/uploads`, `/admin/audit`↔`/admin/audit-log` drift** ([app.ts:80-89](veronica-api-/apps/api/src/app.ts#L80-L89)). |

---

## 9. Cross-cutting: caching, rate-limit, idempotency, observability  — `*-XCUT-*`

| ID | Layer | Pri | Given / When / Then |
|---|---|---|---|
| BE-XCUT-001 **(exists)** | U | P1 | Repeat GETs hit cache; mutation invalidates by prefix. |
| BE-XCUT-002 **(exists)** | U | P1 | Cache-Control: `no-store` on `/healthz`, `private,no-store` on `/me/*` and `/admin/*`. |
| BE-XCUT-003 | I | P1 | `POST /api/revalidate` (called by BE) requires `x-revalidate-secret`; `401` on mismatch, `503` if unset; `revalidateTag` runs. |
| BE-XCUT-004 | I | P0 | Webhook `payment.captured` is **idempotent** — replay doesn't double-process or re-charge (see SEC-PAY-003). |
| PERF-XCUT-005 | PERF | P3 | Under k6 catalog load, cache-hit ratio ≥ target; p(95) latency `< 200ms` (threshold-gated³). |
| BE-XCUT-006 | I | P1 | Inngest events (`order.paid`, reconcile-pending) fire without crashing in stub mode; reconcile cancels stale `pending` orders. |
| A11Y-XCUT-007 | E | P3 | axe-core: 0 critical violations on `/`, `/category/*`, `/product/*`, `/cart`, `/login`. |
| A11Y-XCUT-008 | E | P3 | Lighthouse CI: LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 at p75, mobile+desktop⁵. |

---

## 10. Traceability summary

| Domain | # cases | P0 | Exists (U) | To build |
|---|---|---|---|---|
| Catalog/Categories | 13 | 0 | 0 | 13 |
| SKU/Variant | 7 | 0 | 3 | 4 |
| Search | 7 | 0 | 0 | 7 |
| Cart | 13 | 3 | 3 | 10 |
| Checkout/Money | 18 | 6 | 2 | 16 |
| Order lifecycle | 13 | 2 | 0 | 13 |
| Auth | 11 | 4 | 3 | 8 |
| Admin/RBAC/Audit | 13 (+RBAC×N) | 1 | 0 | 13 |
| Cross-cutting | 8 | 2 | 2 | 6 |

References ¹–⁹ as in [QA-STRATEGY.md §10](QA-STRATEGY.md#10-references-verified-sources).
