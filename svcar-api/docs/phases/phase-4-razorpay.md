# Phase 4 (Backend) — Razorpay Checkout

> Renumbered from Phase 3 → Phase 4 on 2026-05-28. Per agent-council review: use UUID-hashed public order numbers (not sequential VEYYYYMMDDNNNNN); add stale-pending reconciliation cron at 15-min interval.

## What you'll build

Real payments. The customer goes from cart → checkout → Razorpay → paid order. You'll build the order lifecycle (`pending → paid → confirmed`), webhook handling, GST/shipping math, and the email-on-paid trigger via Inngest.

Endpoints delivered:
- `POST /checkout/order` — validates cart, computes totals, creates Razorpay order
- `POST /checkout/verify` — verifies signature, marks order paid, fires `order.paid` event
- `POST /webhooks/razorpay` — idempotent handler for `payment.captured`, `payment.failed`, `refund.processed`
- `GET /me/orders` — list user's orders
- `GET /me/orders/:orderNumber` — single order detail

## Prerequisites

- [ ] Phase 2 complete — auth + cart endpoints live
- [ ] [TODO confirm with Ketan] Razorpay account created, test mode credentials (KEY_ID, KEY_SECRET) available
- [ ] [TODO confirm with Ketan] Razorpay webhook secret generated (used for webhook signature verification)
- [ ] [TODO confirm with Ketan] GST rate: 18% is the standard rate for sanitaryware HSN codes 7324 / 8481 / 3922. Confirm with your CA before going live.
- [ ] [TODO confirm with Ketan] Shipping policy: keep current ₹200 below ₹5000, free above? Zone-based? CoD support yes/no for v1?
- [ ] [TODO confirm with Ketan] Inngest account or self-hosted instance? Recommendation: cloud (generous free tier).
- [ ] [TODO confirm with Ketan] Resend account for emails. Domain DNS records added.

## Success criteria

- A test-mode Razorpay order completes end-to-end via UPI + card
- The webhook is verified, idempotent, and updates the order status correctly
- An order confirmation email arrives within 60s of `payment.captured`
- GST + shipping math matches expected
- Race condition: customer hitting "Pay" twice doesn't create two orders or charge twice
- `@svcar/contracts@0.3.0` published

## Estimated effort

2-3 sessions (~8 hours).

---

## Task 3.1 — Set up Razorpay SDK + env

**Files to touch**:
- `apps/api/src/lib/razorpay.ts` (new)
- `apps/api/src/lib/env.ts`
- `apps/api/.env.example`

**Suggested Claude Code prompt**:
> Add Razorpay env vars to `apps/api/src/lib/env.ts`:
> - `RAZORPAY_KEY_ID: z.string().min(1)`
> - `RAZORPAY_KEY_SECRET: z.string().min(1)`
> - `RAZORPAY_WEBHOOK_SECRET: z.string().min(1)`
>
> Same in `.env.example` with placeholder format `rzp_test_xxx` / `rzp_live_xxx` and a comment explaining where to find each in the Razorpay dashboard.
>
> Install `razorpay` npm package. Create `apps/api/src/lib/razorpay.ts` exporting:
> - `createRazorpayClient(env)` — returns the Razorpay instance with key_id + key_secret
> - `verifyRazorpaySignature(orderId, paymentId, signature, secret): boolean` — uses HMAC-SHA256 per Razorpay docs
> - `verifyWebhookSignature(body, signature, secret): boolean` — for webhook handler
>
> Don't add tests yet (covered in Task 3.4).

**Verification commands**:
```bash
pnpm typecheck
```

**Acceptance criteria**:
- [ ] Razorpay env vars validated
- [ ] Razorpay helper module exists
- [ ] Commit: `feat(phase-3): add Razorpay SDK integration`

---

## Task 3.2 — GST + shipping calculation

**Context**: Order totals must be deterministic and explained line by line. Customers see this in the order summary.

**Files to touch**:
- `apps/api/src/lib/pricing.ts` (new)
- Tests

**Suggested Claude Code prompt**:
> Create `apps/api/src/lib/pricing.ts` with:
>
> ```ts
> export interface CartLine { unitPrice: number; qty: number; }
> export interface PricingResult {
>   subtotal: number;        // sum of unit_price * qty
>   shippingFee: number;     // ₹200 if subtotal < 5000 else 0
>   gstRate: number;         // 0.18 for now [TODO confirm with Ketan]
>   gstAmount: number;       // round((subtotal + shippingFee) * gstRate)
>   total: number;           // subtotal + shipping + gst
> }
> export function calculatePricing(lines: CartLine[]): PricingResult
> ```
>
> All math in paise (multiply by 100) to avoid floating-point errors. Convert back to rupees for the result.
>
> Tests:
> - empty cart → all zeros
> - subtotal ₹1000, 1 line → subtotal 1000, shipping 200, gst on 1200 = 216, total 1416
> - subtotal ₹6000 → free shipping, gst on 6000 = 1080, total 7080
> - rounding: ₹999.50 cart → consistent rounding (round half-up)

**Verification commands**:
```bash
pnpm test apps/api/tests/pricing.test.ts
```

**Acceptance criteria**:
- [ ] `calculatePricing` matches expected for ≥ 5 test cases
- [ ] No floating-point drift (paise math)
- [ ] GST rate is a constant that's easy to change
- [ ] Commit: `feat(phase-3): add GST + shipping pricing module`

**Pitfalls**:
- GST is on (subtotal + shipping), not just subtotal. Confirm with CA.
- Some states have different GST treatment; for v1 assume same across India. [TODO confirm with Ketan]

---

## Task 3.3 — `POST /checkout/order`

**Context**: Customer clicks "Pay now". We validate their cart against current DB prices (in case prices changed since adding to cart), compute totals, create a Razorpay order via API, and store our order row in `pending` state.

**Files to touch**:
- `apps/api/src/routes/checkout.ts` (new)
- `apps/api/src/app.ts`
- `packages/contracts/src/checkout.ts` (new)
- Tests

**Suggested Claude Code prompt**:
> Add `POST /checkout/order` (gated by `requireAuth`).
>
> In `packages/contracts/src/checkout.ts`:
> - `ShippingAddressSchema = z.object({ line1: z.string().min(1), line2: z.string().optional(), city: z.string(), state: z.string(), pincode: z.string().regex(/^\d{6}$/), landmark: z.string().optional() })`
> - `CreateOrderRequestSchema = z.object({ addressId: z.number().optional(), address: ShippingAddressSchema.optional(), notes: z.string().max(500).optional() })` (must have either addressId for saved, or address inline)
> - `CreateOrderResponseSchema = z.object({ orderId: z.string().uuid(), orderNumber: z.string(), razorpayOrderId: z.string(), razorpayKeyId: z.string(), amount: z.number(), currency: z.literal("INR") })`
>
> Handler:
> 1. Load user's cart (must have ≥ 1 item, else 400)
> 2. Re-fetch SKUs from DB (sale_price + price as of now); fail if any SKU is gone
> 3. Build lines with current prices (not stale cart-time prices)
> 4. Call `calculatePricing(lines)`
> 5. Resolve address: if `addressId`, fetch and verify ownership; else use inline `address`
> 6. Generate `orderNumber = VE + YYYYMMDD + 5-digit-sequence` (use a Postgres sequence or a simple atomic counter)
> 7. Insert into `orders` with status `pending`
> 8. Insert into `order_items` (snapshot product name, sku code, unit price, image, variant label)
> 9. Call Razorpay's `orders.create({ amount: total * 100, currency: "INR", receipt: orderNumber, notes: { user_id, order_number } })`
> 10. Update our order row with `razorpay_order_id`
> 11. Return response shape — DO NOT clear the cart (cleared on verify success)
>
> Wrap the DB writes in a transaction. Razorpay call is outside the transaction (idempotency: if Razorpay fails, our order stays pending forever — that's OK, a cron can clean up).
>
> Tests:
> - happy path: cart with 2 items → order created, razorpay order created, response valid
> - empty cart → 400
> - invalid address → 400
> - SKU no longer exists → 400 with which SKU

**Verification commands**:
```bash
pnpm test

# Manual (after seeding cart for a test user):
TOKEN="<access-token>"
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"address":{"line1":"123 Test St","city":"Delhi","state":"DL","pincode":"110001"}}' \
  http://localhost:8787/checkout/order
# Expect: { orderId, orderNumber, razorpayOrderId, razorpayKeyId, amount, currency: "INR" }
# Check Razorpay dashboard → Test Mode → Orders → see the new order
```

**Acceptance criteria**:
- [ ] Happy path creates DB order + Razorpay order
- [ ] Order number format: VEYYYYMMDDNNNNN
- [ ] Prices re-validated against DB (not cart snapshot)
- [ ] Cart NOT cleared yet
- [ ] Tests pass (≥ 4)
- [ ] Commit: `feat(phase-3): add POST /checkout/order`

**Pitfalls**:
- Generating `orderNumber` atomically: use Postgres `nextval('order_number_seq')` not in-app counters. Add the sequence in a migration.
- If user has stale cart with deleted SKU, fail fast with which SKU — don't quietly drop it.

---

## Task 3.4 — `POST /checkout/verify`

**Context**: After Razorpay's modal completes, the frontend sends us the `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`. We verify the signature, mark our order `paid`, fire the post-payment event.

**Files to touch**:
- `apps/api/src/routes/checkout.ts`
- `packages/contracts/src/checkout.ts`
- Tests

**Suggested Claude Code prompt**:
> Add `POST /checkout/verify` (gated by requireAuth).
>
> Request schema:
> ```ts
> VerifyOrderRequestSchema = z.object({
>   razorpayOrderId: z.string(),
>   razorpayPaymentId: z.string(),
>   razorpaySignature: z.string(),
> })
> ```
>
> Handler:
> 1. Validate body
> 2. Find our order by `razorpay_order_id` — 404 if not found
> 3. Verify it belongs to `c.get("userId")` — 403 if not
> 4. Verify signature: `HMAC_SHA256(razorpayOrderId + "|" + razorpayPaymentId, KEY_SECRET) === razorpaySignature`
> 5. If signature invalid: mark order status `cancelled`, log loudly, return 400
> 6. If valid: update order with `razorpay_payment_id`, `razorpay_signature`, status `paid`
> 7. Clear the user's cart (delete cart_items rows)
> 8. Fire Inngest event `order.paid` with order id (Task 3.7 implements this — for now, leave a // TODO)
> 9. Return `{ ok: true, orderNumber }`
>
> Idempotency: if the order is already in `paid` state, return 200 (don't error). The frontend may retry on flaky network.
>
> Tests:
> - valid signature → order paid, cart cleared
> - invalid signature → 400
> - other user's order → 403
> - already-paid → 200 (idempotent)

**Verification commands**:
```bash
pnpm test
# Full Razorpay e2e tested in FE Phase 3 (need the actual Checkout modal to generate a signature)
```

**Acceptance criteria**:
- [ ] Signature verification works
- [ ] Order transitions to `paid` correctly
- [ ] Cart cleared on success
- [ ] Idempotent
- [ ] Tests pass (≥ 4)
- [ ] Commit: `feat(phase-3): add POST /checkout/verify with signature check`

---

## Task 3.5 — `POST /webhooks/razorpay`

**Context**: Razorpay sends webhooks for `payment.captured`, `payment.failed`, `refund.processed`. This is the authoritative source: customer might close the browser before the verify-call, so we need webhooks to catch missed transitions.

**Files to touch**:
- `apps/api/src/routes/webhooks.ts` (new)
- `apps/api/src/app.ts`
- Tests

**Suggested Claude Code prompt**:
> Add `POST /webhooks/razorpay` (no auth — verified by webhook signature instead).
>
> Handler:
> 1. Read raw body (Hono's `c.req.raw.text()` — needed for signature verification)
> 2. Read `x-razorpay-signature` header
> 3. Verify: `HMAC_SHA256(rawBody, RAZORPAY_WEBHOOK_SECRET) === signature`. If invalid → 401
> 4. Parse JSON. Get `event` field.
> 5. Switch on event:
>    - `payment.captured`: extract `payload.payment.entity.order_id` → find our order by `razorpay_order_id`; if status is `pending` or `paid`, update to `paid` and store `razorpay_payment_id`. Idempotent on already-paid.
>    - `payment.failed`: log; for now, don't change order state (customer might retry). Phase 5 alerts on this.
>    - `refund.processed`: find order by `razorpay_payment_id` → update status to `refunded`.
> 6. Use Redis to track processed `event.id` for 7 days — return 200 immediately if already processed.
> 7. Always return 200 quickly (Razorpay retries on non-200 — we want at-least-once semantics).
> 8. Fire Inngest event for downstream work.
>
> Tests:
> - valid `payment.captured` → order paid
> - invalid signature → 401
> - duplicate event → 200 but no state change
> - `payment.failed` event → 200, no state change
> - unknown event type → 200 (don't crash)

**Verification commands**:
```bash
pnpm test

# Webhook testing in staging:
# 1. Use ngrok / cloudflared to expose local API: `cloudflared tunnel --url http://localhost:8787`
# 2. In Razorpay test mode dashboard, configure webhook URL → /webhooks/razorpay
# 3. Trigger a test payment via the frontend; observe webhook hit your local
```

**Acceptance criteria**:
- [ ] Signature verification works
- [ ] `payment.captured` marks order paid
- [ ] `refund.processed` marks order refunded
- [ ] Idempotency: duplicate events don't double-process
- [ ] Always 200 on parsing errors (don't trigger Razorpay retries on bugs)
- [ ] Tests pass (≥ 5)
- [ ] Commit: `feat(phase-3): add Razorpay webhook handler`

**Pitfalls**:
- Razorpay retries up to 24 hours on 5xx — your webhook handler MUST be idempotent.
- Don't use the JSON body for signature verification — use the raw request body bytes.

---

## Task 3.6 — `GET /me/orders` and `GET /me/orders/:orderNumber`

**Files to touch**:
- `apps/api/src/routes/me.ts` — extend
- `packages/contracts/src/order.ts` — populate

**Suggested Claude Code prompt**:
> Add to the /me router (already gated by requireAuth):
>
> Contract schemas in `packages/contracts/src/order.ts`:
> - `OrderListItemSchema = z.object({ id: z.string().uuid(), orderNumber: z.string(), total: z.number(), status: OrderStatusSchema, itemCount: z.number(), createdAt: z.string().datetime() })`
> - `OrderDetailSchema = OrderListItemSchema.extend({ subtotal: z.number(), shippingFee: z.number(), gstAmount: z.number(), shippingAddress: ShippingAddressSchema, items: z.array(OrderLineSchema), razorpayPaymentId: z.string().nullable() })`
> - `OrderLineSchema = z.object({ productName: z.string(), skuCode: z.string(), variantLabel: z.string().nullable(), imageUrl: UrlSchema.nullable(), unitPrice: z.number(), qty: z.number(), lineTotal: z.number() })`
>
> Routes:
> - `GET /orders`: list current user's orders, paginated by `cursor` (created_at), most-recent-first, limit 20
> - `GET /orders/:orderNumber`: full detail. 404 if not found OR not owned by user.
>
> Tests: list paginates, detail returns owned order, can't see other user's order.

**Verification commands**:
```bash
pnpm test
# Manual after creating a few orders via the FE flow.
```

**Acceptance criteria**:
- [ ] List endpoint works with pagination
- [ ] Detail returns line items
- [ ] Ownership enforced (can't see others' orders)
- [ ] Tests pass
- [ ] Commit: `feat(phase-3): add /me/orders endpoints`

---

## Task 3.7 — Inngest setup + `order.paid` handler

**Context**: Async work (sending email, future: WhatsApp notification, abandoned cart) goes through Inngest. Cleanly decouples from the request path so a slow email service can't slow checkout.

**Files to touch**:
- `apps/api/src/inngest/client.ts` (new)
- `apps/api/src/inngest/functions/order-paid.ts` (new)
- `apps/api/src/routes/inngest.ts` (new — serves the Inngest webhook)
- `apps/api/src/app.ts`
- `apps/api/src/routes/checkout.ts` — fire event on verify

**Suggested Claude Code prompt**:
> Set up Inngest.
>
> 1. Add env vars: `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`.
>
> 2. Create `apps/api/src/inngest/client.ts`:
>    ```ts
>    import { Inngest } from "inngest";
>    export const inngest = new Inngest({ id: "svcar-api" });
>    ```
>
> 3. Create `apps/api/src/inngest/functions/order-paid.ts`:
>    - Function ID: "order-paid"
>    - Trigger: event "order.paid"
>    - Steps:
>      1. Fetch order detail by id
>      2. Send confirmation email (stub for now — implemented in Task 3.8)
>      3. [TODO Phase 4: notify admin via WhatsApp or Slack]
>
> 4. Create `apps/api/src/routes/inngest.ts`:
>    ```ts
>    import { serve } from "inngest/hono";
>    import { inngest } from "../inngest/client";
>    import { orderPaid } from "../inngest/functions/order-paid";
>    export const inngestRouter = serve({ client: inngest, functions: [orderPaid] });
>    ```
>
> 5. Register at `/api/inngest` in `app.ts` (this is the path Inngest's cloud will call back to).
>
> 6. In `checkout.ts`, after marking order paid, fire: `await inngest.send({ name: "order.paid", data: { orderId } });`. Same in the webhook handler.
>
> 7. Locally, run `npx inngest-cli@latest dev` in another terminal. It autodetects the function.

**Verification commands**:
```bash
# Terminal 1: pnpm dev
# Terminal 2: npx inngest-cli@latest dev
# Open http://localhost:8288 — Inngest local dev UI
# Complete a checkout (FE Phase 3 will enable this); see order.paid event fire
```

**Acceptance criteria**:
- [ ] Inngest wired up
- [ ] `order.paid` event fires from verify + webhook
- [ ] Function runs successfully (email part is stub)
- [ ] Local Inngest UI shows the event + function execution
- [ ] Commit: `feat(phase-3): add Inngest with order.paid handler`

---

## Task 3.8 — Order confirmation email (Resend)

**Files to touch**:
- `apps/api/src/lib/email.ts` (new)
- `apps/api/src/emails/OrderConfirmation.tsx` (new — react-email template)
- `apps/api/src/inngest/functions/order-paid.ts` — wire in
- Env vars

**Suggested Claude Code prompt**:
> Add Resend email.
>
> 1. Env: `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (e.g. `orders@svcarindia.com` — [TODO confirm with Ketan: domain DNS configured?]).
>
> 2. Install `resend` and `@react-email/components`. Create `apps/api/src/emails/OrderConfirmation.tsx` — a react-email template showing: order number, date, items (with image, name, variant, qty, line total), shipping address, totals breakdown (subtotal, shipping, GST, grand total), expected delivery window.
>
> 3. Create `apps/api/src/lib/email.ts`:
>    - `sendOrderConfirmation(order)`: renders template, calls `resend.emails.send({ from, to: order.customerEmail, subject: 'Order Confirmed — VE...', react: <OrderConfirmation order={order} /> })`. If `customerEmail` is null, skip silently.
>
> 4. In `inngest/functions/order-paid.ts`, replace the stub with this call. Wrap in `step.run("send-confirmation-email", ...)` so Inngest retries on failure with backoff.

**Verification commands**:
```bash
# After full checkout flow:
# - Customer email is set in /account or during checkout
# - Email arrives within 60s
# - Look right on Gmail mobile + desktop
# - Resend dashboard: see the send

# Resend test address `delivered@resend.dev` always accepts — use for automated tests.
```

**Acceptance criteria**:
- [ ] Email arrives after a successful order
- [ ] Template renders correctly with all data
- [ ] Inngest retries on transient failures
- [ ] Skipped if no email on record (doesn't error)
- [ ] Commit: `feat(phase-3): add order confirmation email`

---

## Task 3.9 — Bump and publish `@svcar/contracts@0.3.0`

**Acceptance criteria**:
- [ ] `@svcar/contracts@0.3.0` published with checkout + order schemas
- [ ] Tag pushed

---

## Common pitfalls across this phase

- **Storing prices server-side**: ALWAYS recompute totals from current DB SKU prices in `/checkout/order`. Never trust the cart's reported price.
- **Webhook secret rotation**: Razorpay lets you have multiple active webhook URLs. When rotating secrets, add the new URL first, then remove old.
- **Order number race**: two concurrent checkouts can collide if you generate the number in app code. Use a Postgres sequence — atomic.
- **Razorpay test mode amounts**: Razorpay test mode requires `amount >= 100` (₹1). Don't test with ₹0 or sub-rupee.
- **Webhook localhost**: use cloudflared or ngrok to expose `/webhooks/razorpay`. Razorpay won't hit localhost.

## What's next

→ Phase 5: [Caching + observability](./phase-5-caching-and-obs.md) — production hardening (admin is already done from Phase 1).
