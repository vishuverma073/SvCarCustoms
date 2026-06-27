# Admin Design Principles

This is the spec for the admin panel. It applies to both the backend API shapes and the frontend UI in [svcar-web/docs/admin-design.md](../../svcar-catelog/docs/admin-design.md).

## Who the admin user is

The merchant — Ketan or store staff. **Not technically educated.** Will use this daily, often from a phone.

## Core design principles

1. **Mobile-first.** Bottom-nav layout. Big touch targets (≥ 44px). Drag-drop from phone camera roll.
2. **Cards, not tables.** Image-heavy product cards are easier to scan than spreadsheets.
3. **Toggles, not checkboxes.** "Show on home" is a switch, not a tickbox.
4. **Inline edits where possible.** Tap a price → edit in place. No multi-step modals.
5. **No JSON, no SQL, no terminal.** Everything has a UI.
6. **Live preview.** Every screen has a "View on storefront" link that opens the public page.
7. **No spreadsheet exports for v1.** Reduces scope.
8. **Sticky save bar.** Long forms get a sticky bottom action bar — never hunt for the save button.

## What the admin can do (v1 scope)

**Products**:
- Create / edit / delete (soft delete → archive)
- Upload multiple images, reorder by drag, set primary
- Set variants (dimensions + SKUs with prices)
- Add specs (name + value pairs)
- Toggle: Active / Draft, Bestseller, New, Featured (new), Pin to top of category
- Quick edit: price + status from the product list without opening editor

**Categories**:
- Tree view; drag to reorder; create / edit / delete
- Refuse delete if has children or products (with clear error)

**Orders** (basic in Phase 1, full in Phase 4):
- List with status filter
- Tap to open detail
- Change status from a dropdown (Phase 4 wires Razorpay refund)

**Home page composer** (new — this is the marketing control):
- See the storefront homepage with edit handles
- Drag to reorder sections (Hero / Bestsellers / Categories / New / Featured / Promo)
- Toggle each section on/off
- Per-section editor:
  - **Hero**: image upload + title + subtitle + CTA text + CTA link + optional schedule (show from/to)
  - **Bestsellers / New**: auto-populated from product flags
  - **Featured**: pick products by drag-drop (from a search/filter sidebar)
  - **Categories grid**: which 4 categories show, in what order
  - **Promo**: image upload + headline + CTA

**Settings**:
- Store info (name, contact, address) — read by SEO, footer, WhatsApp link
- Tax rate (GST % — currently fixed at 18, but editable for future)
- Shipping policy (free above ₹X, ₹Y below)

**Account**:
- Change admin's own password
- Logout

## What's deliberately out of v1

- Bulk operations (multi-select + edit). Phase 6+ if needed.
- CSV import / export. Future.
- Inventory tracking. Future.
- Multi-admin roles. v1: every admin can do everything.
- Discount codes. Future.
- Email blast / promotional notifications. Future.
- Customer support inbox. Future (use WhatsApp until then).

## Visual style

Extends the existing storefront tokens from [src/app/globals.css](../../svcar-catelog/src/app/globals.css):

- Brand orange `#E8822A` for primary actions
- Brand black `#0A0A0A` for nav backgrounds (admin sidebar / bottom nav)
- White surfaces, subtle shadows
- Inter font (already loaded)
- Card-style for everything (16px border-radius, subtle shadow)

**No new visual languages.** If a pattern works on the storefront, reuse it.

## Schema implications

The admin's flags + home composer mean we need a few schema additions to what's in [01-data-model.md](./01-data-model.md):

**On `products`**:
- `is_featured BOOLEAN DEFAULT false` — for the home Featured section
- `category_pin_order INTEGER` — for pin-to-top within a category (nullable; null = unpinned)

**New table `home_config`** (single-row, app-level singleton):
- `id` PK = 1 (enforced via check constraint)
- `sections` JSONB — array of `{ key: 'hero'|'bestsellers'|'categories'|'new'|'featured'|'promo', enabled: bool, order: int, config: {...} }`
- `updated_at`, `updated_by`

The `config` field per section:
- Hero: `{ imageUrl, title, subtitle, ctaText, ctaHref, showFrom?, showTo? }`
- Featured: `{ productIds: number[] }`
- Categories: `{ categoryIds: number[] }` (the 4 to show)
- Promo: `{ imageUrl, headline, ctaText, ctaHref }`
- Bestsellers / New: no config (auto from flags)

## API endpoints for admin (covered in Phase 1)

All gated by `requireAdmin`. See [02-api-design.md](./02-api-design.md) for the canonical list. Summary:

- `POST /admin/auth/login`
- `GET /admin/products` (with filters), `GET /admin/products/:id`, `POST /admin/products`, `PATCH /admin/products/:id`, `DELETE /admin/products/:id`
- `GET /admin/categories`, `POST /admin/categories`, `PATCH /admin/categories/:id`, `DELETE /admin/categories/:id`
- `GET /admin/home`, `PUT /admin/home` (atomic update of the whole config)
- `POST /admin/uploads` (image upload to Supabase Storage)
- `GET /admin/settings`, `PATCH /admin/settings`
- `GET /admin/audit-log` (Phase 5 polish — wired but no UI in Phase 1)

## Public storefront effects

Home page reads `home_config` (cached, see Phase 5). Each section honors `enabled` + `order`. Featured section uses the curated `productIds`. The existing storefront home page ([src/app/(store)/page.tsx](../../svcar-catelog/src/app/(store)/page.tsx)) will be rebuilt in Phase 2 to render from this config rather than hardcoded sections.
