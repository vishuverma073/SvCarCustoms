# Phase 5 (Backend) — Caching + Observability

## What you'll build

Production hardening: Redis caches for hot paths, Sentry for errors, Axiom for structured logs, uptime monitoring, and alert routing. After this phase, you'll know within 60 seconds when something breaks.

## Prerequisites

- [ ] Phase 4 complete — admin is live, real orders flowing
- [ ] [TODO confirm with Ketan] Sentry account + project created (free tier 5k errors/mo)
- [ ] [TODO confirm with Ketan] Axiom or BetterStack account (free tier 500MB/mo)
- [ ] [TODO confirm with Ketan] BetterStack Uptime monitor account (free tier 10 monitors)
- [ ] [TODO confirm with Ketan] Slack workspace + #alerts channel ready

## Success criteria

- Cache hit rate ≥ 70% on `/products/:slug` and `/products/by-category/:slug`
- Sentry captures errors with source maps + release tags
- Every API request emits a structured log line in Axiom with request_id, latency, status
- Uptime monitor pages Ketan via SMS when API is down for ≥ 2 min
- Slack alert fires on 5xx rate spike

## Estimated effort

1-2 sessions (~5 hours).

---

## Task 5.1 — Redis cache layer for product reads

**Context**: Product detail and category listing are the hottest read paths. Cache them in Upstash Redis (already set up in Phase 2 for rate limiting) for 5 minutes. Invalidate on admin write.

**Files to touch**:
- `apps/api/src/lib/cache.ts` (new)
- `apps/api/src/routes/products.ts` — wrap handlers in cache
- `apps/api/src/routes/admin/products.ts` — invalidate on mutation
- `apps/api/src/routes/admin/categories.ts` — invalidate on mutation
- Tests

**Suggested Claude Code prompt**:
> Build a small cache helper around Upstash Redis.
>
> 1. Create `apps/api/src/lib/cache.ts`:
>    ```ts
>    export async function cached<T>(
>      key: string,
>      ttlSeconds: number,
>      loader: () => Promise<T>
>    ): Promise<T> {
>      const hit = await redis.get<T>(key);
>      if (hit) return hit;
>      const fresh = await loader();
>      await redis.set(key, fresh, { ex: ttlSeconds });
>      return fresh;
>    }
>    export async function invalidate(...keys: string[]): Promise<void>
>    export async function invalidatePrefix(prefix: string): Promise<void> // uses SCAN+DEL
>    ```
>
> 2. Wrap product handlers:
>    - `GET /products/:slug` → `cached(\`product:\${slug}\`, 300, () => fetch...)`
>    - `GET /products/by-category/:slug` → `cached(\`category-products:\${slug}\`, 300, ...)`
>    - `GET /categories` → `cached("categories:root", 600, ...)`
>    - `GET /categories/:slug` → `cached(\`category:\${slug}\`, 600, ...)`
>
> 3. In admin product write handlers (create/update/delete), after the mutation:
>    ```ts
>    await invalidate(`product:${slug}`);
>    await invalidatePrefix("category-products:");  // category lists could change
>    await invalidatePrefix("category:");           // breadcrumbs could change
>    ```
>
> 4. In admin category write handlers: invalidate all category-related keys.
>
> 5. Add a header `x-cache: HIT | MISS` for debugging.
>
> Tests: cache hit returns same data, mutation invalidates, prefix invalidation works.

**Verification commands**:
```bash
pnpm test

# Manual:
curl -i http://localhost:8787/products/lavender-imported-range-single-bowl
# Look for: x-cache: MISS

curl -i http://localhost:8787/products/lavender-imported-range-single-bowl
# Look for: x-cache: HIT

# Then make an admin edit, then re-request:
# x-cache: MISS (cleared)
```

**Acceptance criteria**:
- [ ] Cache hits on repeat GETs
- [ ] Admin mutations invalidate relevant keys
- [ ] `x-cache` header reflects state
- [ ] Tests pass
- [ ] Commit: `feat(phase-5): Redis cache layer for hot reads`

**Pitfalls**:
- Don't cache responses for authenticated routes by mistake. Apply cache only to public GETs.
- `invalidatePrefix` using SCAN can be slow with many keys. Acceptable for our scale; revisit if Redis SCAN cost rises.

---

## Task 5.2 — Sentry SDK

**Files to touch**:
- `apps/api/src/lib/sentry.ts` (new)
- `apps/api/src/app.ts` — wrap error handler
- `apps/api/src/lib/env.ts` — `SENTRY_DSN`

**Suggested Claude Code prompt**:
> Add Sentry.
>
> 1. Env: `SENTRY_DSN` (optional in dev, required in production).
>
> 2. Install `@sentry/cloudflare` (if deployed on Workers) OR `@sentry/node` (if Node/Fly.io). Pick based on the deploy target chosen in Phase 1.
>
> 3. Create `apps/api/src/lib/sentry.ts` initializing the SDK with:
>    - DSN from env
>    - `tracesSampleRate: 0.1` (sample 10% for perf data)
>    - `release: process.env.GIT_SHA ?? "dev"`
>    - `environment: NODE_ENV`
>    - `beforeSend` hook: scrub any field named `password`, `token`, `code`, `code_hash`, `signature`, `razorpay_*`
>
> 4. In `app.ts`, in the `onError` handler, call `Sentry.captureException(err, { extra: { path, requestId } })` before returning the 500.
>
> 5. Add CI step: upload source maps to Sentry on deploy (uses `@sentry/wizard` or `sentry-cli`).
>
> Test by deliberately throwing in a route, hit it, confirm event appears in Sentry dashboard within 30s.

**Verification commands**:
```bash
# Trigger an error:
curl http://localhost:8787/test-error  # add a temporary route that throws
# Check Sentry dashboard for the event
```

**Acceptance criteria**:
- [ ] Errors arrive in Sentry with stack traces
- [ ] PII scrubbed (verify with a deliberate test)
- [ ] Release version tagged
- [ ] Source maps work (line numbers in stack traces correspond to source files)
- [ ] Commit: `feat(phase-5): Sentry error tracking`

---

## Task 5.3 — Structured logging to Axiom

**Files to touch**:
- `apps/api/src/middleware/logger.ts` — extend
- `apps/api/src/lib/env.ts`

**Suggested Claude Code prompt**:
> Configure structured logs to Axiom.
>
> 1. Env: `AXIOM_DATASET`, `AXIOM_TOKEN`. Optional in dev (logs go to stdout only).
>
> 2. Install `@axiomhq/js`. In `apps/api/src/lib/logger.ts` (new):
>    - Init Axiom client
>    - Export `log(level, msg, fields)` that:
>      - Always writes to stdout (existing behavior)
>      - If Axiom configured, also ingests to dataset
>    - Batch ingest (Axiom SDK does this) — flush on app shutdown
>
> 3. Update `requestLogger` middleware to use `log()` instead of `console.log`.
>
> 4. Add `log()` calls at key points:
>    - `/auth/otp/send` — { phone: "+91XXX****", action: "otp.send" } (mask middle digits)
>    - `/checkout/order` — { orderId, total }
>    - `/webhooks/razorpay` — { event, paymentId, orderId }
>    - All error paths in admin mutations
>
> 5. Confirm logs flowing in Axiom Streams UI within 60s.

**Acceptance criteria**:
- [ ] Logs visible in Axiom
- [ ] Each log line has: ts, level, msg, request_id, service, env, release
- [ ] PII masked (phones, card numbers, secrets)
- [ ] Commit: `feat(phase-5): Axiom structured logging`

---

## Task 5.4 — Uptime monitoring + alerts

**Context**: External monitor pings our health endpoints. Cheaper than Datadog and faster to set up than Prometheus.

**What to do (mostly manual)**:

1. BetterStack Uptime → Add monitor:
   - URL: `https://api.veronicaindia.com/healthz` (or staging URL)
   - Interval: 60s
   - Alert: if down ≥ 2 min, SMS + email to Ketan
2. Add monitor for the Razorpay webhook endpoint:
   - URL: `https://api.veronicaindia.com/webhooks/razorpay-health` (you'll need to add a GET handler that returns 200 OK without doing anything — purely for monitoring)
3. Add monitor for the frontend:
   - URL: `https://veronicaindia.com`
   - Same alert rules

**Acceptance criteria**:
- [ ] Three uptime monitors green
- [ ] An intentional downtime test (kill local API briefly) generates an alert
- [ ] Commit (in repo): add the `/webhooks/razorpay-health` GET stub

---

## Task 5.5 — Slack alert webhook

**Files to touch**:
- `apps/api/src/lib/alerts.ts` (new)

**Suggested Claude Code prompt**:
> Add a Slack alerter.
>
> 1. Env: `SLACK_WEBHOOK_URL` (incoming webhook to #alerts).
>
> 2. Create `apps/api/src/lib/alerts.ts` exporting `alertSlack(severity, title, body, fields?)`. Posts to the webhook with formatted blocks (color-coded by severity: red=critical, yellow=warning, blue=info).
>
> 3. Wire calls in:
>    - Razorpay webhook handler — on `payment.failed`, send warning
>    - Razorpay webhook handler — on signature failure, send critical
>    - Admin order refund — info notification (informational, not problematic)
>    - Any unhandled `onError` 5xx response — critical
>
> 4. Don't spam: throttle "same alert in 5 min" via Redis SETNX (only fire if SETNX succeeds).

**Acceptance criteria**:
- [ ] Slack receives a test alert
- [ ] Color/severity formatting works
- [ ] Throttling prevents alert storms
- [ ] Commit: `feat(phase-5): Slack alerter`

---

## Task 5.6 — Cache-Control headers on public GETs

**Files to touch**:
- `apps/api/src/routes/products.ts`, `categories.ts`

**Suggested Claude Code prompt**:
> Add Cache-Control to all public GET responses:
>
> - Product/category detail: `Cache-Control: public, max-age=60, stale-while-revalidate=300`
> - List endpoints: `Cache-Control: public, max-age=30, stale-while-revalidate=120`
> - Search: `Cache-Control: public, max-age=10, stale-while-revalidate=60`
> - `/healthz`: `Cache-Control: no-store`
> - Anything authenticated (`/me/*`, `/admin/*`): `Cache-Control: private, no-store`
>
> This lets Cloudflare / Vercel cache at edge, even before Phase 5 Redis kicks in.

**Acceptance criteria**:
- [ ] Cache-Control headers correct on all public + authenticated routes
- [ ] Verified with `curl -i`
- [ ] Commit: `feat(phase-5): Cache-Control headers`

---

## Task 5.7 — Deliberate failure drill

**Suggested Claude Code prompt**:
> Verify the full alerting pipeline by deliberately triggering failures:
>
> 1. Add a temporary `/test-error` route that throws. Hit it. Verify:
>    - Sentry captures the error
>    - Axiom logs include the error line
>    - Slack #alerts gets a notification (if you wired errors → Slack)
> 2. Stop the API locally for 3 minutes. Verify:
>    - BetterStack alerts via SMS
>    - Recovery alert fires when restarted
> 3. Remove the `/test-error` route.

**Acceptance criteria**:
- [ ] All three signals (Sentry, Axiom, Slack) fire on a real error
- [ ] Uptime monitor pages on extended downtime
- [ ] Commit cleanup: `chore(phase-5): remove test-error route`

---

## Common pitfalls across this phase

- **Don't cache 4xx/5xx responses.** Set Cache-Control only on 2xx.
- **Sentry rate limits**: a runaway 500 loop can burn through your 5k events/mo quota. Use Sentry's `beforeSend` to dedupe similar errors.
- **Alert fatigue**: tune thresholds so you don't get woken up at 3am for a flaky test deploy. Day-3 of a new alert: review noise level.
- **Sensitive data in logs**: scrub at the log function level, not at the call site. Easy to forget at call site.

## What's next

→ Phase 6: [Search + polish](./phase-6-search-and-polish.md) — search upgrade, SEO, finishing touches.
