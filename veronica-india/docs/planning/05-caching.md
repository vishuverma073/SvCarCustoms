# 05 — Caching Strategy

## Goal

Most product/category page views never hit Postgres. Read latency is dominated by **edge cache** at p50, **ISR'd HTML** at p90, and **Postgres + Redis** only on misses.

## The five layers

### L1 — Browser HTTP cache

Static assets (fonts, images, JS bundles) cached aggressively via `Cache-Control: public, max-age=31536000, immutable` — Next.js handles this for `/_next/static/*`.

For API responses, hand-set `Cache-Control: public, max-age=60, stale-while-revalidate=600` on GETs that are safe to cache (category list, popular products).

### L2 — CDN edge cache

**Vercel Edge Network** caches:
- Static pages and ISR'd HTML
- Optimized images
- Edge function responses with `Cache-Control`

**Cloudflare in front of `veronica-api`** (optional, added in Phase 5):
- Caches GETs at the edge based on `Cache-Control` headers
- Effectively free reads at scale

### L3 — Next.js ISR (Server Components data cache)

Each Server Component fetch uses tagged caching:

```ts
fetch(`${API}/categories/${slug}`, {
  next: { tags: [`category-${slug}`], revalidate: 3600 }
})
```

When admin updates a category/product, the admin route handler calls `revalidateTag()`:

```ts
revalidateTag(`category-${slug}`)
revalidateTag(`product-${slug}`)
revalidateTag('products')  // for list pages
```

Resulting flow:
1. First request after deploy or invalidation → backend hit → response cached
2. Subsequent requests → served from Next.js cache (in-memory on the function instance + Vercel edge layer)
3. Admin edit → `revalidateTag` → next request rebuilds

### L4 — Upstash Redis

Used for things that can't (or shouldn't) be ISR'd:

| Use case | TTL |
|---|---|
| Session lookup by JWT jti | 15 min (matches token expiry) |
| Cart state by user_id | 1 day, refreshed on access |
| OTP rate-limit counters | 1 hour, sliding window |
| Hot product detail lookups | 5 min |
| Search result cache (by query string) | 5 min |
| Razorpay webhook idempotency | 7 days (by payment_id) |

Redis is HTTP-based (Upstash) so it works from Workers, Vercel, anywhere.

### L5 — Postgres query cache

Postgres has its own buffer cache for hot rows. We help it by:
- Keeping the working set small (don't pull every column when only `id, name, slug, price` is needed)
- Materialized views for expensive aggregations (e.g. category product counts) if they're shown on every page
- Proper indexes (see [03-data-model.md](./03-data-model.md))

---

## TTLs by route

| Route | L2 (CDN) | L3 (ISR) | L4 (Redis) | Notes |
|---|---|---|---|---|
| `/` (home) | 5 min SWR | tag-based, revalidate on category/product changes | — | Mostly static |
| `/category/[slug]` | 5 min SWR | tag-based | — | Invalidate on product add/edit in category |
| `/product/[slug]` | 1 hr SWR | tag-based | 5 min hot lookup | Invalidate on edit |
| `/cart` | no-cache | dynamic | session-based | Per-user, never cache |
| `/checkout` | no-cache | dynamic | session-based | Per-user, never cache |
| `/api/search` | no-cache | — | 5 min by query | Search is dynamic |
| `/admin/*` | no-cache | dynamic | session-based | Always fresh |

---

## Invalidation patterns

**Rule 1**: Mutations always invalidate. Every admin write calls `revalidateTag()` for everything affected.

**Rule 2**: Tags are predictable. Two patterns:
- Entity tags: `product-${slug}`, `category-${slug}`
- Collection tags: `products`, `categories`, `bestsellers`, `new-arrivals`

**Rule 3**: When in doubt, over-invalidate. ISR rebuild is cheap; serving stale data is expensive.

Example: admin updates a product's price.
```ts
// in PATCH /admin/products/:id handler
revalidateTag(`product-${product.slug}`)
revalidateTag(`category-${category.slug}`)
revalidateTag('products')
if (product.is_bestseller) revalidateTag('bestsellers')
if (product.is_new) revalidateTag('new-arrivals')
```

---

## Anti-patterns to avoid

- ❌ **Caching authenticated responses at L2/L3.** Always `Cache-Control: private, no-store` for `/me/*`, `/cart`, `/checkout`.
- ❌ **Long Redis TTLs without explicit invalidation.** If something changes, the cache must know.
- ❌ **Caching at multiple layers without coordination.** Pick the layer per route, don't double-cache.
- ❌ **Cache stampede on miss.** Use `SWR` (stale-while-revalidate) so the old response keeps serving while the new one is fetched.
- ❌ **Caching the search endpoint without normalization.** Normalize the query first (`trim`, `lowercase`) so `Sink` and `sink ` share a cache key.

---

## Measuring cache effectiveness

After Phase 5 is live, watch:
- Vercel Analytics → "Cache Hit Rate" per route — aim for >80% on `/`, `/category/*`, `/product/*`
- Upstash dashboard → Redis hit rate, P99 latency
- Sentry → flag any route with p95 > 500ms (likely a cache miss + slow DB query)
- Synthetic monitor from India → uncached p99 must be < 800ms

If hit rate is low, check: are mutations over-invalidating? Are TTLs too short? Are we caching authenticated responses by mistake?
