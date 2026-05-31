# Phase 6 (Frontend) — Search + Polish

## What you'll build

SEO (sitemap, robots, JSON-LD, OG images), pincode autofill in checkout, order tracking page, an empty-state audit, and a final performance pass. After this phase, v1 is shippable.

## Prerequisites

- [ ] Backend Phase 6 complete — search upgraded (or kept), pincode endpoint live, tracking events endpoint live
- [ ] `@veronica/contracts@1.0.0` installed

## Success criteria

- `/sitemap.xml` and `/robots.txt` exist and validate
- Product pages have JSON-LD `Product` schema in `<head>`
- Each product has an auto-generated OG image
- Address form autofills city/state on pincode entry
- `/orders/:orderNumber` shows a tracking timeline
- Lighthouse on all key pages: perf ≥ 90, a11y ≥ 95, SEO ≥ 95
- Phase 6 status = done in README; v1 ready to launch

## Estimated effort

2 sessions (~5 hours).

---

## Task 6.1 — Sitemap.xml + robots.txt

**Files to touch**:
- `src/app/sitemap.ts` (new — Next.js convention)
- `src/app/robots.ts` (new)

**Suggested Claude Code prompt**:
> Create `src/app/sitemap.ts`:
> - Export default async function returning array of sitemap entries
> - Include: home, /about, /search, every active product page (fetch from backend), every category page
> - Set `lastModified` from product/category `updated_at`
> - `changeFrequency: "weekly"`, `priority: 0.8` for products, 0.9 for categories, 1.0 for home
>
> Create `src/app/robots.ts`:
> - Allow `/`
> - Disallow `/admin`, `/account`, `/orders`, `/cart`, `/checkout`, `/login`, `/api`
> - Sitemap URL: full https URL of /sitemap.xml

**Verification commands**:
```bash
pnpm dev
curl http://localhost:3000/sitemap.xml | head -50
curl http://localhost:3000/robots.txt
```

**Acceptance criteria**:
- [ ] Sitemap includes all products + categories
- [ ] Robots.txt disallows protected routes
- [ ] Sitemap URL in robots.txt is the canonical production URL
- [ ] Commit: `feat(phase-6): sitemap.xml + robots.txt`

---

## Task 6.2 — JSON-LD on product pages

**Files to touch**:
- `src/app/(store)/product/[slug]/page.tsx`

**Suggested Claude Code prompt**:
> In the product page Server Component, render a `<script type="application/ld+json">` tag with the structuredData object returned by the backend (added in BE Phase 6 Task 6.4).
>
> If backend doesn't return it (during transition), compute it inline:
> ```
> { "@context": "https://schema.org", "@type": "Product", "name", "description", "image", "brand": "Veronica India", "sku", "offers": { "@type": "AggregateOffer", "lowPrice", "highPrice", "priceCurrency": "INR", "availability": "https://schema.org/InStock" } }
> ```

**Verification commands**:
```bash
pnpm dev
# View source on any product page
# Confirm <script type="application/ld+json"> exists with valid JSON
# Paste into https://search.google.com/test/rich-results to validate
```

**Acceptance criteria**:
- [ ] JSON-LD present on every product page
- [ ] Validates in Google's Rich Results Test
- [ ] Commit: `feat(phase-6): JSON-LD product schema`

---

## Task 6.3 — Dynamic OG images per product

**Context**: When someone shares a product link, the social preview should show the product image with branding.

**Files to touch**:
- `src/app/product/[slug]/opengraph-image.tsx` (new — Next.js convention)

**Suggested Claude Code prompt**:
> Use Next.js's built-in OG image generation. Create `src/app/(store)/product/[slug]/opengraph-image.tsx`:
> - Imports `ImageResponse` from `next/og`
> - Async default function takes `{ params: { slug } }`
> - Fetches product via `backend.getProductBySlug(slug)`
> - Returns ImageResponse with:
>   - 1200×630 size
>   - Background: product's first image
>   - Overlay: gradient + Veronica logo + product name + price ("From ₹X")
> - export `size = { width: 1200, height: 630 }`, `contentType = "image/png"`

**Verification commands**:
```bash
pnpm dev
# Visit http://localhost:3000/product/lavender-imported-range-single-bowl/opengraph-image
# Should download a 1200×630 PNG
# Paste a product URL into https://www.opengraph.xyz/ → preview is the new image
```

**Acceptance criteria**:
- [ ] OG image renders for every product
- [ ] Includes product image, name, price, branding
- [ ] Validates on opengraph.xyz
- [ ] Commit: `feat(phase-6): dynamic OG images per product`

---

## Task 6.4 — Pincode autofill in address form

**Files to touch**:
- `src/components/checkout/AddressForm.tsx`
- `src/lib/backend.ts`

**Suggested Claude Code prompt**:
> 1. Add to backend client: `lookupPincode(pincode)` → GET /pincode/:pincode.
> 2. In `AddressForm`, when user types 6 digits in the pincode field:
>    - Debounce 400ms
>    - Call `backend.lookupPincode(pincode)`
>    - On success: autofill city + state fields (don't overwrite if user already typed in them)
>    - On 404: show inline "Pincode not recognized — please enter city/state manually"
>    - On other errors: silent fail (don't break the form)

**Acceptance criteria**:
- [ ] Typing 110061 autofills "New Delhi, Delhi"
- [ ] Invalid pincode shows non-blocking message
- [ ] Manual entry still works
- [ ] Commit: `feat(phase-6): pincode autofill`

---

## Task 6.5 — Order tracking timeline on `/orders/:orderNumber`

**Files to touch**:
- `src/app/(store)/orders/[orderNumber]/page.tsx`
- `src/lib/backend.ts` — add `getOrderEvents(orderNumber)`

**Suggested Claude Code prompt**:
> 1. Add `backend.getOrderEvents(orderNumber)` → GET /me/orders/:orderNumber/events.
>
> 2. In the order detail page, render a vertical timeline of events:
>    - Filled circle + line connecting them
>    - Each step: status label + timestamp ("2 days ago"), optional note
>    - Completed steps in brand-orange; upcoming steps in grey
>    - "Out for delivery" / "Delivered" steps if present

**Acceptance criteria**:
- [ ] Timeline renders for orders with events
- [ ] Empty timeline (new order) shows just "Order placed"
- [ ] Visual design matches the existing storefront tokens
- [ ] Commit: `feat(phase-6): order tracking timeline`

---

## Task 6.6 — Empty state audit

**Suggested Claude Code prompt**:
> Walk through every page and check empty states:
> - `/cart` empty → already has empty state, looks good
> - `/orders` empty → ensure "Start shopping" CTA
> - `/search` no results → ensure helpful copy + trending searches
> - Any category page with no products → "Check back soon" + CTA to other categories
> - Any 404 (delete a product, visit old URL) → custom 404 page (`src/app/(store)/not-found.tsx`) with helpful nav links
>
> For each missing or weak empty state, design and implement consistent with existing tokens. The 404 page especially deserves love — make it on-brand.

**Acceptance criteria**:
- [ ] Every "could be empty" page has a designed empty state
- [ ] Custom 404 page exists and is on-brand
- [ ] Commit: `feat(phase-6): empty state audit`

---

## Task 6.7 — Performance & accessibility pass

**Suggested Claude Code prompt**:
> Run Lighthouse on all key pages from a clean profile:
> - `/`
> - `/category/kitchen-sinks`
> - `/product/lavender-imported-range-single-bowl`
> - `/cart`
> - `/checkout`
> - `/account`
>
> For each, target: perf ≥ 90, a11y ≥ 95, best-practices ≥ 95, SEO ≥ 95.
>
> Common fixes:
> - Add `width`/`height` to all images to prevent CLS
> - Add `alt` text to images that don't have it
> - Ensure heading hierarchy (one h1, then h2s) on every page
> - Add `aria-label` to icon-only buttons
> - Verify color contrast (Veronica orange on white = check it passes WCAG AA for normal text size)
> - Lazy-load images below the fold
>
> Report final scores in a comment on this commit.

**Acceptance criteria**:
- [ ] All pages meet score targets
- [ ] Commit: `perf(phase-6): Lighthouse optimization pass`

---

## Task 6.8 — Launch checklist

**Suggested Claude Code prompt**:
> Final pre-launch:
> 1. Razorpay flip from Test mode to Live mode (new keys via env in Vercel + backend host)
> 2. Set `NEXT_PUBLIC_API_URL` to production backend
> 3. Add production DOMAIN to backend CORS allowlist
> 4. Custom domain on Vercel — verify HTTPS works
> 5. Custom domain on backend (api.veronicaindia.com) — point DNS to Workers/Fly
> 6. Confirm all env vars set in production (Sentry, Razorpay LIVE keys, MSG91 prod, Resend prod)
> 7. Confirm Razorpay webhook URL is production not staging
> 8. Submit sitemap to Google Search Console
> 9. Set up Google Analytics 4 (optional) [TODO confirm with Ketan]
> 10. Update CLAUDE.md / README with "we're in production now" pointers

**Acceptance criteria**:
- [ ] All 10 checklist items done
- [ ] Phase 6 + entire v1 marked done in the phases README
- [ ] Final commit: `chore: v1 launch`
- [ ] Celebrate 🎉

---

## Common pitfalls across this phase

- **Sitemap submitted before deploy** — Google will see 404s. Submit after the production deploy is verified.
- **Razorpay live keys committed by accident** — they're worth real money. Double-check before pushing.
- **OG image cache** — Facebook, Twitter, WhatsApp cache OG images aggressively. After publishing, run their debug tools to bust the cache.
- **Lighthouse on Vercel preview != production** — preview deploys have different perf characteristics. Test on the final domain.

## What's next

v1 is live. Open `docs/v1.5-plan.md` (new doc to be written) for next-quarter priorities.
