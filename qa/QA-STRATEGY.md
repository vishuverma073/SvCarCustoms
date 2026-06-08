# Veronica QA & Test Strategy

> **Goal:** a layered, automated test system that exercises every feature — down to the
> smallest — across functional, integration, end-to-end, security, performance and
> accessibility spectrums, so the suite (not a manual QA team) is the release gate.
>
> **Scope:** two repos — `veronica-api-` (Hono + Postgres backend) and `veronica-india`
> (Next.js 16 storefront + admin). They are currently **mock-first and not yet
> integrated** (`NEXT_PUBLIC_USE_MOCKS=true`); this plan covers both the per-repo
> mocked layer *and* the real integrated stack.
>
> **Status:** `v1 — strategy + catalog`. Companion docs:
> [TEST-CATALOG.md](TEST-CATALOG.md) (functional cases) ·
> [SECURITY-TEST-CATALOG.md](SECURITY-TEST-CATALOG.md) (OWASP attack cases).

---

## 1. Current state (baseline)

| Repo | Test runner | Count | What it covers | Hits real DB / network? |
|---|---|---|---|---|
| `veronica-api-` | Vitest | **31 files** | Every route handler via `createApp().request(...)`, JWT, pricing, OTP, webhooks, cache, audit | **No** — all use a hand-mocked `DbClient`; no Postgres |
| `veronica-api-` | tsx script | `scripts/e2e-checkout.ts` | OTP → cart → Razorpay order → forged-signature verify → order listing, against a *running* API + real DB | Yes (manual, staging) |
| `veronica-india` | Vitest | **101 tests** | `lib/*` (money, sku, backend client), `store/*` (cart/auth), MSW handler contracts | **No** — all against MSW mocks |

**Hard gaps (what this plan fills):**

- ❌ No backend test runs against a **real Postgres** — Drizzle SQL, FTS, transactions, cascades, constraints, `onConflict` upserts are all unverified.
- ❌ No **true end-to-end** test — the two repos have never been wired together in an automated test; `INTEGRATION.md` is still a plan.
- ❌ No **React component** tests and no **browser/E2E** automation (Playwright/Cypress) — browser "smokes" are run by hand and documented in `PHASE-CHECKLIST.md`.
- ❌ No **security** test suite (the auth/IDOR/payment-integrity checks exist in code but are not adversarially tested) and **no security tooling** in CI.
- ❌ No **load/performance** tests and **Lighthouse / Core Web Vitals** never run.
- ❌ **CI is thin:** backend [`ci.yml`](veronica-api-/.github/workflows/ci.yml) is only `install → build contracts → typecheck → test`; **the frontend has no CI workflow at all**.
- ⚠️ **Contract drift risk:** the FE integration spec expects `POST /admin/login`, `POST /admin/upload`, `GET /admin/audit`, but the backend mounts `/admin/auth/login`, `/admin/uploads`, `/admin/audit-log` ([app.ts:80-89](veronica-api-/apps/api/src/app.ts#L80-L89)). Contract tests (§4.4) must catch exactly this class of bug at integration.

---

## 2. The model: a layered Testing Trophy

We use the **Testing Trophy** shape (Kent C. Dodds) rather than a classic pyramid, because the
highest-confidence-per-second layer for this stack is **integration**, not unit. The pyramid's
inversion — the **"ice-cream cone"** (mostly slow manual/E2E, few unit) — is the explicit
anti-pattern to avoid.

```
            ◢ E2E ◣            few, slow, highest-fidelity   (Playwright → real stack)
        ◢──────────◣
       ◢ INTEGRATION ◣         the bulk of value             (real Postgres / real HTTP)
      ◢──────────────◣
     ◢   COMPONENT     ◣       FE behaviour in a real DOM     (Vitest browser + RTL)
    ◢──────────────────◣
   ◢       UNIT          ◣      many, instant, pure logic      (Vitest, mocked deps)
  ◢──────────────────────◣
   └ static: typecheck, lint, Semgrep, dep-scan ┘  (free, every push)
```

Cross-cutting layers run **against the E2E/integration environment**, not as a tier:
**Contract**, **Security (OWASP + DAST)**, **Performance (k6)**, **Accessibility / Core Web Vitals**.

### Target proportions & rationale

| Layer | Target share of suite | Why | Where it lives |
|---|---|---|---|
| **Static** | n/a (gate) | Catches whole bug classes for free | both repos |
| **Unit** | ~45% | Pure logic: pricing/paise math, slugify, sku-matrix, JWT, zod schemas. Already strong (keep). | `*.test.ts` |
| **Integration** | ~35% | **Highest ROI.** BE routes vs real Postgres; FE client vs dummy-api/MSW. Catches the SQL/transaction/constraint bugs the mocked tests can't. | new `tests/integration/**` |
| **Component** | ~10% | FE client-component behaviour (cart UI, OTP input, variant picker, forms) in a real DOM. | new `*.browser.test.tsx` |
| **E2E** | ~7% | Few, golden user journeys through the *real* wired stack. Slow & flakier — keep lean. | new `e2e/**` (Playwright) |
| **Contract** | ~3% | Shared zod schemas verified **both ways** so FE/BE can't drift. | shared |

> **Next.js constraint (cited):** for **async Server Components**, Next.js explicitly
> *recommends E2E over unit testing* because tooling (incl. Vitest) doesn't yet fully
> support them.¹ So storefront pages that are async RSCs (home, category, PDP, search) get
> their coverage in the **Playwright E2E layer**, not via component unit tests. Client
> components (cart, login/OTP, admin forms) get component tests.

---

## 3. Test environments & data

Three runnable environments. The whole point of "test everything like production" is that
**Layer-3/E2E uses the real wired stack**, not mocks.

| Env | Frontend | Backend | DB | Used by |
|---|---|---|---|---|
| **A — mocked** (today) | `USE_MOCKS=true` (MSW) | mocked `DbClient` | none | unit, FE integration, component |
| **B — API integration** | n/a | real Hono app | **real Postgres** (Testcontainers) | BE integration, contract (provider side), security scripts |
| **C — full E2E** | `USE_MOCKS=false` → real API | real Hono app (running) | real Postgres (seeded) | Playwright E2E, ZAP DAST, k6 load, Lighthouse |

**Env C wiring** — a `docker-compose.e2e.yml` brings up: `postgres` → run migrations + seed
(`pnpm db:migrate` + `pnpm db:seed`) → `backend` (`pnpm --filter @veronica/api start`) →
`frontend` (`next start` with `NEXT_PUBLIC_USE_MOCKS=false`, `NEXT_PUBLIC_API_URL=http://backend:8787`).
Third-party services stay in **stub mode** (Razorpay/Resend/MSG91/Inngest already stub when
their env vars are unset — see the existing `e2e-checkout.ts`), so E2E is hermetic and free.

**Test-data strategy:**

- **Seeding:** reuse the existing `scripts/seed-from-data.ts` (8 categories / 12 products / ~25 SKUs) as the deterministic catalog baseline for Env C.
- **Factories:** add typed builders (`makeProduct()`, `makeOrder()`, `makeUser()`) backed by `@faker-js/faker` (already a FE dep) for per-test data, so tests don't depend on seed ordering. Recommended: lightweight builder functions (or `fishery`) that emit valid `@veronica/contracts` shapes.
- **Isolation (Env B):** Testcontainers `snapshot()` after migrate+seed, then `restoreSnapshot()` between tests² — *or* wrap each test in a transaction that rolls back. Default: **transaction-rollback per test** for speed; snapshot/restore for tests that need committed state (e.g. webhook idempotency across connections).

---

## 4. Tooling decisions per layer

> Legend: **[cited]** = backed by a verified research source (see §10). **[judgment]** =
> standard engineering practice; research did not return a verdict (open question) — recommendation is ours.

### 4.1 Unit — Vitest *(keep as-is)*
Already in both repos. Add `@vitest/coverage-v8` gating (FE already has it). No change of tool.

### 4.2 Backend integration — **Testcontainers + real Postgres** **[cited]**
- `@testcontainers/postgresql` starts a real Postgres in Docker from the test process; `getConnectionUri()` feeds a real `postgres`/Drizzle client; `snapshot()/restoreSnapshot()` isolate state (close the connection before snapshot/restore).²
- Run real Drizzle migrations against it; assert on real SQL behaviour: FTS ranking, cursor pagination, `ON DELETE CASCADE`, unique constraints, `onConflictDoUpdate` cart upserts, `transaction()` rollback.
- **Why not `pg-mem`:** it can't faithfully emulate Postgres FTS (`tsvector`/`websearch_to_tsquery`) or some constraint semantics this app relies on — would give false confidence. **[judgment]**
- **Why not mock-only (today):** the 31 current tests prove handler *wiring*, not that the query is correct. Integration is where real bugs surface.

### 4.3 Frontend component — **Vitest browser mode + Testing Library** **[judgment]**
- Test client components in a real browser DOM: OTP 6-box input (auto-advance/paste), variant/SKU picker, cart quantity controls, address form + pincode autofill, admin product/variants editor.
- Async **Server Components** are **not** unit-tested here — they go to E2E per Next.js guidance.¹
- *(Alternative: Playwright Component Testing — viable, but a second browser-test toolchain; prefer one. Revisit if RSC support in Vitest lags.)*

### 4.4 Contract — **shared zod, verified both ways** **[judgment]**
The repos already share `@veronica/contracts` and the FE client `zod.parse()`s every response.
Make this a real gate:
- **Provider side (BE):** in integration tests, parse every handler response through the contract schema (several routes already do, e.g. `OrderDetailSchema.parse`). Add a test that asserts *every* mounted route's response validates.
- **Consumer side (FE):** the MSW handlers must validate against the *same* contracts (catches the `/admin/login` vs `/admin/auth/login` drift).
- **Drift gate:** a CI job that diffs the published contracts version the FE installed vs the BE's, and a generated **route inventory** (method+path) compared FE-expected ↔ BE-mounted. *(Optional upgrade: derive an OpenAPI doc from the zod schemas and fuzz the live API with Schemathesis. **[judgment]**)*

### 4.5 E2E — **Playwright** **[judgment; Next.js documents both]**
- Both Playwright and Cypress are documented by Next.js for E2E.¹ We pick **Playwright**: first-class multi-browser, parallel sharding, trace viewer, `webServer` boot, API-request fixture for hybrid UI+API assertions, auth-state reuse via storage state. Drives Next.js (mocks off) → real backend → real DB (Env C).
- Keep the suite **small and golden** (the ice-cream-cone warning): guest browse → login (OTP) → add to cart → checkout → pay (stub) → order appears → tracking timeline; plus admin: login → create product → see it on storefront.

### 4.6 Load / performance — **k6** **[cited]**
- Express SLOs as **thresholds** that fail CI on a non-zero exit, e.g. `http_req_duration: ['p(95)<200']`, `http_req_failed: ['rate<0.01']`.³
- Model surges with the **open-model `ramping-arrival-rate` executor** so target RPS holds even as the system slows (avoids coordinated omission) — right for checkout surge / OTP-login bursts / search spikes.⁴
- Scenarios: catalog read (cache-hit ratio), search, OTP send/verify burst (also validates rate-limit under load), checkout surge (race on duplicate orders).

### 4.7 Accessibility & frontend quality **[cited thresholds]**
- `@axe-core/playwright` on every key page in the E2E run (0 critical violations gate). **[judgment]**
- **Lighthouse CI** + Core Web Vitals assertions: **LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1**, judged at the **75th percentile**, segmented mobile/desktop.⁵ (Lab scores are proxies for the field SLO.)
- Visual regression via Playwright snapshots on stable pages. **[judgment]**

### 4.8 Security — **OWASP catalog + automated tooling** *(see [SECURITY-TEST-CATALOG.md](SECURITY-TEST-CATALOG.md))*
- **Scripted attack cases** mapped to OWASP API Security Top 10 (2023) & Top 10 (2021): IDOR/BOLA, JWT broken-auth, payment integrity, etc.
- **Automated tooling in CI:** dependency scanning (`pnpm/npm audit` + OSV-Scanner/Dependabot), **SAST** (Semgrep + CodeQL), **DAST** (OWASP **ZAP baseline** — passive, ~1-min, safe per-PR; full-scan nightly⁶), **secret scanning** (gitleaks).

---

## 5. CI/CD orchestration (GitHub Actions)

Both repos need workflows (FE currently has none). Layered by trigger so fast feedback stays fast:

| Stage | Trigger | Jobs |
|---|---|---|
| **Static + Unit** | every push | typecheck, lint, Vitest unit, `pnpm audit`, gitleaks, Semgrep |
| **Integration** | every PR | BE: Vitest integration with **`services: postgres`** (or Testcontainers); FE: component tests; contract drift check |
| **E2E** | every PR | `docker-compose.e2e.yml` up → Playwright (sharded) → axe → upload traces |
| **Nightly** | cron | k6 load (threshold-gated), ZAP **full** scan, Lighthouse CI, full dependency/OSV scan |

- **Parallelization:** Playwright `--shard` across matrix runners; Vitest project sharding. **[judgment, Playwright docs support sharding]**
- **Flaky management:** Playwright `retries: 2` on CI only, quarantine tag for known-flaky, trace-on-first-retry. **[judgment]**
- **Coverage gating:** v8 coverage thresholds per package; upload to Codecov; fail PR on regression. **[judgment]**
- **Ephemeral preview env:** run E2E + ZAP baseline against the per-PR preview deploy (Vercel/Fly) when available. **[judgment]**

---

## 6. Coverage matrix — current vs target

`✅ covered · 🟡 partial (mocked only) · ❌ none`

| Feature domain | Unit | Integration (real DB) | Component | E2E | Security | Perf |
|---|---|---|---|---|---|---|
| Catalog / categories | ✅ | 🟡→❌ | ❌ | ❌ | ❌ | ❌ |
| Product detail / SKU matrix | ✅ | ❌ | ❌ | ❌ | ❌ | — |
| Search (FTS, cursor) | 🟡 | ❌ | ❌ | ❌ | ❌ (injection) | ❌ |
| Cart (merge/concurrency/upsert) | ✅ | ❌ | ❌ | ❌ | ❌ (IDOR) | ❌ |
| Checkout / pricing (paise/GST) | ✅ | ❌ | ❌ | ❌ | ❌ (amount tamper) | ❌ |
| Order lifecycle / tracking | 🟡 | ❌ | — | ❌ | ❌ (IDOR) | — |
| Auth (OTP / JWT / refresh) | ✅ | ❌ | 🟡 | ❌ | ❌ (tamper/brute) | ❌ |
| Payments / webhooks | ✅ | ❌ | — | 🟡 (script) | ❌ (forge/replay) | ❌ |
| Admin CRUD + RBAC + audit | ✅ | ❌ | ❌ | ❌ | ❌ (authz/mass-assign) | — |
| Rate limiting / caching | ✅ | ❌ | — | — | ❌ (bypass) | ❌ |
| Accessibility / CWV | — | — | ❌ | ❌ | — | ❌ |

The strong unit columns are the existing 31+101 tests. **Every other column is the work this plan defines.**

---

## 7. Prioritized roadmap

| Pri | Build | Why first |
|---|---|---|
| **P0** | BE integration harness (Testcontainers + migrate + seed) and port the highest-risk routes (checkout, me/orders, cart, admin authz). **Security** IDOR + JWT + payment-integrity scripts (Env B). FE+BE CI workflows with `services: postgres`, `pnpm audit`, gitleaks, Semgrep. | These cover money + auth + data-isolation — the bugs that cost real money/trust. |
| **P1** | Playwright E2E golden journeys (Env C) + contract drift gate + axe checks. | Proves the two repos actually work wired together; catches the `/admin/login` drift class. |
| **P2** | Component tests (cart, OTP, variant picker, admin forms). Full functional catalog execution (BVA money tables, pairwise SKU matrix, order-status state machine). | Breadth — "even the smallest feature." |
| **P3** | k6 load + thresholds, Lighthouse CI + CWV, ZAP full nightly, visual regression. | Performance/quality SLOs once correctness is locked. |

---

## 8. Test ID & traceability scheme

Every case in the catalogs has a stable ID so it can be traced to code, CI runs, and bugs.

```
<AREA>-<DOMAIN>-<NNN>
  AREA   = BE | FE | E2E | SEC | PERF | A11Y | CON
  DOMAIN = CATALOG SEARCH CART CHECKOUT ORDER AUTH ADMIN PAYMENT RATELIMIT ...
  e.g.  SEC-AUTHZ-003   BE-CHECKOUT-007   E2E-PURCHASE-001
```

Each case is written **Given / When / Then** (Gherkin-style) so it reads as an executable spec and
maps 1:1 to a test. The traceability matrix (catalog tables) keeps **requirement → test ID → layer →
status**. Keep in sync by: (a) the ID appears in the test title (`it('SEC-AUTHZ-003: ...')`), and
(b) a CI check fails if a catalog ID has no matching test title (and vice-versa). **[judgment]**

---

## 9. Open questions (research did not settle — decisions are ours, flag for review)

These came back as **unverified** in the research and are recorded so they're revisited, not assumed:
- Playwright vs Cypress *decision criteria* for Next 16 App Router specifically (we chose Playwright on judgment).
- DB-isolation tradeoff: Testcontainers snapshot/restore vs transaction-rollback vs ephemeral docker vs pg-mem (we chose Testcontainers + txn-rollback default).
- Contract approach: Pact vs zod-assertions vs OpenAPI+Schemathesis (we chose shared-zod both-ways + optional Schemathesis).
- Component testing: Vitest browser mode vs Playwright CT (we chose Vitest browser mode).
- Structured-enumeration depth & living-doc/traceability automation (we defined a scheme in §8; tune in practice).

Re-confirm tool behaviours against the **pinned versions** in each repo before codifying.

---

## 10. References (verified sources)

1. Next.js — *Testing* guide (four tools; E2E recommended for async Server Components): https://nextjs.org/docs/app/guides/testing · https://nextjs.org/docs/app/guides/testing/vitest
2. Testcontainers for Node — PostgreSQL module (real container, `getConnectionUri`, `snapshot/restoreSnapshot`): https://node.testcontainers.org/modules/postgresql/
3. Grafana k6 — Thresholds as SLO pass/fail gates (non-zero exit on failure): https://grafana.com/docs/k6/latest/using-k6/thresholds/
4. Grafana k6 — `ramping-arrival-rate` (open model) & open-vs-closed: https://grafana.com/docs/k6/latest/using-k6/scenarios/executors/ramping-arrival-rate/ · https://grafana.com/docs/k6/latest/using-k6/scenarios/concepts/open-vs-closed/
5. web.dev — Core Web Vitals thresholds & 75th-percentile method: https://web.dev/articles/defining-core-web-vitals-thresholds · https://web.dev/articles/vitals
6. OWASP ZAP — Baseline scan & GitHub Action (passive, CI-safe): https://www.zaproxy.org/docs/docker/baseline-scan/ · https://github.com/zaproxy/action-baseline
7. OWASP API Security Top 10 (2023) — API1 BOLA: https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/
8. OWASP WSTG — Testing JSON Web Tokens (alg:none, key confusion, missing-sig): https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/06-Session_Management_Testing/10-Testing_JSON_Web_Tokens
9. Razorpay — Validate webhooks (HMAC-SHA256 over raw body, `X-Razorpay-Signature`): https://razorpay.com/docs/webhooks/validate-test/

*Supporting/unverified context:* PortSwigger JWT labs; Kent C. Dodds Testing Trophy; Playwright sharding/CI docs; testRigor ice-cream-cone.
