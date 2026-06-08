# 02 — Hosting & Costs

## TL;DR

| Layer | Recommendation | $/mo at MVP |
|---|---|---|
| Frontend (Next.js on Node.js) | **Vercel Hobby** → Pro when needed | $0 → $20 |
| Backend (Node.js + Hono) | **Cloudflare Workers** (cheapest, serverless edge) OR **Fly.io Mumbai** (always-on Node.js container) | $0 → $5 |
| Database | **Supabase Pro Mumbai** (when going live) | $0 free dev → $25 prod |
| Cache | **Upstash Redis Mumbai** | $0 → $0.20/100k commands |
| Total | **MVP**: $0 – $25/mo; **Live**: ~$30 – $60/mo |

---

## Frontend hosting: yes, stay on Vercel

Why Vercel for Next.js is essentially the default:

- **Native Next.js features**: ISR (incremental static regeneration), `revalidateTag()`, edge middleware, image optimization — all just work. Other hosts implement subsets and lag features.
- **India coverage**: Vercel's edge network has Mumbai (BOM1) and Singapore (SIN1) PoPs. Static pages and image-optimized responses are <30ms p99 from Indian users.
- **Free tier reality**: 100 GB bandwidth, unlimited static deploys, 100k serverless function invocations/day. MVP traffic fits comfortably.
- **Cost trajectory**: ~$0 until ~10k visits/day, then $20/mo Pro plan. Predictable.

Alternatives we considered:

| Alternative | Verdict |
|---|---|
| **Cloudflare Pages** | Cheaper egress but Next.js support is via a workaround (`@cloudflare/next-on-pages`). Edge runtime restrictions on Next.js features. Skip unless cost becomes painful. |
| **Netlify** | Decent Next.js support but ISR is more limited than Vercel. No reason to switch. |
| **Self-hosted (Docker on Fly.io)** | Possible but you lose Vercel's edge cache, image optimization, and zero-config previews. Adds devops work. Skip. |

**Decision**: Keep frontend on Vercel. Revisit only if traffic pushes the Pro plan past $100/mo (won't happen in year 1).

---

## Backend hosting: the real decision

Language and host are **separate choices**. Our backend is **Node.js + Hono (TypeScript)** — the same Node.js ecosystem as the Next.js frontend. Below are the hosts that can run a Node.js Hono app cheaply with low India latency.

> **Naming note**: "Node.js + Hono", "TS + Hono", and just "Hono" all refer to the same thing in these docs. Hono is a modern Node.js framework. There's no language switch happening between FE and BE.

### Option A — Cloudflare Workers (recommended)

- **Cost**: Free (100k req/day forever) → $5/mo for 10M req/month.
- **India latency**: <10ms (Mumbai PoP).
- **Cold starts**: None. V8 isolates spin in ~5ms.
- **Constraints**:
  - 10ms CPU/request on free tier, 50ms on paid. Fine for normal API requests; not for heavy compute.
  - HTTP-only DB drivers (no TCP). Neon, Supabase HTTP, and Hyperdrive all work.
  - 1MB compressed bundle limit (Hono apps are typically <100KB).
- **Best for**: This use case. APIs that talk to Postgres + Redis + Razorpay.
- **Why it's cheapest**: V8 isolates share compute across customers — Cloudflare doesn't run a VM per customer.

### Option B — Fly.io (recommended if Workers feels too unusual)

- **Cost**: Free tier — 3 shared-CPU-1x VMs (256MB RAM each). After free tier, $5–10/mo for a small app.
- **India latency**: <15ms (Mumbai region: `bom`).
- **Cold starts**: ~1–2s if you let VMs scale to zero; none if you keep one always-on.
- **Constraints**: You deploy Docker images. Slight devops learning curve (`fly.toml`, regions, scaling).
- **Best for**: Standard Node.js apps where you want a "server" mental model.
- **Notes**: Free tier is generous; the catch is they bill once you exceed it (no hard cap by default — set spending alerts).

### Option C — Render

- **Cost**: Free tier with **15-minute idle sleep** (cold starts hurt UX). Paid: $7/mo for always-on small instance.
- **India latency**: ~30ms (Singapore region; no Mumbai).
- **Cold starts**: 30–60s after sleep on free tier. Brutal.
- **Best for**: Simple deploys when you don't care about cold starts (background workers).
- **Notes**: Simpler than Fly.io. UI is friendly. But the free tier sleep makes it unsuitable for a user-facing API; you'd want paid from day one.

### Option D — Vercel Functions (same vendor as FE)

- **Cost**: $0 hobby (100k invocations/day, 10s execution limit). Pro $20/mo (1M invocations).
- **India latency**: <30ms (edge functions on Mumbai PoP; serverless functions are Singapore).
- **Cold starts**: 100–500ms for cold serverless functions; edge functions are warm.
- **Constraints**: 10s execution limit on hobby, 60s on Pro. Bundle size limits.
- **Best for**: Avoiding a second vendor. One bill, one dashboard.
- **Why we don't default to this**: Vercel function pricing gets steep at scale ($40/M invocations after Pro quota). And the same Hono code runs on Workers for $5/M.

### Option E — Hetzner VPS (cheapest raw cost)

- **Cost**: ~$4/mo for 2 vCPU, 4GB RAM.
- **India latency**: 180ms (Frankfurt/Helsinki only). Bad.
- **Cold starts**: None (always-on VPS).
- **Constraints**: You manage OS, Postgres, backups, deploys, monitoring. Real ops work.
- **Best for**: Side projects, not e-commerce.
- **Skip**: Latency kills UX; ops burden is real even if I do the work.

### Option F — Railway (the one Ketan mentioned)

- **Cost**: ~$5/mo + usage. Predictable but slightly more expensive than Fly.io.
- **India latency**: ~30ms (Singapore).
- **Cold starts**: None on paid.
- **Constraints**: Singapore region (no Mumbai).
- **Best for**: Simplest UX of all the "real server" options — git push, it deploys, done.
- **Why we didn't pick it**: Fly.io is cheaper AND has Mumbai. Render is simpler if you accept Singapore. Railway is the middle child here.

---

## Side-by-side cost projection

All rows use the same backend code (Node.js + Hono). Only the host differs.

At 1,000 visits/day MVP with cart + checkout:

| Combo | $/mo total |
|---|---|
| Vercel FE + Node.js Hono on Cloudflare Workers + Supabase Pro Mumbai + Upstash | $25–30 |
| Vercel FE + Node.js Hono on Fly.io Mumbai + Supabase Pro Mumbai + Upstash | $30–40 |
| Vercel FE + Node.js Hono on Render + Supabase Pro Mumbai + Upstash | $32–47 |
| Vercel FE + Node.js Hono on Vercel Functions + Supabase Pro Mumbai + Upstash | $25–45 |
| Vercel FE + Node.js Hono on Railway + Supabase Pro Mumbai + Upstash | $35–50 |

At 10,000 visits/day:

| Combo | $/mo total |
|---|---|
| Workers | $35–60 |
| Fly.io | $50–80 |
| Render | $60–90 |
| Vercel Functions | $80–150 *(this is where it gets expensive)* |
| Railway | $50–90 |

At 100,000 visits/day, Workers stays well under $100/mo while VMs need scaling.

---

## Database host

### Supabase Pro Mumbai (recommended for production)

- **Cost**: $25/mo (8 GB DB, 250 GB egress, 100 GB storage, 100k MAU auth, daily backups).
- **Latency**: 5–15ms from Indian users.
- **Bonus features**: Postgres + Auth + Storage + Edge Functions in one console. We may not use all of them, but they're escape hatches.
- **Free tier**: 500 MB DB, 1 GB storage, **pauses after 1 week idle**. Fine for dev, not for production.

### Neon Singapore (alternative)

- **Cost**: $0 free → $19/mo Pro.
- **Latency**: 30–50ms from India.
- **Bonus**: Branchable DBs (instant previews), serverless autoscaling. Excellent DX for Workers.
- **Catch**: No Mumbai region. Singapore is closest.

### Decision deferred

- Free Supabase project for Phase 0 development (cloud Postgres, free, accessible via Supabase Studio).
- Pick prod DB at end of Phase 1 with real latency tests from Indian users.

---

## My ranked recommendation

For "MVP + reliable + cheap + AI-built":

1. **Hono on Cloudflare Workers + Supabase Pro Mumbai + Upstash Redis Mumbai** — cheapest, lowest latency, no servers to manage.
2. **Hono on Fly.io Mumbai + Supabase Pro Mumbai + Upstash Redis Mumbai** — if Workers' constraints feel awkward and you want a regular Node container.
3. **Hono on Vercel Functions + Supabase Pro Mumbai + Upstash Redis Mumbai** — if "one vendor" simplicity beats $20–30/mo cost difference.

Because Hono is portable, **we can defer this until Phase 1**. Build portable, A/B-test latency, pick.

---

## What I'd never pick (and why)

- **AWS Elastic Beanstalk / ECS / EKS** — too much config, too easy to overspend.
- **Heroku** — overpriced (~$25/mo for what Fly.io does at $5).
- **Self-managed Kubernetes anywhere** — wrong scale, wrong complexity.
- **Lambda + API Gateway raw** — works but the DX is bad relative to Workers/Fly/Vercel for a small app.
