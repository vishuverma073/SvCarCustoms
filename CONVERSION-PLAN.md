# Svcar → SV Car Customs — Conversion Plan

Converting the Svcar ecommerce platform (sanitary goods / kitchen sinks) into
**SV Car Customs** — an Indian car accessories & customization storefront.

## Locked decisions
- **Catalog data:** Representative placeholder products/prices/images per category (real data added later via admin).
- **Vehicle fitment:** Structured **Make → Model → Year** (real schema + admin UI + storefront filter). Its own phase.
- **Brand look:** Dark, sporty theme (black/charcoal base + bold accent).

## Target brand (from svcarcustoms.com + @svcarcustoms)
- **Name:** SV Car Customs · **Founder:** Shivam Verma · **Base:** Delhi, India
- **Tagline:** "Best car accessories delivered to your doorstep"
- **Model:** Pan-India online car accessories store. Nav: Home / Shop / About.
- **Categories:** Body Kits · Car Spoilers · Ambient Lights · Splitters · Diffusers ·
  Exhausts & Tips · Paddle Shifters · Lighting · Audio Upgrades · Custom Interiors ·
  Custom Exteriors · Custom Kits

## Reuse vs. convert
- **Reuse as-is (no change):** email-OTP auth, admin auth, cart, checkout, Razorpay
  payments + webhooks, orders + timeline, audit log, order backups, search engine,
  Inngest jobs, admin CRUD, infra/deploy.
- **Convert:** branding, theme, copy, catalog taxonomy + seed/mock data, product images,
  content pages, SEO, GST rate, contact/social, fitment feature (new).
- **Leave (cosmetic):** `@svcar/*` package namespace (110 import sites, internal only).

---

## Phases

### Phase 0 — Discovery & inventory  ✅ (this document)
- Grep inventory of every brand/domain string + asset (done).
- Key data/content files: `svcar-api/apps/api/scripts/seed-data.ts` (67 hits),
  `svcar-india/src/db/seed.ts` (46), `svcar-india/src/mocks/data/{categories,products,home}.ts`,
  `svcar-india/src/lib/home-defaults.ts`, content pages under `svcar-india/src/app/(store)/`.
- Assets: ~40 sanitary images in `svcar-india/public/uploads/products/`; delete
  `ss kitchen sinks catalogue.pdf` + `health faucet.pdf`; local `svcar-india/data/svcar.db`.

### Phase 1 — Brand & global identity
- Store **settings defaults** (name, support phone/email, WhatsApp, store address, GST) —
  backend `src/lib/env.ts` / settings seed + `svcar-india/src/lib/site.ts`.
- **Theme:** dark sporty palette in Tailwind config / `globals.css`; logo, favicon, OG image.
- **Header / Footer / AnnouncementBar** copy + nav.
- **Metadata** in `svcar-india/src/app/layout.tsx`; titles, descriptions.
- README files.
- **GST:** Indian auto parts are typically **28%** (vs current 18%) — set default, keep editable.
- **Order number prefix:** `VRN-` → `SVC-` (backend order-number generator).

### Phase 2 — Catalog taxonomy & conventions
- Category tree = the 12 SV categories (replaces sanitary tree).
- Variant/dimension conventions for car parts (e.g. *Finish/Color*, *Material*, *Variant*).
- `specifications` field conventions (Material, Fitment type, Warranty, etc.).
- Update legacy slug **redirects** in `svcar-india/next.config.ts` (remove faucet/sink redirects).

### Phase 3 — Vehicle fitment system (NEW feature)
- **Schema + migration** (backend `src/db/schema.ts`): `vehicle_makes`, `vehicle_models`,
  `product_fitments` (productId × make × model × yearStart/yearEnd) + `fitsAllVehicles` flag.
- **Contracts** (`packages/contracts`): fitment zod schemas/types.
- **Backend routes:** `GET /vehicles/makes`, `/vehicles/makes/:slug/models`; extend
  `GET /products` + `/products/by-category/:slug` with `?make&model&year`; admin
  `/admin/vehicles/*` + fitment fields on product create/update.
- **Storefront:** "Select your car" garage selector (Make→Model→Year, persisted via zustand
  + localStorage); fitment filter on category/search; "Fits your car" badge + compatibility
  list on product page.
- **Admin:** fitment editor in ProductEditor; vehicle make/model management screen.

### Phase 4 — Seed & mock data (3 sources, kept in sync)
- Backend seed: `svcar-api/apps/api/scripts/seed-data.ts` (+ `seed-from-data.ts`).
- Frontend MSW mocks: `svcar-india/src/mocks/data/{categories,products,home,settings}.ts`.
- Dummy-api SQLite: `svcar-india/src/db/seed.ts`.
- Representative car products w/ prices, variants, **fitment**, images.
- Replace product images in `svcar-india/public/uploads/products/` with car-accessory art;
  delete the 2 sanitary PDFs.

### Phase 5 — Content pages & home composition
- Rewrite: About (founder Shivam Verma story), Contact, FAQ, Shipping, Refund/Returns,
  Terms, Privacy under `svcar-india/src/app/(store)/`.
- Home sections (`home-defaults.ts` + mock `home.ts`): hero banners, featured categories,
  bestsellers, new arrivals for car accessories.

### Phase 6 — SEO, redirects & asset cleanup
- Titles/descriptions/JSON-LD per page, `sitemap.ts`, `opengraph-image.tsx`.
- Remove Svcar legacy redirects; add any SV redirects if needed.
- Final asset sweep (favicons, social images, store-location map).

### Phase 7 — QA & verification
- Update tests asserting Svcar/sanitary strings (backend `apps/api/tests/*`,
  frontend `src/lib/*.test.ts`, `src/mocks/handlers/*`).
- Run typecheck + build + test on both apps.
- Click-through storefront + admin on mocks (`NEXT_PUBLIC_USE_MOCKS=true`).

---

## Suggested order
0 ✅ → **1 (brand)** → 2 (taxonomy) → 3 (fitment) → 4 (data) → 5 (content) → 6 (SEO) → 7 (QA).
Each phase is reviewed before the next begins.
