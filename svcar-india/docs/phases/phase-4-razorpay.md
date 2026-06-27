# Phase 4 (Frontend) — Razorpay Checkout

> Renumbered from Phase 3 → Phase 4 on 2026-05-28. Admin was built in Phase 1 and is already live.

## What you'll build

The checkout experience from cart → address → payment → success. Razorpay's Standard Checkout modal handles the actual payment UI. After this phase, customers can actually buy things.

## Prerequisites

- [ ] Backend Phase 3 complete — `/checkout/order`, `/checkout/verify`, `/me/orders` all live
- [ ] `@svcar/contracts@0.3.0` installed in this repo
- [ ] Razorpay test mode `KEY_ID` known (public — safe to ship in client JS)
- [ ] [TODO confirm with Ketan] Domain set up for production Razorpay (test mode works on any domain)

## Success criteria

- A logged-in customer can complete a test-mode order via UPI and via card
- Order summary shows itemized subtotal + shipping + GST + total
- Address can be entered inline OR picked from saved addresses
- Order success page shows order number and confirmation message
- `/orders` shows past orders; `/orders/:orderNumber` shows details
- WhatsApp deep-link checkout is kept as a "having trouble?" fallback
- Lighthouse perf still ≥ 85 on /checkout

## Estimated effort

2 sessions (~6 hours).

---

## Task 3.1 — Extend `backend` client with checkout/order methods

**Files to touch**:
- `src/lib/backend.ts`

**Suggested Claude Code prompt**:
> Add to `src/lib/backend.ts`:
>
> - `createOrder(payload: CreateOrderRequest)` → POST /checkout/order, returns `CreateOrderResponse`
> - `verifyOrder(payload)` → POST /checkout/verify
> - `getOrders(cursor?)` → GET /me/orders
> - `getOrder(orderNumber)` → GET /me/orders/:orderNumber
>
> All require auth. All parse with corresponding contract schemas. Use the authenticated fetcher.

**Acceptance criteria**:
- [ ] 4 new methods exist
- [ ] All typed against contracts schemas
- [ ] `pnpm typecheck` passes

---

## Task 3.2 — Address management

**Context**: Customer needs to enter or pick a shipping address before paying.

**Files to touch**:
- `src/components/checkout/AddressForm.tsx` (new)
- `src/components/checkout/AddressList.tsx` (new)
- `src/lib/backend.ts` — add address CRUD methods
- [TODO confirm with backend intern] backend `/me/addresses` endpoints exist or need adding

**Suggested Claude Code prompt**:
> Build:
>
> 1. `AddressForm` — controlled form with fields: line1, line2, city, state (dropdown of Indian states), pincode (6 digits), landmark, label (Home/Office/Other), isDefault checkbox. Validate pincode format. Submit calls `backend.createAddress(payload)`.
>
> 2. `AddressList` — fetches `backend.listAddresses()`, shows radio-selectable cards, with edit/delete buttons per address. "Add new address" button opens AddressForm in a drawer.
>
> 3. Style with existing design tokens. Mobile-first.
>
> [If backend doesn't yet have /me/addresses endpoints, flag this to the BE intern. Backend tasks: GET/POST /me/addresses, PATCH/DELETE /me/addresses/:id.]

**Verification commands**:
```bash
pnpm dev
# Manually create 2 addresses via /checkout (after Task 3.3 exists) or via curl
```

**Acceptance criteria**:
- [ ] Customer can create/edit/delete saved addresses
- [ ] Indian states dropdown is complete
- [ ] Pincode validation
- [ ] Default address concept works
- [ ] Commit: `feat(phase-3): address management UI`

---

## Task 3.3 — `/checkout` page (3 steps)

**Context**: Single-page checkout split into Address → Review → Pay sections (no full page navigations).

**Files to touch**:
- `src/app/(store)/checkout/page.tsx` (new)
- `src/components/checkout/CheckoutSummary.tsx` (new)
- `src/components/checkout/PayButton.tsx` (new)

**Suggested Claude Code prompt**:
> Create `/checkout` (client component, requireAuth — redirect to `/login?returnTo=/checkout`).
>
> Layout: two columns on desktop (left = address + items, right = sticky summary). Mobile = stacked.
>
> Section 1 — Address:
> - If user has saved addresses, show `AddressList`. Selecting one sets `selectedAddressId`.
> - Otherwise show `AddressForm` inline.
> - "Add new" button toggles between list and form.
>
> Section 2 — Items recap:
> - List of cart items (read from authenticated `backend.getCart()` — never trust localStorage at this point)
> - Each item shows image, name, variant, qty, line total
> - "Edit cart" link → /cart
>
> Section 3 — Summary (sticky on desktop):
> - Subtotal
> - Shipping fee (highlighted "Free" if applicable)
> - GST 18%
> - Total
> - "Pay ₹X" button (disabled until address is picked) → triggers Task 3.4 flow
> - "Having trouble? Order on WhatsApp" link (fallback to existing WhatsApp deep-link)
>
> Loading states: skeleton on initial load, button shows spinner during payment.

**Verification commands**:
```bash
pnpm dev
# /checkout with empty cart → redirect to /cart with a message
# /checkout with items + no address → form shown
# /checkout with items + saved address → list shown, Pay button enabled
```

**Acceptance criteria**:
- [ ] /checkout page loads for logged-in users
- [ ] Empty cart redirects gracefully
- [ ] Summary math matches backend (verify with a real cart)
- [ ] Mobile layout doesn't break
- [ ] Commit: `feat(phase-3): /checkout page layout`

---

## Task 3.4 — Razorpay Checkout integration

**Context**: When customer clicks "Pay", we call our backend's `/checkout/order` to get a Razorpay order id, then open Razorpay's hosted modal.

**Files to touch**:
- `src/components/checkout/PayButton.tsx`
- `src/app/(store)/checkout/page.tsx`
- `next.config.ts` — allowlist `checkout.razorpay.com` for CSP if needed

**Suggested Claude Code prompt**:
> Build the payment flow.
>
> 1. In `<head>` (via Next.js Script component in layout or this page), load `https://checkout.razorpay.com/v1/checkout.js`. Set `strategy="lazyOnload"` — we don't need it on initial render.
>
> 2. `PayButton` onClick:
>    a. Set local loading state
>    b. Call `backend.createOrder({ addressId, notes })` — returns `{ razorpayOrderId, razorpayKeyId, amount, orderNumber }`
>    c. Open Razorpay Checkout:
>       ```ts
>       const rzp = new window.Razorpay({
>         key: response.razorpayKeyId,
>         amount: response.amount * 100,  // paise
>         currency: "INR",
>         order_id: response.razorpayOrderId,
>         name: "Svcar India",
>         description: `Order ${response.orderNumber}`,
>         image: "/uploads/logo/logo.webp",
>         prefill: { contact: user.phone.replace("+91", ""), email: user.email ?? "", name: user.name ?? "" },
>         theme: { color: "#E8822A" },
>         handler: async (rp) => {
>           // Called on success
>           await backend.verifyOrder({ razorpayOrderId: rp.razorpay_order_id, razorpayPaymentId: rp.razorpay_payment_id, razorpaySignature: rp.razorpay_signature });
>           router.push(`/orders/${response.orderNumber}?just=paid`);
>         },
>         modal: {
>           ondismiss: () => { setLoading(false); /* user closed modal */ }
>         }
>       });
>       rzp.open();
>       ```
>    d. Handle: backend createOrder failure (show error), verifyOrder failure (show error + escalation to WhatsApp).
>
> 3. After successful verifyOrder, clear the local cart store too (in case the user is on the original tab).
>
> CSP note: if you set Content-Security-Policy headers, allow `checkout.razorpay.com` and `https://api.razorpay.com`.

**Verification commands**:
```bash
pnpm dev
# As logged-in user with an item in cart:
# 1. /checkout → enter address → click Pay
# 2. Razorpay modal opens
# 3. Test card: 4111 1111 1111 1111, any future expiry, any CVV, 3D OTP: 5555
# 4. Modal closes on success → redirect to /orders/VE...
# 5. Open backend /me/orders/VE... — status is "paid"
```

**Acceptance criteria**:
- [ ] Razorpay modal opens with correct order id
- [ ] Test card flow completes
- [ ] verifyOrder runs and updates state
- [ ] Cart cleared after success
- [ ] On modal dismiss without payment, button re-enables
- [ ] On verify failure, error shown + WhatsApp fallback offered
- [ ] Commit: `feat(phase-3): Razorpay Checkout integration`

**Pitfalls**:
- The Razorpay script appends a global `window.Razorpay`. TypeScript will complain — add a `declare global { interface Window { Razorpay: any } }` or use `@types/razorpay-checkout` if it exists.
- On flaky network, the modal-handler may call `verifyOrder` and then fail; Razorpay's webhook still catches it server-side. UI should show "Payment received, confirming order..." not error.

---

## Task 3.5 — Order success page (`/orders/:orderNumber?just=paid`)

**Files to touch**:
- `src/app/(store)/orders/[orderNumber]/page.tsx` (new)

**Suggested Claude Code prompt**:
> Create `/orders/:orderNumber` (client component, requireAuth).
>
> Fetch `backend.getOrder(orderNumber)`. Show:
>
> - "Order placed successfully" celebration state if `?just=paid` is in URL (one-time only — clean the query param after first render)
> - Order number, date, status badge (color-coded)
> - Shipping address card
> - Item list with images, names, variants, qtys, prices
> - Totals breakdown matching what they saw at checkout
> - "Need help?" button → WhatsApp deep-link with order number pre-filled
> - "Continue shopping" → /
>
> 404 state if order not found.

**Verification commands**:
```bash
pnpm dev
# After completing a test order, you'll be redirected here.
# Refresh — celebration state should disappear (or be ?just=paid only).
# Try /orders/INVALID → 404
```

**Acceptance criteria**:
- [ ] Order detail renders correctly
- [ ] Celebration state shown once after payment
- [ ] 404 for unknown order
- [ ] WhatsApp help link works
- [ ] Commit: `feat(phase-3): order detail / success page`

---

## Task 3.6 — `/orders` history page

**Files to touch**:
- `src/app/(store)/orders/page.tsx` (new)

**Suggested Claude Code prompt**:
> Create `/orders` (client, requireAuth).
>
> Fetch `backend.getOrders()`. Show:
>
> - Header "My Orders"
> - Cards: each shows order number, date, status badge, total, first item image + count of items, "View details" → /orders/:orderNumber
> - Pagination via cursor (load more button)
> - Empty state with "Start shopping" CTA → /

**Acceptance criteria**:
- [ ] /orders shows logged-in user's orders
- [ ] Pagination works
- [ ] Empty state shows correctly
- [ ] Each card links to detail page
- [ ] Commit: `feat(phase-3): orders history page`

---

## Task 3.7 — Header "My Orders" link + cleanup

**Files to touch**:
- `src/components/store/Header.tsx`
- `src/app/(store)/cart/page.tsx` — keep WhatsApp button but de-emphasize

**Suggested Claude Code prompt**:
> In the user dropdown (Header), add "My Orders" link → /orders.
>
> In `/cart`, the existing "Order on WhatsApp" button now becomes the secondary CTA. Primary should be "Proceed to checkout" → /checkout (or /login?returnTo=/checkout if guest).
>
> For guests: show "Sign in to checkout" (primary) and "Order via WhatsApp" (secondary) — we can let guests use the WhatsApp fallback without requiring login.

**Acceptance criteria**:
- [ ] Logged-in user sees "My Orders" in header dropdown
- [ ] /cart shows Proceed to checkout (primary) + WhatsApp fallback (secondary)
- [ ] Guest flow shows Sign in to checkout
- [ ] Commit: `feat(phase-3): wire checkout into header + cart`

---

## Task 3.8 — End-to-end smoke test

**Suggested Claude Code prompt**:
> Walk through the full flow:
>
> 1. Sign in as a new user
> 2. Browse, add 2 products to cart (different SKUs)
> 3. Open /cart → click Proceed to checkout
> 4. Enter a new shipping address
> 5. Verify summary matches what backend computes
> 6. Click Pay → Razorpay test mode → use 4111 1111 1111 1111
> 7. Land on /orders/VE...?just=paid → see celebration
> 8. Refresh — celebration gone
> 9. Click "My Orders" → see the order in list
> 10. Wait 60s — check email arrives (backend Phase 3 Task 3.8)
>
> Run `pnpm typecheck && pnpm test`. Lighthouse on /checkout perf ≥ 85.

**Acceptance criteria**:
- [ ] All 10 steps pass
- [ ] Email arrives within 60s
- [ ] No console errors
- [ ] Lighthouse perf ≥ 85
- [ ] Phase 3 status updated
- [ ] Commit final fixes

---

## Common pitfalls across this phase

- **Razorpay modal can be blocked by aggressive ad blockers.** Show a fallback message "If the payment window didn't open, allow popups for svcar.com" + WhatsApp link.
- **Don't trust the modal-handler callback alone.** Backend webhook is the source of truth. If modal succeeds but verifyOrder fails (network blip), the order will still get marked paid by the webhook within a minute — show "Confirming your payment..." not an error.
- **State after success**: the Razorpay modal stays open until you call `rzp.close()` in handler. If you redirect immediately, the user sees a flash of the modal closing. Slight delay or fade is friendlier.
- **Test mode UPI**: in test mode, UPI shows simulated "success" / "failure" buttons. Try both paths.

## What's next

→ Phase 5: [Caching + observability](./phase-5-caching-and-obs.md) — production hardening (admin was built in Phase 1).
