# Phase 5 (Frontend) — Caching + Observability

## What you'll build

ISR tag invalidation properly wired across pages, Sentry on the client for error tracking, Vercel Analytics for Core Web Vitals, and Cache-Control discipline on any remaining Next.js Route Handlers.

## Prerequisites

- [ ] Backend Phase 5 in progress or complete
- [ ] Sentry project supports a "browser" environment (or create a second one named `svcar-web`)
- [ ] Vercel Pro plan if you want richer analytics; Hobby tier basic analytics work

## Success criteria

- Admin mutations on the BE trigger FE ISR tag revalidation within 5s
- Sentry catches client-side JS errors with source maps
- Vercel Analytics dashboard shows real user Web Vitals
- Cache hit rate on `/`, `/product/[slug]`, `/category/[slug]` ≥ 80% in production

## Estimated effort

1 session (~3 hours).

---

## Task 5.1 — Ensure all server fetches use ISR tags

**Context**: Already started in Phase 1 with `next.tags`. Audit and tighten.

**Files to touch**:
- `src/lib/backend.ts`
- All Server Component pages

**Suggested Claude Code prompt**:
> Audit `src/lib/backend.ts` — every read method that's called from a Server Component must include `next: { revalidate, tags }`:
>
> - `getCategories()` → tags: `["categories"]`, revalidate: 3600
> - `getCategoryBySlug(slug)` → tags: `["categories", \`category-\${slug}\`]`
> - `listProducts(params)` → tags: `["products", ...(params.category ? [\`category-\${params.category}\`] : [])]`, revalidate: 600
> - `getProductBySlug(slug)` → tags: `[\`product-\${slug}\`]`, revalidate: 3600
> - `getProductsByCategory(slug)` → tags: `[\`category-\${slug}\`, \`category-products-\${slug}\`]`
>
> Authenticated methods (e.g. `getMe`) MUST NOT use `next.tags` — they should use `cache: "no-store"`.

**Acceptance criteria**:
- [ ] Every public read method has explicit `next` options
- [ ] No authenticated method caches at L3
- [ ] Commit: `chore(phase-5): audit ISR tags across backend client`

---

## Task 5.2 — Webhook revalidation handler

**Context**: When the backend mutates a product/category, it needs to tell us to bust the corresponding ISR cache. Add a Next.js Route Handler the backend can call.

**Files to touch**:
- `src/app/api/revalidate/route.ts` (new)
- `src/lib/backend.ts` (no change, but document)
- Backend should call this after mutations [TODO add to BE Phase 4 task list if missing]

**Suggested Claude Code prompt**:
> Create `src/app/api/revalidate/route.ts`:
> - POST handler
> - Validates: `x-revalidate-secret` header matches `REVALIDATE_SECRET` env var (or 401)
> - Body: `{ tags: string[] }` — array of tag names to revalidate
> - For each tag, call `revalidateTag(tag)`
> - Return `{ revalidated: tags.length, now: Date.now() }`
>
> Add `REVALIDATE_SECRET` to `.env.local.example`.
>
> Document for the BE intern: after any product/category/order mutation, the backend should call:
> ```
> POST https://svcarindia.com/api/revalidate
> x-revalidate-secret: <secret>
> { "tags": ["products", "product-lavender-..."] }
> ```

**Verification commands**:
```bash
curl -X POST http://localhost:3000/api/revalidate \
  -H "x-revalidate-secret: <secret>" \
  -H "Content-Type: application/json" \
  -d '{"tags":["products"]}'
# Expect: { revalidated: 1, now: ... }

# Without secret → 401
```

**Acceptance criteria**:
- [ ] Handler exists and works
- [ ] Auth via header secret
- [ ] BE intern is aware to call it after mutations
- [ ] Commit: `feat(phase-5): /api/revalidate webhook handler`

---

## Task 5.3 — Sentry on the client

**Files to touch**:
- `next.config.ts` (or `sentry.client.config.ts`)
- `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` (per Next.js Sentry setup)

**Suggested Claude Code prompt**:
> Install `@sentry/nextjs`. Run `npx @sentry/wizard@latest -i nextjs` and answer prompts. Use the existing Sentry org/project (same as BE — different environment).
>
> Edit the generated `sentry.client.config.ts`:
> - `tracesSampleRate: 0.1`
> - `replaysSessionSampleRate: 0` (don't enable session replay yet — privacy concerns)
> - `beforeSend(event)`: drop events where the URL contains `password`, `code`, or `token` query params; redact known PII fields
>
> Verify by deliberately throwing in a client component (`throw new Error("test sentry")` on a button click). Event appears in Sentry.

**Acceptance criteria**:
- [ ] Sentry SDK installed
- [ ] Client errors arrive in Sentry
- [ ] Source maps work (line numbers correct in stack)
- [ ] PII scrubbed
- [ ] Commit: `feat(phase-5): Sentry on client`

---

## Task 5.4 — Vercel Analytics

**Files to touch**:
- `package.json`
- `src/app/layout.tsx`

**Suggested Claude Code prompt**:
> Install `@vercel/analytics`. Add `<Analytics />` to `src/app/layout.tsx`.
>
> Also install `@vercel/speed-insights` and add `<SpeedInsights />` for Core Web Vitals data.
>
> Both are no-ops on non-Vercel deployments, so OK to include unconditionally.

**Acceptance criteria**:
- [ ] Analytics + SpeedInsights mounted
- [ ] Vercel dashboard shows page views + vitals (after a few real visits)
- [ ] Commit: `feat(phase-5): Vercel Analytics + Speed Insights`

---

## Task 5.5 — Verify cache hit rates in production

**Context**: After everything is deployed, measure that the caching actually works.

**Suggested Claude Code prompt**:
> Manual:
> 1. Open https://svcarindia.com in an incognito window
> 2. DevTools Network → reload a few times
> 3. Look at the response headers on HTML responses — should see `x-vercel-cache: HIT` (or MISS on first, then HIT)
> 4. Visit a product page; check `x-vercel-cache`
> 5. In Vercel dashboard, Analytics → check "Cache hit rate"
>
> Acceptance: ≥ 80% hit rate on `/`, `/product/*`, `/category/*` after 1 hour of traffic.

**Acceptance criteria**:
- [ ] Cache hit rate ≥ 80% on public pages
- [ ] No unintended caching of authenticated pages (check `/account`, `/cart`)
- [ ] Phase 5 status updated

---

## Common pitfalls across this phase

- **Forgot to add `next.tags` to a new fetch**: it falls into the default Next.js behavior, which varies by Next version. Always be explicit.
- **`revalidateTag()` only invalidates** — it doesn't pre-warm. First request after invalidate is a miss.
- **Sentry quota burn**: if your client has an infinite loop throwing, you can blow through 5k events in minutes. Set Sentry's "Rate Limits" in project settings.

## What's next

→ Phase 6: [Search + polish](./phase-6-search-and-polish.md) — final touches before "v1 done".
