# 00 — Overview

## What we're building

Svcar India is a Delhi-based sanitaryware brand (since 2004). The current Next.js prototype is a BFF-style catalog with WhatsApp checkout. We're transitioning it into a **production e-commerce platform** that can serve real customers, take real payments, and grow without re-architecting.

## Who's building it

- **Ketan**: product manager, business owner, infrastructure decision-maker
- **Claude (Anthropic)**: primary developer for the entire codebase — frontend, backend, infra, tests

This is unusual. Most architectures are picked for human ergonomics. Ours is picked for **AI ergonomics**.

## The AI-first principle

Stack choices are biased toward what a strong LLM does best:

1. **Boring, well-documented tech.** Mainstream tools (Next.js, TypeScript, Postgres, Drizzle, Hono, Razorpay) have the densest training data. Esoteric tools = more mistakes.
2. **Single language across FE and BE.** TypeScript everywhere → I share zod schemas directly, fewer manual type translations, fewer bugs.
3. **Convention over configuration.** Drizzle over hand-written SQL. Hono's standard router over custom dispatch. Zod for all validation.
4. **Tests as a safety net.** Vitest from day one. CI blocks merges on red. I make fewer regressions when the harness is fast.
5. **Portable code.** Hono runs on Node, Bun, Workers, Deno — so we can change deploy targets without rewriting logic.
6. **Explicit > clever.** No magic. Every behavior should be searchable in the codebase.

## Success criteria for v1

- Indian customers can browse the catalog, log in via phone OTP, add items to cart, pay via Razorpay (UPI + cards + netbanking + wallets), and receive an order confirmation.
- Admin can manage products, categories, prices, and view orders from a real CMS.
- Pages load in <500ms p99 from Indian users.
- Infrastructure cost is under ₹5,000/mo (~$60) until traffic justifies more.
- No "free trial" or "hobby tier" surprises — we know the cost trajectory at 1k / 10k / 100k visits/day.
- A solo PM + AI dev can ship features without devops on-call.

## Explicitly out of scope for v1

- Multi-warehouse inventory
- Returns / RMA workflow (basic refund via Razorpay is fine)
- Loyalty program, referrals, discount codes (can be added later)
- Mobile native apps (the PWA-quality web app is enough)
- Multi-language (English only for v1)
- Marketplace / multi-vendor
- B2B bulk pricing tiers
- Real-time inventory sync with offline showroom

## Key constraints

- **Currency**: INR only. All prices formatted with Indian digit grouping (`₹1,00,000`).
- **GST**: Must be calculated and shown on invoices. Not yet modeled — flagged in [07-open-questions.md](./07-open-questions.md).
- **Payments**: Razorpay only for v1. WhatsApp deep-link kept as a fallback CTA for hesitant buyers.
- **SMS/OTP**: MSG91 preferred over Twilio for Indian deliverability.
- **Hosting region**: Compute and DB should be in or near Mumbai for sub-50ms p99.
