# 06 — Observability

## What we need to see, end-to-end

| Signal | Tool | Cost |
|---|---|---|
| Frontend errors (JS exceptions, hydration errors) | Sentry | Free tier (5k errors/mo) |
| Backend errors (5xx, exceptions) | Sentry | Same tier |
| Backend logs (structured) | Axiom OR BetterStack | Axiom free 500MB/mo |
| Frontend perf (Core Web Vitals) | Vercel Analytics | Free with Vercel |
| API latency / availability | BetterStack uptime | Free tier 10 monitors |
| Razorpay webhook health | Custom dashboard + alerts | — |
| Business KPIs (orders, conversion) | Custom dashboard (Phase 6) | — |

## Errors — Sentry

Install on both repos. Use one Sentry project with two "environments" (web, api). Source-map upload from CI so we get readable stack traces.

Tag every event with:
- `release` — git SHA from CI
- `user_id` (if logged in)
- `route` / `endpoint`
- `phase` if we're behind a feature flag

Alert rules:
- New issue → Slack
- Spike: > 10 events/min on any error → Slack + email
- Payment-related errors (any code in `razorpay.*` or `checkout.*`) → immediate Slack with @ mention

## Logs — Axiom

Hono middleware that writes structured JSON to stdout, ingested by Axiom (free tier 500 MB/mo, plenty for MVP).

Log shape:
```json
{
  "ts": "2026-05-28T14:00:00Z",
  "level": "info",
  "msg": "checkout.order.created",
  "trace_id": "abc...",
  "user_id": "uuid",
  "order_id": "uuid",
  "amount": 8499,
  "latency_ms": 120
}
```

Never log: passwords, OTP codes, full card numbers, Razorpay secrets.

Standard fields to attach to every log line:
- `trace_id` — propagated from request header or generated
- `service` — `web` or `api`
- `release` — git SHA
- `env` — `production` / `staging` / `dev`

## Uptime — BetterStack

Monitor:
- `https://veronica.com/` (frontend) every 1 min
- `https://api.veronica.com/healthz` (backend) every 1 min
- `https://api.veronica.com/webhooks/razorpay-health` (synthetic ping endpoint) every 5 min

Alert on:
- Down for ≥ 2 minutes → Slack + SMS (BetterStack handles this)
- p99 latency > 1s for 5 min → Slack

## Metrics dashboards

Phase 5 just needs a basic dashboard. Options:
- **Vercel Analytics** — covers FE perf out of the box
- **Axiom dashboards** — custom queries on logs (orders/hour, OTP success rate)
- **Grafana + Prometheus** — overkill for MVP, skip

Phase 6 builds a custom business KPI dashboard inside the admin:
- Orders today / this week / this month
- Conversion rate (sessions → orders)
- Top 10 products by revenue
- Cart abandonment rate
- OTP send → verify funnel
- Razorpay payment success rate by method

## Alerting philosophy

- **Page-worthy**: payment system broken, full site down, data loss risk. Alert immediately.
- **Investigate-soon**: elevated error rate (>1% 5xx), slow p99, OTP failure spike. Slack within an hour.
- **Daily digest**: new product page errors, slow queries, cache miss spikes. Morning summary.

For MVP, only Ketan + Claude are on-call. Alert routing:
- Critical → Slack #alerts + SMS to Ketan via BetterStack
- Warning → Slack #alerts only
- Info → Slack #ops-log (no notification)

## Privacy

- No PII in error messages or logs beyond `user_id` (UUID, not phone/email).
- Sentry's "Send Personally Identifiable Information" toggle: **off**.
- Razorpay payloads are scrubbed before logging (no card numbers, no signatures).

## Production-readiness checklist (end of Phase 5)

- [ ] Sentry catches both FE and BE errors with source maps
- [ ] Every API route has structured logging
- [ ] Uptime monitors green for 7+ consecutive days
- [ ] An alert rule fired and was responded to (drill or real)
- [ ] On-call runbook exists for: site down, payment failures, DB at 80% capacity, Razorpay webhook backlog
