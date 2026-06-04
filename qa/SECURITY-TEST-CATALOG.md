# Veronica Security Test Catalog (OWASP-mapped)

> Adversarial test cases mapped to **OWASP API Security Top 10 (2023)** and **OWASP Top 10 (2021)**,
> plus automated tooling wired into CI. Grounded in the actual code paths. Every case has an ID
> (`SEC-<class>-<nnn>`), the attack, and the expected secure result. Run scripted cases against
> **Env B/C** (real backend + real DB) from [QA-STRATEGY.md §3](QA-STRATEGY.md#3-test-environments--data).
>
> **Important nuance (cited):** OWASP "Easy detectability" ratings describe the *attacker's* view,
> not a *scanner's*. **BOLA/IDOR in particular cannot be reliably auto-detected by DAST** — these
> need hand-written cross-account scripts.⁷ So the catalog below is the primary control; ZAP/Semgrep
> are the safety net.

---

## A. Broken Object-Level Authorization (BOLA / IDOR) — **API1:2023** *(highest priority)*

Why #1: OWASP rates BOLA Exploitability **Easy** / Prevalence **Widespread** / Detectability **Easy**, and it's ~40% of API attacks.⁷ The app *does* owner-scope its queries — these tests are the **regression guard** that it stays that way. Pattern: create resources as **user A**, authenticate as **user B**, attempt access.

| ID | Pri | Attack → Expected |
|---|---|---|
| SEC-AUTHZ-001 | P0 | User B `GET /me/orders/:orderNumber` (A's order #) → **404**, no leak. Code scopes `and(orderNumber, userId)` ([me.ts:367-371](veronica-api-/apps/api/src/routes/me.ts#L367-L371)). Also test `/:orderNumber/events`. |
| SEC-AUTHZ-002 | P0 | User B `PATCH`/`DELETE /me/cart/items/:id` (A's line) → **404** (scoped to caller's cart, [me.ts:201](veronica-api-/apps/api/src/routes/me.ts#L201)). |
| SEC-AUTHZ-003 | P0 | User B `PATCH`/`DELETE /me/addresses/:id` (A's address) → **404** ([me.ts:281-286](veronica-api-/apps/api/src/routes/me.ts#L281-L286)). |
| SEC-AUTHZ-004 | P0 | User B `POST /checkout/order {addressId: <A's id>}` → **400** "Address not found" (ownership check, [checkout.ts:98-104](veronica-api-/apps/api/src/routes/checkout.ts#L98-L104)). |
| SEC-AUTHZ-005 | P0 | User B `POST /checkout/verify` for A's razorpay order → **403** ([checkout.ts:232](veronica-api-/apps/api/src/routes/checkout.ts#L232)). |
| SEC-AUTHZ-006 | P1 | Enumerate sequential IDs (cart line, address are serial ints) across accounts → always 404, no timing oracle distinguishing "exists-but-not-yours" vs "doesn't-exist". |
| SEC-AUTHZ-007 | P1 | Object ID smuggled in **body/header** (not just path) still authorized server-side (BOLA via payload).⁷ |

## B. Broken Function-Level Authorization (BFLA / RBAC) — **API5:2023**, A01:2021

| ID | Pri | Attack → Expected |
|---|---|---|
| SEC-AUTHZ-010 | P0 | Customer access token (valid, `isAdmin:false`) → any `/admin/*` mutation → **403**. Admin middleware re-checks `is_admin` in DB, not the JWT ([auth.ts:67](veronica-api-/apps/api/src/middleware/auth.ts#L67)). |
| SEC-AUTHZ-011 | P0 | No token → `/admin/*` → **401**. |
| SEC-AUTHZ-012 | P0 | A user whose `is_admin` is revoked in DB loses admin access within the **60s cache TTL** ([auth.ts:16](veronica-api-/apps/api/src/middleware/auth.ts#L16)). |
| SEC-AUTHZ-013 | P1 | Forge a customer access token with `isAdmin:true` in the payload → still **403** on `/admin/*` (admin routes use the *separate* admin JWT + DB check, customer `isAdmin` claim is irrelevant to admin routes). |
| SEC-AUTHZ-014 | P1 | Admin token used on a *customer* `/me/*` route → behaves per `verifyAccess` (wrong issuer → 401); confirm the two JWT audiences don't cross. |

## C. Broken Authentication — **API2:2023**, A07:2021 (JWT, OTP, refresh)

JWT facts: HS256, issuer-checked, `JWT_ADMIN_SECRET`/`JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` each ≥32 chars ([jwt.ts](veronica-api-/apps/api/src/lib/jwt.ts)).

| ID | Pri | Attack → Expected |
|---|---|---|
| SEC-AUTH-001 | P0 | **alg:none** — strip signature (trailing `.`), set header `alg:none` (and case variants `NoNe`) → **rejected**.⁸ |
| SEC-AUTH-002 | P0 | **Tamper without re-signing** — mutate payload (`sub`, `isAdmin`, `exp`), keep original header+signature → **rejected** (signature mismatch).⁸ |
| SEC-AUTH-003 | P0 | **Wrong/guessed secret** — sign a valid-looking HS256 token with a different key → **rejected**. |
| SEC-AUTH-004 | P1 | **Key confusion (RS256→HS256)** — N/A today (HS256-only), but assert the verifier pins `"HS256"` and rejects other `alg` values, so a future RS256 migration can't be downgraded.⁸ |
| SEC-AUTH-005 | P0 | **Expired token** — `exp` in the past → **401** on `/me/*` and `/admin/*` (BVA around `exp`). |
| SEC-AUTH-006 | P0 | **Wrong issuer** — valid signature but `iss` ≠ `veronica-api`/`veronica-admin` → **rejected** ([jwt.ts:79](veronica-api-/apps/api/src/lib/jwt.ts#L79), [jwt.ts:31](veronica-api-/apps/api/src/lib/jwt.ts#L31)). |
| SEC-AUTH-007 | P0 | **Refresh replay** — use a refresh token, then reuse the *old* one after rotation → **401** (rotation + JTI). Also: logged-out JTI → **401** (revocation list). |
| SEC-AUTH-008 | P0 | **OTP brute force** — many wrong codes for one phone → locked after max attempts; rate-limit blocks beyond 1/min, 5/hour. |
| SEC-AUTH-009 | P0 | **Rate-limit bypass** — spoof `X-Forwarded-For` / rotate it to evade the OTP limiter → limiter keys on **phone**, not IP, so it still blocks (verify; if IP-keyed anywhere, that's a finding). |
| SEC-AUTH-010 | P1 | **Cookie flags** — refresh cookie is `HttpOnly`, `Secure`, `SameSite` set, scoped path; not readable by JS. |
| SEC-AUTH-011 | P1 | **Startup guard** — booting with a `JWT_*_SECRET` < 32 chars throws (no weak-secret deploy, [jwt.ts:8](veronica-api-/apps/api/src/lib/jwt.ts#L8)). |
| SEC-AUTH-012 | P1 | **User enumeration** — OTP-send / admin-login responses + timing don't reveal whether a phone/email exists. |

## D. Payment integrity (Razorpay) — business-logic, A08:2021

| ID | Pri | Attack → Expected |
|---|---|---|
| SEC-PAY-001 | P0 | **Amount tampering** — client sends its own `amount`/price in `/checkout/order` → ignored; server recomputes from current SKU prices ([checkout.ts:63-94](veronica-api-/apps/api/src/routes/checkout.ts#L63-L94)). Charged amount = `round(server total × 100)` paise. |
| SEC-PAY-002 | P0 | **Forged signature** at `/checkout/verify` → **400** "Invalid signature" and order set `cancelled` ([checkout.ts:239-254](veronica-api-/apps/api/src/routes/checkout.ts#L239-L254)). HMAC-SHA256 over `order_id|payment_id`. |
| SEC-PAY-003 | P0 | **Webhook replay** — POST the same `payment.captured` twice → idempotent, no double fulfilment. Signature = HMAC-SHA256 over the **raw body** keyed by the webhook secret, in `X-Razorpay-Signature`.⁹ |
| SEC-PAY-004 | P0 | **Webhook forgery** — wrong/missing `X-Razorpay-Signature` → rejected; **raw bytes** are hashed before any JSON re-serialization (the classic break is parsing then re-stringifying, which changes the digest).⁹ |
| SEC-PAY-005 | P1 | **Cross-order signature reuse** — valid signature from order X replayed for order Y → rejected. |
| SEC-PAY-006 | P1 | **Verify on someone else's pending order** — covered by SEC-AUTHZ-005; confirm no state change. |
| SEC-PAY-007 | P2 | **Idempotent already-paid** — re-verify a `paid` order with garbage signature → `200` no-op by design ([checkout.ts:235-237](veronica-api-/apps/api/src/routes/checkout.ts#L235-L237)); confirm it does **not** re-emit `order.paid` / re-clear or duplicate side-effects. |

> **Test-mode safety:** the app stubs Razorpay when keys are unset; `e2e-checkout.ts` already forges the HMAC exactly as Razorpay does, so payment paths are testable with **zero real charges**. Keep all payment tests in stub/test mode.⁹

## E. Injection — **API8:2023**, A03:2021

| ID | Pri | Attack → Expected |
|---|---|---|
| SEC-INJ-001 | P0 | **SQLi** in slug/search/path/cursor (`' OR 1=1--`, `; DROP TABLE products;--`) → no SQL error, no data leak (Drizzle parameterizes; verify nothing is string-concatenated). |
| SEC-INJ-002 | P1 | **FTS operator injection** in `/search?q=` (`:* & | ! ' \`) → handled as text, no 500 (links BE-SEARCH-003). |
| SEC-INJ-003 | P1 | **Redis/rate-limit key injection** — phone with `\n`/`:`/control chars can't poison or escape the rate-limit key namespace. |
| SEC-INJ-004 | P2 | **Header/log injection** — CRLF in inputs doesn't break structured JSON logs. |
| SEC-INJ-005 | P1 | **Stored XSS** — product name/description/notes with `<script>` → escaped in the order-confirmation email (existing email-escape test) and in FE rendering (React escapes; verify no `dangerouslySetInnerHTML` on user data). |

## F. Mass assignment / over-posting — **API3:2023**, A08:2021

| ID | Pri | Attack → Expected |
|---|---|---|
| SEC-MASS-001 | P1 | `PATCH /me {isAdmin:true, id:'other'}` → ignored; only `name`/`email` are settable ([me.ts:133-137](veronica-api-/apps/api/src/routes/me.ts#L133-L137)). |
| SEC-MASS-002 | P1 | Admin `PATCH /admin/products/:id` / categories with extra/unknown fields (`createdAt`, `id`, internal flags) → ignored or rejected (zod strips/strict). Note: FE-known-gap "admin PATCH handlers don't validate bodies" — **explicitly test this**. |
| SEC-MASS-003 | P1 | `POST /me/addresses {userId:'<other>'}` → `userId` is taken from the token, not the body. |
| SEC-MASS-004 | P2 | Order create with injected `status:'paid'`, `total:1` → ignored; status forced `pending`, total server-computed. |

## G. Security misconfiguration — **API8:2023**, A05:2021

| ID | Pri | Attack → Expected |
|---|---|---|
| SEC-CFG-001 | P0 | **CORS** — request with a non-allowlisted `Origin` in prod (`NODE_ENV=production`) → no reflected `Access-Control-Allow-Origin`; only `CORS_ORIGINS` allowed; `*` never with credentials ([app.ts:54-64](veronica-api-/apps/api/src/app.ts#L54-L64)). |
| SEC-CFG-002 | P1 | **CORS dev reflection** doesn't leak into prod — `localhost` origins rejected when `isProd`. |
| SEC-CFG-003 | P1 | **Security headers** present: HSTS, `X-Content-Type-Options:nosniff`, `X-Frame-Options:DENY`, CSP (security-headers middleware). |
| SEC-CFG-004 | P1 | **No stack traces / internals** in 5xx bodies — `onError` returns generic `{error:"Internal Server Error"}` ([app.ts:102-116](veronica-api-/apps/api/src/app.ts#L102-L116)); details only in logs/Sentry. |
| SEC-CFG-005 | P1 | **Debug routes off in prod** — `/test-error` only when `ENABLE_TEST_ERROR=1`; `/metrics` exposure reviewed. |
| SEC-CFG-006 | P2 | **PII scrubbing** — Sentry filter strips password/token/code/signature (existing test); confirm no PII in logs. |

## H. Resource exhaustion / unrestricted consumption — **API4:2023**

| ID | Pri | Attack → Expected |
|---|---|---|
| SEC-DOS-001 | P1 | Huge JSON body / deeply nested payload → rejected (size/depth limit), no OOM. |
| SEC-DOS-002 | P1 | `limit`/pagination set to huge values → clamped (links BE-CATALOG-008). |
| SEC-DOS-003 | P1 | 10k-item cart / 10k-line order create → bounded or rejected, no unbounded transaction. |
| SEC-DOS-004 | P2 | OTP/login flood from one phone → 429 (links SEC-AUTH-008); from many phones → rate-limit infra holds (k6 perf overlap). |

## I. File-upload abuse — **API8:2023**, A04:2021

| ID | Pri | Attack → Expected |
|---|---|---|
| SEC-FILE-001 | P1 | Non-image MIME (e.g. `text/html`, `.svg` with script, `.php`) → **400** (image-only check). |
| SEC-FILE-002 | P1 | >5MB file → **400**; exactly 5MB boundary (BVA). |
| SEC-FILE-003 | P1 | Spoofed `Content-Type` (image header, executable body) / magic-byte mismatch → rejected. |
| SEC-FILE-004 | P2 | Path traversal in filename (`../../`), returned key/URL is a safe nanoid slug, not attacker-controlled path. |

## J. SSRF — **API7:2023** (relevant where the server fetches a URL)

| ID | Pri | Attack → Expected |
|---|---|---|
| SEC-SSRF-001 | P2 | Any admin field accepting a URL (image URL, home/promo config) that the **server** later fetches → block internal/metadata targets (`169.254.169.254`, `localhost`, `file://`). If URLs are only stored/served to the client (not server-fetched), document as **N/A** with rationale. |
| SEC-SSRF-002 | P2 | Pincode lookup proxies to India Post — confirm the upstream host is fixed (not user-controlled) so it can't be redirected. |

## K. Business-logic abuse

| ID | Pri | Attack → Expected |
|---|---|---|
| SEC-BIZ-001 | P0 | **Negative / zero quantity** in cart/order (`qty:-1`, `0`, `1e9`) → rejected (EP+BVA); can't create negative line totals. |
| SEC-BIZ-002 | P0 | **Negative price / sale > base** at admin create → validated; no negative `unitPrice` reaches checkout. |
| SEC-BIZ-003 | P1 | **Shipping-threshold gaming** — can't get free shipping then remove items below threshold post-order (price/shipping recomputed server-side at order time). |
| SEC-BIZ-004 | P1 | **GST/total manipulation** — total is always `subtotal + shipping`, GST inside; no client field changes it (links SEC-PAY-001). |
| SEC-BIZ-005 | P1 | **Stale-price race** — price changes between add-to-cart and checkout → charged at *current* price, customer sees the change (no underpay). |
| SEC-BIZ-006 | P2 | **Double-submit checkout** — two concurrent `/checkout/order` from one cart → no duplicate paid orders (idempotency/locking review). |

---

## Automated security tooling (wire into CI)

| Tool | Type | Where | Notes |
|---|---|---|---|
| `pnpm audit` / `npm audit` | Dependency (SCA) | every push | fail on high/critical |
| **OSV-Scanner** / Dependabot | Dependency (SCA) | nightly + PR | broader DB than audit; Dependabot auto-PRs |
| **Semgrep** (`p/javascript`, `p/typescript`, `p/owasp-top-ten`, secrets) | SAST | every push | fast; custom rule e.g. "no string-concat into `sql\`\``" |
| **CodeQL** | SAST | PR + nightly | deeper taint analysis, GitHub-native |
| **gitleaks** / trufflehog | Secret scanning | every push (full history nightly) | `.env*` are gitignored — verify no secret ever committed |
| **OWASP ZAP baseline** | DAST | PR / on push / nightly cron | passive, ~1-min spider, **non-attacking** — safe per-PR against Env C / preview⁶ |
| **OWASP ZAP full scan** | DAST | nightly only | adds active XSS/SQLi payloads — never per-PR⁶ |

**GitHub Actions sketch** (ZAP, official action⁶):
```yaml
# .github/workflows/security-nightly.yml
on: { schedule: [{ cron: '0 1 * * *' }], workflow_dispatch: {} }
jobs:
  zap-baseline:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker compose -f docker-compose.e2e.yml up -d --wait   # Env C
      - uses: zaproxy/action-baseline@v0.14.0
        with: { target: 'http://localhost:3000' }
```
Both repos also get: a **push** workflow (typecheck, lint, unit, `audit`, gitleaks, Semgrep) and a
**PR** workflow (integration with `services: postgres`, E2E, ZAP baseline). The frontend currently
has **no** workflow — that's the first security gap to close.

---

## Coverage by OWASP API Security Top 10 (2023)

| | Category | Cases | Pri |
|---|---|---|---|
| API1 | BOLA / IDOR | SEC-AUTHZ-001..007 | P0 |
| API2 | Broken Authentication | SEC-AUTH-001..012 | P0 |
| API3 | Broken Object Property Auth (mass assignment) | SEC-MASS-001..004 | P1 |
| API4 | Unrestricted Resource Consumption | SEC-DOS-001..004 | P1 |
| API5 | Broken Function-Level Auth (RBAC) | SEC-AUTHZ-010..014 | P0 |
| API7 | SSRF | SEC-SSRF-001..002 | P2 |
| API8 | Misconfiguration / Injection | SEC-CFG-*, SEC-INJ-*, SEC-FILE-* | P0–P1 |
| — | Payment integrity (business logic) | SEC-PAY-*, SEC-BIZ-* | P0 |

References ⁶–⁹ as in [QA-STRATEGY.md §10](QA-STRATEGY.md#10-references-verified-sources).
