# Svcar QA

The test system that replaces manual QA: layered, automated, security-first. Start here.

| Doc | What it is |
|---|---|
| [QA-STRATEGY.md](QA-STRATEGY.md) | The plan: current state, layered Testing Trophy, tooling per layer, environments, CI/CD, coverage matrix, prioritized roadmap, cited sources. |
| [TEST-CATALOG.md](TEST-CATALOG.md) | Functional test cases (Given/When/Then, stable IDs) for every feature — catalog, search, cart, checkout/money, orders, auth, admin/RBAC, cross-cutting. |
| [SECURITY-TEST-CATALOG.md](SECURITY-TEST-CATALOG.md) | OWASP-mapped attack cases (BOLA/IDOR, JWT, payment integrity, injection, mass-assignment, misconfig, file-upload, business logic) + automated tooling (audit, Semgrep, CodeQL, ZAP, gitleaks). |

## TL;DR

- **Today:** 31 backend tests (mocked DB) + 101 frontend tests (MSW). No real-DB, no E2E, no security, no load tests. Backend CI is minimal; frontend has none.
- **Target:** Unit (keep) → **Integration vs real Postgres** (Testcontainers) → Component (Vitest browser) → **E2E** (Playwright, real wired stack) → Contract (shared zod) → Security (OWASP + ZAP/Semgrep) → Perf (k6) → A11y/CWV (axe + Lighthouse).
- **Build order:** **P0** = real-DB integration for checkout/orders/cart/admin-authz + security IDOR/JWT/payment scripts + CI with `services: postgres`, `pnpm audit`, gitleaks, Semgrep. **P1** = Playwright golden journeys + contract-drift gate. **P2** = component + full functional catalog. **P3** = k6 + Lighthouse + ZAP-full nightly.

## Test ID scheme

`<AREA>-<DOMAIN>-<NNN>` — AREA ∈ {BE, FE, E2E, SEC, PERF, A11Y, CON}. The ID goes in the test
title (`it('SEC-AUTHZ-001: ...')`) so the catalog ↔ code stays traceable (a CI check can diff them).
