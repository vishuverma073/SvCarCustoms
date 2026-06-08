# Integration Milestones

Gate criteria for moving between phases when BE and FE develop in parallel. After both interns finish their phase-N work independently, they meet at the milestone to verify integration before either of them starts phase-(N+1).

## How a milestone works

1. **BE intern signals "phase done"** — all acceptance criteria met, contracts package version bumped + published, deployed to staging.
2. **FE intern signals "phase done"** — all acceptance criteria met, MSW mocks updated against the latest contracts version.
3. **FE flips the env var**: `NEXT_PUBLIC_USE_MOCKS=false` and `NEXT_PUBLIC_API_URL=<staging URL>`.
4. **Both interns run the integration checklist together** (~30-60 min, in person or over a call).
5. **If anything fails**: file specific issues (BE bug, FE bug, contracts mismatch) and fix before unblocking.
6. **Once all checklist items pass**: tag the milestone in git (`milestone-1`, `milestone-2`, etc.) on both repos. Both interns proceed to next phase.

## M0 — After Phase 0 (Foundations)

**Goal**: both repos build, contracts is wired, basic smoke test of `/healthz` and `/categories`.

- [ ] `@veronica/contracts` published to GitHub Packages at the expected version
- [ ] BE repo: `pnpm install && pnpm typecheck && pnpm test && pnpm dev` all pass
- [ ] FE repo: `pnpm install && pnpm typecheck && pnpm dev` all pass
- [ ] FE repo's `@veronica/contracts` lockfile version matches BE's published version
- [ ] FE in MSW mode: `pnpm dev` shows mocked categories on the home page (or in a dev-only test page)
- [ ] FE flipped to staging: `curl <staging>/healthz` returns ok; FE renders real categories from staging
- [ ] CI workflows green on both repos
- [ ] Both interns can describe what's in the other repo (no opaque boxes)

**Estimated milestone time**: 30 min.

---

## M1 — After Phase 1 (Admin)

**Goal**: a merchant can log into the deployed admin and add a real product end-to-end.

- [ ] Contracts package updated to expected version, FE installed
- [ ] BE staging has the admin endpoints live: `/admin/auth/login`, `/admin/products`, `/admin/categories`, `/admin/uploads`, `/admin/home`
- [ ] FE in real-API mode against staging
- [ ] Admin login works (entering test admin email + password gets a token)
- [ ] Admin can add a new product end-to-end, including uploading at least one image
- [ ] Admin can mark a product as Featured, refresh page, see the flag persisted
- [ ] Admin home composer: drag-reorder sections, save, refresh, order persists
- [ ] Admin home composer: edit hero banner (image, title, subtitle, CTA), save, refresh, persists
- [ ] Admin works on mobile width (iPhone 14 in DevTools) — bottom nav, big touch targets
- [ ] All admin actions logged in `audit_log` (verify via SQL query)
- [ ] Non-admin user trying admin routes: 403 (test by logging out then visiting `/admin/products` via curl)
- [ ] Both repos at compatible contracts version, CI green

**Estimated milestone time**: 60 min — most testing here.

**Common failures at this milestone**:
- CORS — BE not allowing FE origin for credentials
- Cookie SameSite — refresh cookie not reaching FE
- Image upload returning a URL that FE's `next.config.ts` doesn't allow (add Supabase domain)
- Schema drift — admin product create payload doesn't match `ProductSchema`

---

## M2 — After Phase 2 (Read paths)

**Goal**: the public storefront reads everything from the real backend. No more in-memory `data.ts`.

- [ ] Contracts version aligned
- [ ] All public storefront pages render from staging BE: `/`, `/category/[slug]`, `/product/[slug]`, `/search`
- [ ] Home page reflects the `home_config` set in Phase 1 admin
- [ ] Changes made in admin reflect on the storefront within 5 seconds (ISR revalidation works)
- [ ] `/category/health-faucets` redirects to `/category/health-faucet-sets`
- [ ] Search page works (live results as you type)
- [ ] `pnpm grep -r "@/lib/data"` in FE returns no results (data.ts fully retired)
- [ ] Lighthouse on `/` and `/product/[slug]` ≥ 90 perf, ≥ 95 a11y
- [ ] No console errors clicking through 5 random products

**Estimated milestone time**: 45 min.

---

## M3 — After Phase 3 (Customer auth + cart + Sentry)

**Goal**: customers can log in via phone OTP, cart persists, errors arrive in Sentry.

- [ ] Contracts aligned
- [ ] Send OTP to a real number → receive SMS within 30 sec (MSG91 DLT template live)
- [ ] Verify OTP → logged in, header updates
- [ ] Add 2 items to cart while logged in → log out → log in on different browser → cart still has items
- [ ] Guest cart merge: add items as guest, log in, items merged with server cart (no duplicates by SKU)
- [ ] OTP rate limit: 2nd request within 60s returns 429
- [ ] Sentry catches a deliberate FE error (button that throws) AND a deliberate BE error (test endpoint that throws)
- [ ] Source maps work in Sentry stack traces

**Estimated milestone time**: 60 min.

---

## M4 — After Phase 4 (Razorpay)

**Goal**: a real test-mode order completes end-to-end with all the back-of-house wiring.

- [ ] Contracts aligned
- [ ] Complete a test-mode Razorpay payment via UPI (any UPI simulator works)
- [ ] Complete a test-mode Razorpay payment via card (4111 1111 1111 1111)
- [ ] Order confirmation email arrives within 60s
- [ ] `/orders` shows the order; `/orders/:orderNumber` shows full details
- [ ] Admin sees the order in `/admin/orders`
- [ ] Admin changes status pending → paid → confirmed → shipped → delivered (transitions work)
- [ ] Refund flow: admin clicks Refund → Razorpay refund API called → order status = refunded
- [ ] Webhook test: trigger payment.captured from Razorpay dashboard → handler processes correctly
- [ ] Stale-pending reconciliation cron: leave an order at `pending` status with a valid razorpay_order_id that's been paid (manually pay it); cron should pick it up within 15 min
- [ ] No race: clicking Pay twice doesn't create two orders or charge twice
- [ ] Public order number is random/UUID-hashed, not sequential

**Estimated milestone time**: 90 min — most thorough milestone.

---

## M5 — After Phase 5 (Caching + remaining obs)

**Goal**: production-grade hot paths and full visibility.

- [ ] Contracts aligned
- [ ] Cache hit rate ≥ 70% on `/product/[slug]` after 10 sequential requests (`x-cache: HIT` after first)
- [ ] Admin edit invalidates cache: edit product → next storefront request shows new data
- [ ] Axiom shows structured logs for every API request with request_id + latency
- [ ] BetterStack uptime monitors green for 24h
- [ ] Deliberate downtime triggers Slack alert
- [ ] Lighthouse pages all still ≥ 90 perf

**Estimated milestone time**: 30 min.

---

## M6 — After Phase 6 (Polish)

**Goal**: launch-ready.

- [ ] Contracts at `1.0.0`
- [ ] Sitemap.xml validates, contains all products + categories
- [ ] JSON-LD on PDPs validates in Google Rich Results Test
- [ ] OG images generate for products (paste a URL in opengraph.xyz)
- [ ] Pincode autofill works for at least 5 real Indian pincodes
- [ ] Order tracking timeline shows status events
- [ ] Custom 404 page is on-brand
- [ ] Production env vars all set (Razorpay LIVE keys, MSG91 prod sender, Resend prod, custom domain)
- [ ] Final manual run-through: as a customer, do a complete order. As an admin, fulfill it. Without consulting docs.

**Estimated milestone time**: 60 min.

After M6 passes → **v1 is live.** Open `docs/v1.5-plan.md` for next-quarter work.
