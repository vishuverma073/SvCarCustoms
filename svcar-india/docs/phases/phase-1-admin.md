# Phase 1 (Frontend) — Admin UI

## What you'll build

The complete admin panel that the merchant will use daily. Mobile-first, polished, with a home page composer. Built entirely against **MSW mocks** — you don't wait for the backend intern to finish endpoints.

This is the biggest FE phase. **Plan for 4 sessions.** Read [../admin-design.md](../admin-design.md) before writing any code — it has the visual + UX spec.

## Prerequisites

- [ ] FE Phase 0 complete — MSW installed, repo renamed, `@svcar/contracts@0.1.0` (or later) installed
- [ ] You've read [../admin-design.md](../admin-design.md). Refer back to it often.
- [ ] BE intern has shared expected `@svcar/contracts` version for this phase (`0.2.0` at the end of BE Phase 1)
- [ ] You can run `pnpm dev` and see the current storefront working

## Success criteria

- Admin can log in (against MSW mocks) on mobile + desktop
- Admin can create / edit / archive products including image upload (against mocks)
- Admin can manage categories (tree view + drag reorder)
- Admin can compose the home page (drag-reorder sections, edit hero, pick featured products)
- Admin can edit settings (GST rate, shipping policy, store info)
- All UI works at iPhone 14 width AND desktop
- Lighthouse on `/admin/*` pages ≥ 90 perf, ≥ 95 a11y
- When BE Phase 1 finishes and contracts are at `0.2.0`, flipping `NEXT_PUBLIC_USE_MOCKS=false` Just Works against staging backend

## Estimated effort

4 sessions (~12 hours). Don't try to do it all in one push.

## Coordinate with BE

- Confirm the `home_config` section keys early: `hero`, `bestsellers`, `categories`, `new`, `featured`, `promo`. Lock these — changing them later means cross-repo schema drift.
- Confirm Supabase Storage bucket URL format so you can add it to `next.config.ts`. Pattern: `https://*.supabase.co/storage/v1/object/public/**`.
- Tell BE intern when you're ready to flip from MSW to staging (M1 milestone).

---

## Task 1.1 — Install MSW + scaffold admin endpoint mocks

**Context**: MSW (Mock Service Worker) intercepts `fetch` calls and returns canned responses. You wire it once per endpoint; everything else just works.

**Files to touch**:
- `package.json` — add `msw`
- `src/mocks/handlers/admin.ts` (new)
- `src/mocks/handlers/index.ts` (created in Phase 0; we extend)
- `src/mocks/data/products.ts` (new — fake product data)
- `src/mocks/data/categories.ts` (new)
- `src/mocks/data/home.ts` (new)
- `src/mocks/data/settings.ts` (new)

**Suggested Claude Code prompt**:
> Install MSW handlers for the admin endpoints.
>
> 1. In `src/mocks/data/products.ts`, generate 12 fake products using `@faker-js/faker`. Match the `ProductSchema` shape from `@svcar/contracts`. Include realistic Indian sanitaryware names ("Lavender Sink", "Brass Faucet", etc.). 3-4 of them are bestsellers, 2 are new arrivals, 2 are featured.
>
> 2. Similarly `src/mocks/data/categories.ts` — 8 categories matching the tree from the seed data (Kitchen Sinks, Single Bowl, Double Bowl, Health Faucet Sets, ABS, Brass, Bathroom Accessories, Plumbing & Fittings).
>
> 3. `src/mocks/data/home.ts` — default HomeConfig with all 6 sections enabled in order: hero, categories, bestsellers, new, featured, promo. Hero has a placeholder image URL.
>
> 4. `src/mocks/data/settings.ts` — default settings (GST 18, free shipping above 5000, etc.).
>
> 5. `src/mocks/handlers/admin.ts` — MSW handlers for every admin endpoint. They should:
>    - Read from the in-memory data above (mutate it for POST/PATCH/DELETE)
>    - Validate request body with the contract schemas
>    - Return responses matching the contract schemas
>    - Simulate auth: `POST /admin/auth/login` accepts `email: "admin@test.local"` + `password: "admin123"`, returns `{ accessToken: "mock-token", admin: { ... } }`. Other emails return 401.
>    - For requests with `Authorization: Bearer <not mock-token>`, return 401.
>    - For uploads: simulate by returning a placeholder URL like `https://placeholder.com/${nanoid()}.png`.
>
> 6. Wire `admin.ts` into `src/mocks/handlers/index.ts`.
>
> 7. Verify by running `pnpm dev` with `NEXT_PUBLIC_USE_MOCKS=true` and hitting endpoints via curl or browser DevTools.

**Verification commands**:
```bash
pnpm install
pnpm dev
# In browser DevTools console:
fetch("/api/admin/auth/login", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({email:"admin@test.local",password:"admin123"})}).then(r=>r.json()).then(console.log)
# Expect: { accessToken: "mock-token", admin: {...} }
```

**Acceptance criteria**:
- [ ] MSW handlers for: login, products CRUD, categories CRUD, home GET/PUT, settings GET/PATCH, uploads, orders stub, audit-log stub
- [ ] Realistic fake data
- [ ] Mock auth enforces token presence
- [ ] Commit: `feat(phase-1): MSW handlers for admin endpoints`

**Pitfalls**:
- MSW works in dev mode only via a service worker. For SSR/Server Component calls, MSW needs the Node setup (see `src/mocks/node.ts`). Phase 0 should have set both up — if not, add the Node setup.
- Don't accidentally ship MSW to production — check that `NEXT_PUBLIC_USE_MOCKS=true` is only set in `.env.local` / `.env.development`.

---

## Task 1.2 — Admin auth store + protected layout

**Files to touch**:
- `src/store/adminAuthStore.ts` (new)
- `src/lib/backend.ts` — add admin auth methods
- `src/app/admin/layout.tsx` — rewrite (currently uses deprecated cookie-presence)
- `src/components/admin/AdminAuthProvider.tsx` (new)

**Suggested Claude Code prompt**:
> Set up admin auth.
>
> 1. `src/store/adminAuthStore.ts` (Zustand, no persist — sessionStorage handled in provider):
>    - state: `accessToken: string | null`, `admin: AdminUser | null`, `status: 'idle' | 'authenticating' | 'authenticated' | 'unauthenticated'`
>    - actions: `setAdminAuth(token, admin)`, `clearAdminAuth()`
>
> 2. Add to `src/lib/backend.ts`:
>    - `adminLogin(email, password)` — POST /api/admin/auth/login
>    - `adminLogout()` — clears store + sessionStorage
>    - Authenticated fetcher helper that reads token from adminAuthStore and adds `Authorization: Bearer <token>` header
>
> 3. `src/components/admin/AdminAuthProvider.tsx`:
>    - Client component
>    - On mount: try to read token from sessionStorage. If present, validate by calling `GET /api/admin/settings` (gated endpoint). If 200, restore session. If 401, clear sessionStorage.
>    - Sync auth store changes back to sessionStorage
>
> 4. Rewrite `src/app/admin/layout.tsx` (delete the current cookie-presence logic):
>    - Wrap children with `<AdminAuthProvider>`
>    - If `pathname === "/admin/login"`, render children unwrapped
>    - Else if `status === "unauthenticated"`, redirect to `/admin/login?returnTo=${pathname}`
>    - Else (authenticated): render the new layout (Task 1.3)
>    - Else (idle/authenticating): show a skeleton

**Verification commands**:
```bash
pnpm dev
# /admin → bounces to /admin/login
# DevTools → sessionStorage shows no token initially
# After login (Task 1.4 will build the page), refresh stays logged in
```

**Acceptance criteria**:
- [ ] Cookie-presence check removed entirely (grep for "admin-session" — no results)
- [ ] sessionStorage has the token, NOT localStorage
- [ ] Refresh keeps session
- [ ] Tab close clears session
- [ ] Commit: `feat(phase-1): JWT-based admin auth store + provider`

---

## Task 1.3 — Admin layout (bottom nav mobile, sidebar desktop)

**Context**: This is where the mobile-first promise materializes. Read [../admin-design.md](../admin-design.md) "Layout" section before starting.

**Files to touch**:
- `src/app/admin/layout.tsx` — extend with the new shell
- `src/components/admin/BottomNav.tsx` (new)
- `src/components/admin/Sidebar.tsx` (new)
- `src/components/admin/TopBar.tsx` (new)

**Suggested Claude Code prompt**:
> Build the admin shell per [docs/admin-design.md](../admin-design.md).
>
> Two layouts via Tailwind responsive classes:
>
> **Mobile (< 768px)**:
> - `<TopBar>` at top: page title left, contextual "Add" button right (where applicable)
> - Main content scrollable
> - `<BottomNav>` fixed at bottom: 4 tabs — Products, Categories, Orders, Home. Active tab indicated by brand orange + filled icon.
> - Avatar icon in top right → tap to open a slide-up sheet with Account / Settings / Logout
>
> **Desktop (≥ 768px)**:
> - `<Sidebar>` on left, 220px expanded / 60px collapsed (collapse via toggle). Sections: Products, Categories, Orders, Home, Settings, separator, Logout, "View store" link.
> - Top bar same but with admin name + avatar dropdown
>
> Style with the existing tokens. Brand black for nav backgrounds. Active item highlighted in brand orange.
>
> Test on iPhone 14 width AND 1440px desktop.

**Verification commands**:
```bash
pnpm dev
# DevTools → device toolbar → iPhone 14
# Open /admin → see bottom nav with 4 tabs, top bar with title
# Tap each tab → navigates
# Switch to desktop width → sidebar appears, bottom nav hides
```

**Acceptance criteria**:
- [ ] Mobile: bottom nav, top bar, slide-up account sheet
- [ ] Desktop: sidebar, top bar
- [ ] All 4 nav links work
- [ ] Active section highlighted
- [ ] Logout works
- [ ] Touch targets ≥ 44px on mobile
- [ ] Lighthouse a11y ≥ 95
- [ ] Commit: `feat(phase-1): mobile-first admin layout`

---

## Task 1.4 — Admin login page

**Files to touch**:
- `src/app/admin/login/page.tsx` — rewrite

**Suggested Claude Code prompt**:
> Rebuild `/admin/login`:
>
> - Centered card on mobile + desktop
> - Email + password fields
> - "Sign in" button
> - On submit: `backend.adminLogin(email, password)` → on 200, setAdminAuth + redirect to `?returnTo=` or `/admin`. On 401, inline error "Invalid credentials".
> - "Forgot password?" link → mailto:ketan18710@gmail.com (no flow for v1)
> - Match the visual style of the existing storefront login (Phase 3 will build that — for now, just use design tokens)
>
> Test with mock creds: `admin@test.local` / `admin123`.

**Acceptance criteria**:
- [ ] Login works with mock creds
- [ ] Bad credentials show inline error
- [ ] Mobile responsive
- [ ] Commit: `feat(phase-1): admin login page`

---

## Task 1.5 — Products list page

**Files to touch**:
- `src/app/admin/products/page.tsx` — rebuild as card grid
- `src/components/admin/ProductCard.tsx` (new — admin variant of the card)
- `src/components/admin/StatusPill.tsx` (new — reusable across admin)
- `src/components/admin/SearchBar.tsx` (new)
- `src/components/admin/FilterChips.tsx` (new)

**Suggested Claude Code prompt**:
> Build the products list per [admin-design.md "Products list" section](../admin-design.md).
>
> - Search bar at top (live filter, debounced 250ms)
> - Filter chips below: All / Active / Draft / Archived / Bestseller / New / Featured (multi-select where appropriate)
> - Card grid (1 column mobile, 2-3 columns desktop)
> - Each `<ProductCard>`:
>   - Primary image (or placeholder)
>   - Product name
>   - Min price (with strike-through MRP if there's a sale)
>   - SKU count
>   - Status pill
>   - Bestseller/New/Featured icon badges
>   - Three-dot menu (long-press on mobile, hover on desktop): Edit, Duplicate, Archive, View on storefront
> - Tap card → navigates to `/admin/products/:id/edit`
> - Floating action button (mobile) bottom-right: "+" → /admin/products/new
> - Desktop: "Add product" button in the top bar
>
> Fetch products via `backend.adminListProducts(filters)`. Use react-query or SWR for client cache (install if not already — recommend SWR, it's lightweight).

**Verification commands**:
```bash
pnpm dev
# /admin/products → cards visible
# Search "lavender" → filters live
# Click a filter chip → applies
# Click a card → navigates to edit
# FAB on mobile bottom-right
```

**Acceptance criteria**:
- [ ] Card grid renders
- [ ] Search debounced
- [ ] Filter chips work, can multi-select
- [ ] Mobile responsive
- [ ] FAB / Add button accessible
- [ ] Lighthouse a11y ≥ 95
- [ ] Commit: `feat(phase-1): admin products list`

---

## Task 1.6 — Product editor (single page with accordion sections)

**Files to touch**:
- `src/app/admin/products/new/page.tsx`
- `src/app/admin/products/[id]/edit/page.tsx`
- `src/components/admin/ProductEditor.tsx` (new — main form, shared between new/edit)
- `src/components/admin/StickySaveBar.tsx` (new)
- `src/components/admin/AccordionSection.tsx` (new)
- `src/components/admin/VisibilityToggles.tsx` (new)

**Suggested Claude Code prompt**:
> Build the product editor per [admin-design.md "Product editor" section](../admin-design.md).
>
> Single page with accordion sections. Use react-hook-form + zod (resolver: `zodResolver(AdminProductCreateSchema)`).
>
> Sections (collapsed by default for existing products; expanded for new):
> 1. **Basics**: name, slug (auto-generated, editable), description (textarea), category select
> 2. **Images**: → use `<ImageUploader>` from Task 1.7 (built next)
> 3. **Variants & pricing**: → use `<VariantsEditor>` from Task 1.8 (built after)
> 4. **Visibility**: `<VisibilityToggles>` — Active/Draft, Bestseller, New, Featured, Pin to top of category
> 5. **Specs**: name + value pairs, "Add row" button, ✕ to remove
> 6. **Included accessories**: text list, add row
> 7. **Danger zone** (existing only): Archive button, Delete button (with confirm modal)
>
> Sticky save bar at bottom:
> - Left: status pill ("Draft" / "Unsaved changes" / "Saved 2 sec ago")
> - Right: "Save" button (or "Update") + "Preview" link (opens storefront in new tab)
>
> Auto-save:
> - On any field change, debounce 1.5s → PATCH (existing) or POST (new — first save converts new → existing)
> - Show "Saving..." then "Saved Xs ago" (rotating timer)
>
> Test on mobile width. Accordion sections collapsible by tap.

**Verification commands**:
```bash
pnpm dev
# /admin/products/new → empty editor
# Fill name + category → save → status pill turns "Saved 2 sec ago"
# /admin/products/1/edit → existing product loads
# Type in name → "Saving..." appears → "Saved Xs ago"
# Click "Preview" → opens storefront in new tab
```

**Acceptance criteria**:
- [ ] Form renders all sections
- [ ] Auto-save works
- [ ] Validation errors show inline
- [ ] Status pill reflects state
- [ ] Sticky save bar always visible
- [ ] Mobile responsive
- [ ] Commit: `feat(phase-1): product editor with auto-save`

---

## Task 1.7 — Image uploader component

**Files to touch**:
- `src/components/admin/ImageUploader.tsx` (new)
- `next.config.ts` — add Supabase Storage to image domains

**Suggested Claude Code prompt**:
> Build `<ImageUploader value={urls} onChange={setUrls}>`.
>
> Features per [admin-design.md "Image upload component"](../admin-design.md):
> - Drag-drop the whole zone (use `react-dropzone` or native HTML5)
> - "Choose photo" button → opens file picker (camera roll on mobile)
> - Paste support (clipboard images)
> - Validate: type starts with `image/`, size ≤ 5MB
> - On select: upload via `backend.adminUpload(file)` → returns `{ url }`
> - Show progress as bytes uploaded ("Uploading 2.3 MB...")
> - On success: append URL to value, show thumbnail in grid
> - Grid of thumbnails with drag-reorder (use `@dnd-kit/sortable`)
> - First image has "Primary" badge
> - ✕ on each thumbnail to remove
> - On upload fail: inline retry button + specific error message
>
> Also update `next.config.ts` `images.remotePatterns` to allow:
> ```ts
> { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }
> { protocol: "https", hostname: "placeholder.com", pathname: "/**" }  // for MSW mock URLs
> ```
>
> Don't roll your own drag-drop — use `@dnd-kit/sortable`.

**Verification commands**:
```bash
pnpm dev
# /admin/products/new
# Drag an image into the upload zone → see progress → thumbnail appears
# Drag thumbnails to reorder → first one shows "Primary"
# Try a 10MB image → rejected with size error
# Try a PDF → rejected with type error
```

**Acceptance criteria**:
- [ ] Drag-drop works
- [ ] File picker works on mobile (opens camera roll)
- [ ] Progress visible
- [ ] Thumbnails draggable
- [ ] Primary badge on first
- [ ] Validation errors specific
- [ ] Commit: `feat(phase-1): image uploader component`

---

## Task 1.8 — Variants & pricing editor (the trickiest UI)

**Files to touch**:
- `src/components/admin/VariantsEditor.tsx` (new)

**Suggested Claude Code prompt**:
> Build the variants & pricing editor per [admin-design.md "Variants & pricing UI"](../admin-design.md).
>
> Top: "I have no variants" toggle. If on → single price/sale inputs only.
>
> Otherwise:
>
> **Dimensions section** (top half):
> - List of dimensions (e.g. "Size", "Weight")
> - Each has: name input, value list (e.g. "24×18", "32×20"), "+ Add value" button
> - "+ Add dimension" button
> - Drag handles to reorder dimensions
> - ✕ to remove a dimension (warns if SKUs reference it)
>
> **SKU matrix** (bottom half):
> - Auto-generated from dimension combinations
> - Each SKU shown as a card:
>   - Dimension values badge ("Size: 24×18, Weight: Heavy")
>   - Code input
>   - Price input
>   - Sale price input (optional)
>   - Stock input (optional)
> - Adding/removing dimension values auto-regenerates the matrix (preserving existing SKU data where the combination still exists)
> - Bulk action: "Set all prices" → modal with single price input that applies to all SKUs that don't have a custom price set
>
> This is the most complex component in the admin. Test thoroughly:
> - Empty (no dimensions) → single-price mode
> - 1 dimension with 3 values → 3 SKUs
> - 2 dimensions with 2 and 3 values → 6 SKUs
> - Removing a value → SKUs referencing it are removed
> - Adding a new value → new SKUs added with default empty fields

**Verification commands**:
```bash
pnpm dev
# Click through the matrix logic with various dimension combinations
# Mobile: should be usable, may scroll horizontally for wide matrices
```

**Acceptance criteria**:
- [ ] Single-price mode works
- [ ] Multi-dimension matrix works
- [ ] Adding/removing dimension values regenerates correctly without losing data
- [ ] Bulk "Set all prices" works
- [ ] Mobile usable (acceptable for matrix to scroll horizontally)
- [ ] Commit: `feat(phase-1): variants & pricing editor`

**Pitfalls**:
- The matrix gets unwieldy past 3 dimensions × 5 values. Document a soft limit in the UI ("Pro tip: keep variants under 4 dimensions").
- When generating new SKUs from combinations, use deterministic ordering so re-renders don't shuffle the list.

---

## Task 1.9 — Categories tree page

**Files to touch**:
- `src/app/admin/categories/page.tsx` — rewrite
- `src/components/admin/CategoryTree.tsx` (new)
- `src/components/admin/CategoryEditor.tsx` (new — inline drawer)

**Suggested Claude Code prompt**:
> Build categories per [admin-design.md "Categories"](../admin-design.md).
>
> Tree view:
> - Each row: indent based on depth, drag handle, name, child/product count badges, edit + add-subcategory + delete buttons
> - Drag to reorder (within same parent) using `@dnd-kit/sortable`
> - Tap row → opens edit drawer (slides in from right on desktop, full-screen on mobile)
>
> Edit drawer:
> - Name, parent (dropdown of root categories — can move to root or another root parent)
> - Description
> - Image URL (with ImageUploader)
> - Sort order (read-only — show current; reorder via drag)
> - Save button
>
> Delete: if category has children or products, show counts in confirm dialog; otherwise standard confirm.

**Acceptance criteria**:
- [ ] Tree renders with proper indentation
- [ ] Drag-reorder works
- [ ] Edit drawer works on mobile + desktop
- [ ] Delete blocked when has deps, with helpful message
- [ ] Commit: `feat(phase-1): categories tree page`

---

## Task 1.10 — Home composer

**Files to touch**:
- `src/app/admin/home/page.tsx` (new)
- `src/components/admin/HomeComposer.tsx` (new)
- `src/components/admin/SectionEditor.tsx` (new — modal per section)

**Suggested Claude Code prompt**:
> Build the home composer per [admin-design.md "Home composer"](../admin-design.md). This is the marketing control center.
>
> Section list view:
> - Vertical list of all 6 home sections (hero, categories, bestsellers, new, featured, promo)
> - Each row: drag handle, section name + icon, toggle switch (enabled), edit button (where applicable)
> - Drag to reorder
> - "Save changes" button at top right (explicit save, not auto-save — home page is high-stakes)
> - "Discard changes" link to revert
>
> Section editors (modals or drawers):
>
> **Hero**:
> - Image upload (1200×600 recommended note)
> - Title input
> - Subtitle input
> - CTA text + CTA link (dropdown: "/category/<slug>" options + "Custom URL" option)
> - Schedule (optional): "Show from" / "Show to" date pickers
> - Live preview below
>
> **Featured**:
> - Two-pane layout (desktop) / tabs (mobile)
> - Left: search box + scrollable list of all active products
> - Right: drag-drop list of selected products
> - Drag from left to right to add; drag within right to reorder; ✕ to remove
>
> **Categories**:
> - Pick 4 root categories
> - Drag to reorder
> - Each shows category name + image preview
>
> **Promo**: similar to Hero but smaller
>
> **Bestsellers / New**: no editor — they auto-populate from product flags. Show a tooltip explaining this.
>
> All edits update a local state. "Save changes" sends `PUT /api/admin/home` with the full config.
>
> Test thoroughly on mobile.

**Verification commands**:
```bash
pnpm dev
# /admin/home
# Drag sections to reorder, toggle a few off
# Open hero editor, change title + image
# Save changes
# Refresh → state persists (via mock)
```

**Acceptance criteria**:
- [ ] Section list drag-reorder works
- [ ] Toggles work
- [ ] Each section editor works
- [ ] Save sends full PUT to /admin/home
- [ ] Mobile responsive
- [ ] Commit: `feat(phase-1): home composer`

---

## Task 1.11 — Settings page

**Files to touch**:
- `src/app/admin/settings/page.tsx` (new)

**Suggested Claude Code prompt**:
> Build settings per [admin-design.md "Settings"](../admin-design.md). Single page with sections:
> - Store info: name, support phone, support email, address (textarea)
> - Tax: GST rate (number)
> - Shipping: free-above amount, flat-below fee
> - WhatsApp number
> - Save button top right
>
> Use react-hook-form + zod (`SettingsSchema` from contracts).

**Acceptance criteria**:
- [ ] All fields editable
- [ ] Save works (PATCH /api/admin/settings)
- [ ] Mobile responsive
- [ ] Commit: `feat(phase-1): settings page`

---

## Task 1.12 — Orders + Audit log stub pages

**Context**: Phase 4 builds full orders. For Phase 1, scaffold the page with a "coming in Phase 4" placeholder. Audit log is real but minimal (just a list).

**Suggested Claude Code prompt**:
> 1. `/admin/orders/page.tsx`: nice "Orders coming in Phase 4" empty state with explanation + link to current `/cart` (so admin can see WhatsApp-based orders are happening through there for now).
>
> 2. `/admin/audit/page.tsx`: simple table — timestamp, actor email, action, resource type+id, "View JSON" button (expands to show full changes).
>
> Both accessible from admin nav.

**Acceptance criteria**:
- [ ] Orders page exists with friendly placeholder
- [ ] Audit log lists recent entries
- [ ] Commit: `feat(phase-1): orders + audit log scaffold pages`

---

## Task 1.13 — Smoke test the entire admin

**Suggested Claude Code prompt**:
> Run a full admin smoke test (against MSW mocks):
>
> 1. Open /admin → bounces to /admin/login
> 2. Log in with admin@test.local / admin123
> 3. Land on /admin (products list)
> 4. Add a new product with all sections filled in (basics, 2 images, 1 dimension + 3 SKUs, 2 specs, 1 accessory, set Featured = on)
> 5. Save → product appears in list with Featured badge
> 6. Edit it: change price, save → list updates
> 7. Navigate to Categories → create a new subcategory under Kitchen Sinks
> 8. Navigate to Home → drag categories above bestsellers, edit hero (change title), save
> 9. Navigate to Settings → change GST to 19, save
> 10. Logout → /admin/login
>
> Repeat the entire flow on iPhone 14 width (DevTools).
>
> Run `pnpm test`, `pnpm typecheck`, Lighthouse on /admin and /admin/products. Aim for perf ≥ 90, a11y ≥ 95.

**Acceptance criteria**:
- [ ] All 10 steps pass on mobile + desktop
- [ ] No console errors
- [ ] Lighthouse meets bar
- [ ] Phase 1 status updated to "done (mocked)" in README
- [ ] Commit any final fixes
- [ ] **Coordinate with BE intern**: prepare for M1 integration milestone

---

## Common pitfalls across this phase

- **Trying to ship admin pages all at once.** Build, ship, dogfood each one before moving to the next. Order: layout → login → products list → product editor → image uploader → variants → categories → home composer → settings → smoke test.
- **MSW not catching SSR fetches**: Next.js Server Components run on the server, where MSW needs the Node setup (`src/mocks/node.ts`). If admin pages SSR (they probably shouldn't — make them client components), make sure Node MSW is wired.
- **next/image errors on Supabase Storage URLs**: add the domain to `next.config.ts` `images.remotePatterns`. Common forgotten step.
- **Sticky save bar covering content**: ensure main scroll area has `padding-bottom: 80px` to clear the sticky bar.
- **Auto-save sending too aggressively**: debounce ≥ 1s, not 100ms.
- **Toggle switches not accessible**: use a real `<input type="checkbox" role="switch">` or a tested headless library, not a divv-on-click impl.

## What's next

→ Phase 2: [Storefront swap](./phase-2-read-paths.md) — the public storefront migrates from in-memory data.ts to the real backend.

Before moving on, do [M1 — Integration milestone](../integration-milestones.md) with the BE intern.
