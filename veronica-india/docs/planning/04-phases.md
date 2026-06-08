# 04 — Phases (high-level overview)

Reference index of the production rollout. For execution detail, see the per-phase docs in `docs/phases/` (frontend) and `veronica-api/docs/phases/` (backend).

## Phase ordering (updated 2026-05-28)

Admin moved from Phase 4 → Phase 1 so the merchant has a working CMS as early as possible. Sentry/observability moved from Phase 5 → Phase 3 so payments don't go live blind.

| # | Theme | Goal at end of phase |
|---|---|---|
| 0 | **Foundations** | BE: workspace + Drizzle schema + first endpoint. FE: repo rename + MSW + contracts installed |
| 1 | **Admin** | Merchant can manage products, categories, images, home page, and settings — mobile-first |
| 2 | **Read paths** | Public storefront swaps from in-memory data.ts to the real backend; ISR caching wired |
| 3 | **Customer auth + cart + Sentry** | Phone OTP login, server-synced cart, production error tracking |
| 4 | **Razorpay** | Real payments via UPI + cards + netbanking; webhooks idempotent; UUID-hashed order numbers |
| 5 | **Caching + remaining observability** | Redis hot paths, Axiom logs, BetterStack uptime, Slack alerts |
| 6 | **Search + polish** | Meilisearch (if needed), SEO sitemap + JSON-LD + OG images, pincode autofill, tracking timeline |

## How BE and FE develop

**In parallel**, not serial. FE uses MSW to mock the API based on the published `@veronica/contracts` schemas. Each phase ends at an **integration milestone** (M0-M6 — see `docs/integration-milestones.md`) where the FE flips from mocks to staging backend and both interns run the integration checklist.

Small drift between BE and FE is expected and absorbed at the milestone. The contracts package is the source of truth for what the two repos agree on.

## Per-phase doc locations

| # | Backend playbook | Frontend playbook |
|---|---|---|
| 0 | [veronica-api/docs/phases/phase-0-foundations.md](../../../veronica-api/docs/phases/phase-0-foundations.md) | [phase-0-foundations.md](../phases/phase-0-foundations.md) |
| 1 | `veronica-api/docs/phases/phase-1-admin.md` | [phase-1-admin.md](../phases/phase-1-admin.md) |
| 2 | `veronica-api/docs/phases/phase-2-read-paths.md` | [phase-2-read-paths.md](../phases/phase-2-read-paths.md) |
| 3 | `veronica-api/docs/phases/phase-3-auth-and-cart.md` | [phase-3-auth-and-cart.md](../phases/phase-3-auth-and-cart.md) |
| 4 | `veronica-api/docs/phases/phase-4-razorpay.md` | [phase-4-razorpay.md](../phases/phase-4-razorpay.md) |
| 5 | `veronica-api/docs/phases/phase-5-caching-and-obs.md` | [phase-5-caching-and-obs.md](../phases/phase-5-caching-and-obs.md) |
| 6 | `veronica-api/docs/phases/phase-6-search-and-polish.md` | [phase-6-search-and-polish.md](../phases/phase-6-search-and-polish.md) |

## Per-phase status

Maintained in the phase READMEs (one per repo). Don't track here — it'll go stale.

## Rollback strategy

Each phase ships behind a runtime env flag where reasonable (e.g. `NEXT_PUBLIC_USE_MOCKS`, `NEXT_PUBLIC_API_ENABLED`). Database migrations are forward-only but compatible (additive columns, no destructive drops in same release as code change). Vercel + the chosen BE host both support instant rollback to previous deploy.

## When v1 is "done"

- Phases 0-4 shipped, in production, serving real customers for ≥ 4 weeks without major incidents
- ≥ 50 real orders processed via Razorpay
- Admin self-sufficient — Ketan can add products + edit the home page without engineering help
- Phase 5 caching + observability in place
- Phase 6 work queued and prioritized

After v1: open `docs/v1.5-plan.md` (to be written) for next-quarter priorities (returns, wishlists, discount codes, abandoned cart).
