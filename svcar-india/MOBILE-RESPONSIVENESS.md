# Mobile Responsiveness — How to Check It, Step by Step

A practical, repeatable way to verify the Svcar storefront + admin on small screens.
Tailwind v4 breakpoints in use: `sm = 640px`, `md = 768px`, `lg = 1024px`.

> The app is **mobile-first**: most layouts start single-column and add columns at
> `md`/`lg`. This guide tells you exactly what to look at, at which width, on every
> screen of the buying + admin flow.

---

## 0. Set up the test harness (once)

1. Open the site in Chrome/Edge, press **F12**, then click the **device toolbar** icon
   (`Ctrl/Cmd + Shift + M`).
2. Test at these four widths (top dropdown → "Responsive", type the width):
   - **360px** — small/older Android
   - **390px** — modern iPhone
   - **414px** — large iPhone
   - **768px** — iPad portrait (the `md` boundary)
3. For each width, scroll the **whole page** top-to-bottom and watch for the checks below.
4. Re-test in **dark mode** (the header theme toggle) — contrast can differ.
5. On a **real iPhone** if possible: form-field zoom + sticky bars behave differently than the simulator.

The golden rule at every width: **no horizontal scrollbar** on the page. If you can
swipe the page sideways, something is too wide — find it (see §2).

---

## 1. Per-screen checklist (walk the real flow)

Go through the app in the order a customer does. At each screen, run the checks.

### Header & navigation (every page) — `src/components/store/Header.tsx`
- [ ] Logo, search, account, cart, menu icons all visible and **easy to tap** (not cramped).
- [ ] Hamburger (`md:hidden`) opens/closes the mobile menu; it scrolls if long (`max-h-[70vh]`).
- [ ] **Category dropdowns:** on desktop (≥768px) hovering a nav item with subcategories
      opens its menu; on mobile the subcategories appear **indented under** the parent in the
      hamburger menu. (Managed in Admin → Home → "Store navbar".)
- [ ] Announcement bar marquee doesn't cause sideways scroll.

### Home — `src/app/(store)/page.tsx`
- [ ] Hero text wraps, doesn't overflow; CTA buttons stack/wrap.
- [ ] "Shop by Category" is a horizontal scroll strip on mobile, a 4-col grid on desktop.
- [ ] Product carousels swipe smoothly; cards keep their aspect ratio.

### Category list — `src/app/(store)/category/[slug]/page.tsx`
- [ ] Product grid: **1 col** at 360–640, **2 col** at `sm`, **3 col** at `lg`.
- [ ] Breadcrumb truncates long names instead of pushing the row wide.

### Product detail (PDP) — `src/components/store/ProductPageClient.tsx`
- [ ] Image + details **stack** on mobile, sit side-by-side at `lg`.
- [ ] Image carousel swipes; the dots are tappable.
- [ ] Title wraps; price, variant pickers and the Add-to-Cart button are full-width.
- [ ] Specs table doesn't force horizontal scroll on the page (it may scroll *within* its box).

### Cart — `src/app/(store)/cart/page.tsx`
- [ ] Each line: image + name + price + qty controls fit without overflow.
- [ ] Qty +/- buttons are comfortably tappable.
- [ ] Summary + "Proceed to checkout" are reachable without zoom.

### Login / OTP — `src/app/(store)/login`
- [ ] The 6 OTP boxes fit one row at 360px.
- [ ] Tapping a field does **not** zoom the page (see §3 — inputs are 16px on mobile).

### Checkout — `src/app/(store)/checkout/page.tsx`
- [ ] Address form fields stack to 1 column on mobile.
- [ ] Order summary stacks under the form on mobile, sticks beside it at `lg`.
- [ ] Pay button is full-width; the secure-payment line + error box wrap.

### Order confirmation — `src/app/(store)/orders/[orderNumber]/page.tsx`
- [ ] Tracking timeline, item list and totals all fit; the "track" link wraps.

### Legal + contact — `/privacy`, `/refund`, `/contact`, `/about`
- [ ] Long policy text wraps; the contact cards stack 1-col on mobile; map iframe is full-width.

### Admin — `src/app/admin/**`
- [ ] **Bottom tab bar** (`lg:hidden`) shows on mobile; **sidebar** (`lg:flex`) on desktop. Tabs respect the iPhone notch (safe-area padding).
- [ ] Product/category/order lists are card/stack layouts (no page-level sideways scroll).
- [ ] Editors: wide tables (e.g. the variant SKU matrix) scroll **inside their own box**
      (`overflow-x-auto`), not the whole page.
- [ ] Sticky "Save" bar sits above the bottom nav and doesn't cover the last field.
- [ ] Home → "Store navbar": ticking a category/subcategory updates instantly.

---

## 2. Hunting horizontal overflow (when you see a sideways scroll)

In DevTools console, paste this to list elements wider than the viewport:

```js
[...document.querySelectorAll('*')].filter(el => el.scrollWidth > document.documentElement.clientWidth)
```

Common causes in this codebase and the fix:
- A fixed pixel width (`w-[NNNpx]`, `min-w-[NNNpx]`) wider than the screen → make it
  responsive (`sm:min-w-[…]`) or wrap it in `overflow-x-auto`.
- A multi-column grid without a mobile prefix (`grid-cols-3`) → start at `grid-cols-1`.
- `whitespace-nowrap` on long text → allow wrapping or add `truncate`.
- A full-bleed `100vw` child. (The `body` already has `overflow-x: clip` as a safety net,
  but fix the real offender so layout isn't silently cut.)

---

## 3. Things already handled (don't re-fix)

- **Viewport** is declared in `src/app/layout.tsx` (`width=device-width, initial-scale=1`),
  and pinch-zoom is **not** disabled (accessibility).
- **Inputs are 16px on mobile** (`globals.css` `.input`) so iOS Safari doesn't auto-zoom on
  focus; trimmed to 14px from `sm` up.
- **Responsive grids** across product lists, PDP, cart, checkout, admin order detail.
- **next/image `sizes`** set on product/category images so mobile downloads smaller files.
- **Admin nav**: bottom tab bar on mobile, sidebar on desktop, with **safe-area-inset** padding.
- **Mobile menu** scrolls and nests subcategory links.

---

## 4. Lighthouse (final gate, on a deployed URL)

Run Lighthouse (DevTools → Lighthouse → **Mobile**) against the **production** URL, not a
local/preview build (preview perf ≠ prod). Targets: Performance ≥ 90, Accessibility ≥ 95,
SEO ≥ 95, Best-Practices ≥ 95. Re-run after each deploy.

---

## 5. Remaining polish (optional, low-risk)

These were flagged in review as nice-to-haves; none break layout today:
- Bump the header icon buttons (`p-2.5`) toward a 44px tap target if they feel tight.
- Enlarge the PDP carousel dots' tappable area and the cart qty buttons.
- Tighten the breadcrumb truncation width at 360px.
