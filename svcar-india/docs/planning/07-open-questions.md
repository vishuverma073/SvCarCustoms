# 07 — Open Questions

Things still TBD as of 2026-05-28. When a question is answered, move the answer into the relevant doc and delete from here.

## Deferred decisions

### Backend hosting (target: end of Phase 1)

- **Cloudflare Workers** vs **Fly.io Mumbai** vs **Vercel Functions**.
- Decision criteria: real p99 latency from Indian users, cost at projected traffic, AI productivity (how cleanly the same Hono code deploys).
- Plan: deploy to both during Phase 1, measure, commit. See [02-hosting-and-costs.md](./02-hosting-and-costs.md).

### Database host for production (target: end of Phase 1)

- **Supabase Pro Mumbai** is the strong lean.
- Counter: **Neon Singapore** if branching DBs become more valuable than Mumbai latency.
- Decision criteria: latency measurement; whether we end up using Supabase Auth (favors Supabase as one-stop).

### Auth provider (target: Phase 2 kick-off)

- **MSG91 direct + custom JWT** (full control, cheaper)
- vs **Supabase Auth phone OTP** (managed, slightly slower iteration)
- Decision criteria: whether we want to own the user table from day one (yes → MSG91 direct).

### Image storage + CDN (target: Phase 4)

- **Cloudflare R2 + Cloudflare Images** — $5/mo for transforms + delivery
- vs **Supabase Storage** — bundled with our DB, but no built-in image transforms
- vs **Vercel image optimization on top of S3** — $$$ at scale

### Search backend (target: Phase 6)

- **Postgres FTS** as long as catalog ≤ 500 SKUs and typo tolerance isn't critical
- **Meilisearch on Fly.io** when the above stops being true
- **Algolia** — best but expensive, only consider if catalog explodes

## Domain questions for Ketan

### GST handling

- Confirmed 18% on all products?
- Different rate for any category?
- Should the customer see "Price inclusive of GST" or itemized?
- How are invoices generated? Razorpay's invoice API? Manual? Tally integration?

### Shipping logic

- Current: free above ₹5000, ₹200 below.
- Is that flat across India or zone-based?
- Do we partner with a shipping aggregator (Shiprocket, Delhivery) or self-coordinate?
- Cash-on-delivery support — yes/no for v1?

### Returns + refunds

- Window (7 days? 30?)
- Conditions (unused only? unboxing video required?)
- Refund flow: full vs partial; back to original payment method via Razorpay refund API?

### Inventory

- Do we track stock per SKU now or treat everything as "available" until showroom is out?
- If we track: how does showroom syncing work?
- Backorders allowed?

### Customer service

- Does WhatsApp inquiry go to a person or a bot?
- SLA for response (1 hour? 1 day?)
- Escalation rules for payment / delivery complaints?

### Pricing

- Will sale prices change frequently (festival sales etc.)?
- Should there be MRP vs offer-price columns visible in admin?
- Discount codes / coupons — Phase 6 or later?

### Legal pages

- Terms of Service, Privacy Policy, Refund Policy — does Ketan have drafts or do we generate from a template?
- Cookie consent banner needed for India? (Currently no DPDPA enforcement on cookies, but the law is moving — better to have.)

### Marketing

- Email list signup — yes/no?
- Newsletter platform (Resend Audiences? Mailchimp?)
- Google Analytics / GTM / Facebook Pixel — yes? which?
- SEO ownership — do we generate sitemaps automatically (yes, Phase 6) or hire?

## Engineering questions to revisit

### Migration script idempotency

If we run the seed-from-data script in prod twice, what happens? Plan: `ON CONFLICT (slug) DO UPDATE`. Must verify this doesn't clobber admin-edited product data.

### How do we deal with the duplicate product IDs in [data.ts](../../src/lib/data.ts)?

Product ids `4` and `6` are each duplicated. The seed migration must reassign IDs.

### Stale category slug `/category/health-faucets` (Phase 1 cleanup)

Header, footer, and search-page popular-categories link to `/category/health-faucets` but the actual slug is `/category/health-faucet-sets`. Fix during Phase 1 with a redirect in `next.config.ts`.

### Test data strategy

- Should we have a separate "test catalog" of fake products in dev, or use the real seed?
- Recommendation: real seed in dev, faker-generated bulk catalog (~1000 products) in staging for load testing.

### Backup strategy

- Supabase Pro has daily backups. Is that enough?
- What's our RTO/RPO target? (Recommendation: RPO 24h, RTO 4h for v1)
- Disaster recovery drill — annually at least.
