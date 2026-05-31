# Admin Design Principles (Frontend)

This is the source of truth for how the admin panel looks and behaves on the frontend. Backend implications are in [veronica-api/docs/admin-design.md](../../veronica-api/docs/admin-design.md).

## Who you're designing for

The merchant — Ketan or store staff. **Not technically educated.** Will use this daily, often from a phone.

## Top-level principles

1. **Mobile-first.** Bottom-nav layout. Touch targets ≥ 44px. Drag-drop from phone camera roll.
2. **Cards, not tables.** Image-heavy. Easier to scan.
3. **Toggles, not checkboxes.** "Show on home" is a switch.
4. **Inline edits.** Tap price → edit in place.
5. **No JSON, no SQL, no terminal.** UI for everything.
6. **Live preview.** "View on storefront" link on every relevant screen.
7. **Sticky save bar.** Bottom-anchored, always visible on long forms.
8. **One-handed thumb-zone.** Most-used buttons in the bottom 1/3 of the screen on mobile.

## Layout

### Mobile (≤ 768px)
- **Bottom tab nav** (4 tabs): Products / Categories / Orders / Home
- **Top bar**: page title left, "Add" CTA right (where applicable)
- **Profile / Logout** in a slide-up sheet from a top-right avatar icon
- Forms scroll within the page; sticky save bar at bottom (above tab nav)

### Desktop (> 768px)
- **Left sidebar** (collapsible, 60px collapsed / 220px expanded): same 4 sections + Settings + Account
- **Top bar**: page title + admin name + logout dropdown
- Cards in a grid (2-3 columns); forms use a 2-column layout where appropriate

## Color & typography

Reuses storefront design tokens from [src/app/globals.css](../src/app/globals.css):

- Primary actions: brand orange (`#E8822A`)
- Destructive actions: danger red (`#DC2626`)
- Status pills: existing `.status-pending`, `.status-confirmed`, etc.
- Cards: white with subtle shadow (`var(--shadow-card)`)
- Background: `var(--color-surface-dim)` for the admin canvas
- Sidebar: brand black (`#0A0A0A`)
- Font: Inter (already loaded via `next/font`)

## Section-by-section spec

### Products list

**Mobile**:
- Search bar at top (live filter by name)
- Filter chips below: Active / Draft / Archived / Bestseller / New / Featured
- Vertical scroll of product cards:
  ```
  ┌──────────────────────┐
  │  ┌──┐  Lavender Sink │
  │  │📷│  ₹3,060 · 3 SKUs│
  │  └──┘  [Active] ●●● │
  └──────────────────────┘
  ```
- Tap card → opens product editor (full screen)
- Long-press card → quick actions menu (Duplicate, Archive, View on storefront)
- "+" floating action button bottom-right for "Add product"

**Desktop**:
- Same data in a 3-column card grid
- Hover on card reveals quick edit icons

### Product editor

**Layout**: single screen, accordion sections, sticky save bar at bottom.

Accordion sections (collapsed by default after first save; expanded when creating):
1. **Basics** — name, slug (auto, editable), description, category dropdown
2. **Images** — drag-drop zone + grid of uploaded images with reorder handles
3. **Variants & pricing** — dimensions + SKUs (most complex UI here)
4. **Visibility** — toggles for Active, Bestseller, New, Featured + category-pin position
5. **Specs** — name + value pairs (add row)
6. **Included accessories** — text list (add row)
7. **Danger zone** (existing products only) — Archive, Delete

**Sticky save bar** (bottom):
- Status pill at left ("Draft" / "Active" / "Unsaved changes")
- Save button at right (or "Update" for existing)
- "Preview" link → opens public storefront draft view in a new tab

**Auto-save**: as user types, debounce 1.5s → POST/PATCH a draft. Visual cue: "Saving..." → "Saved 2 sec ago".

### Variants & pricing UI (the trickiest)

The current Phase 0 schema supports N dimensions × M SKUs. The UI:

- **Dimensions** at top — a list of "Size, Color, etc.": tap "+" to add a dimension, name it, add values
- **SKU matrix** below — auto-generated from dimension combinations. Each row:
  ```
  ┌─────────────────────────────────────────┐
  │ Size: 24×18    Weight: Heavy            │
  │ Code [LAV-2418-H]                       │
  │ Price [₹3,200]   Sale [₹2,400] (-25%)   │
  │ Stock: (untracked)                      │
  └─────────────────────────────────────────┘
  ```
- Drag-drop to reorder dimensions
- Toggle "I have no variants" — replaces matrix with single price/sale input

### Image upload component

Used in product editor + home composer.

- **Drag-drop zone** that accepts files or paste (paste from clipboard supports phone screenshots)
- Or **"Choose photo"** button → opens phone photo picker / desktop file picker
- After upload: thumbnail with reorder handle and ✕ delete
- First image is automatically "primary" — small badge "Primary" on it
- Upload progress as a number ("Uploading 2.3 MB...") not a percentage (less misleading on slow networks)
- On upload fail: inline retry button, error message specific (not "something went wrong")

### Home composer

The home composer is the marketing control. Two views:

**Section list** (default view):
- Scrollable list of home sections, drag handles on left, toggle switch on right
- Tap a section → opens its editor
- Order in the list = order on the storefront

**Section editors**:

**Hero**:
- Image upload (1200×600 recommended)
- Title input
- Subtitle input
- CTA text + CTA link (dropdown of pages or custom URL)
- Schedule: "Show from" / "Show to" date pickers (optional)
- Preview pane below: shows how it'll look

**Featured**:
- Sidebar: searchable list of all active products
- Main area: drag-drop list of selected products (the curated featured set)
- Drag from sidebar → adds; drag within main area → reorders; ✕ to remove

**Categories**:
- Pick 4 root categories to display
- Drag to reorder
- Each shows preview of category image + name

**Promo banner**:
- Same as Hero but smaller
- Inserted between sections (location set by section order)

**Bestsellers / New arrivals**:
- No config (auto-populated from product flags)
- The section appears if at least 1 product has the flag; hidden otherwise

**"Save changes"** at top right of composer — explicit (not auto-saved, because changing home page is high-stakes).

### Orders (Phase 1 stub, Phase 4 full)

For Phase 1, just a placeholder page showing "Orders coming in Phase 4". After Phase 4, the full UI per [Phase 4 spec](./phases/phase-4-razorpay.md).

### Settings

Single page with sections:
- Store info: name, support phone, support email, address
- Tax: GST rate (number input, default 18%)
- Shipping: free-above amount + flat-below amount
- WhatsApp number (the deep-link target)

Save button at top-right (small form, doesn't need a sticky bar).

### Account

- Show admin's name, email, phone
- Change password (current + new + confirm)
- Logout button

## Loading states

- **Cards in a list**: skeleton cards (already exists in [Skeletons.tsx](../src/components/store/Skeletons.tsx))
- **Form fields during load**: greyed-out shimmer
- **Image upload**: progress + filename + ✕ to cancel
- **Auto-save**: small text in the corner of the sticky save bar
- **Page navigation**: a thin progress bar at top (Next.js handles this if `<NavigationEvents>` is used)

## Empty states

- **No products**: illustration + "Add your first product" CTA
- **No orders**: "Orders will appear here when customers buy"
- **No categories**: "Create your first category to organize products"
- **Search no results**: "No products match 'XYZ'. Try a different word."

Each empty state has a primary CTA.

## Error states

- **Network error**: inline banner with retry
- **Validation error**: inline below the field (red, with the specific issue)
- **Server 5xx**: full-page error with "Refresh" + "Contact support" links
- **Permission denied** (403): "Your session expired" → redirect to login

## Animations

- Cards: subtle hover-lift (4px translateY) on desktop only
- Modal / drawer: slide-up from bottom on mobile, fade-scale on desktop
- Save → success: green checkmark fades in/out (1.5s) in the sticky bar
- Drag-drop: slight shadow + opacity dip on the dragged item

## Accessibility

- Every form field has a label (visible OR aria-label)
- Color contrast meets WCAG AA
- Toggle switches have keyboard support (space to toggle)
- Focus rings visible (don't suppress with `outline: none` without a replacement)
- Form errors announced via `aria-live="polite"`

## Tech stack for admin UI

- Same Next.js app, under `src/app/admin/`
- Layout in `src/app/admin/layout.tsx` (already exists, will be rewritten in Phase 1)
- State management: Zustand (already in use)
- Forms: react-hook-form + zod (the contracts schemas)
- Drag-drop: `dnd-kit` (lighter than react-dnd, mobile-friendly)
- Date picker: native `<input type="date">` (works fine on mobile)
- Toast notifications: `sonner` (lightweight, well-typed)

## What gets built in Phase 1 vs later

**Phase 1 (must-have for merchant to start using)**:
- Admin login
- Products list + editor with all sections except home composer config (just toggle the flags)
- Categories tree
- Image upload
- Home composer (sections list + hero editor + featured editor + categories editor)
- Settings page
- Mobile + desktop both work
- Stubs for Orders and Audit log

**Phase 4** (when Razorpay is live):
- Real orders page with status transitions
- Refund flow

**Phase 5+ (polish, optional)**:
- Audit log viewer
- Schedule banner with calendar widget
- Bulk product operations
