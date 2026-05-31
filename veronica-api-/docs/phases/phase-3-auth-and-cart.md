# Phase 3 (Backend) — Auth + Cart

> Renumbered from Phase 2 → Phase 3 on 2026-05-28 (Admin moved to Phase 1). Sentry observability folds into this phase per agent-council review (was originally in Phase 5).

## What you'll build

Phone OTP authentication for Indian customers (we'll use MSG91 unless Ketan decides on Supabase Auth — see Task 2.1), JWT-based session, and a server-synced cart for logged-in users.

Endpoints delivered:
- `POST /auth/otp/send` — generate, hash, store, dispatch SMS
- `POST /auth/otp/verify` — check, issue JWT
- `POST /auth/refresh` — exchange refresh token for new access token
- `POST /auth/logout` — invalidate refresh token
- `GET /me` — current user
- `GET /me/cart` / `POST /me/cart/items` / `PATCH /me/cart/items/:id` / `DELETE /me/cart/items/:id`

Plus: auth middleware that gates routes by JWT, rate limiting on OTP send.

## Prerequisites

- [ ] Phase 1 (Backend) complete — API is deployed and serving reads
- [ ] [TODO confirm with Ketan] Decision made: MSG91 direct vs Supabase Auth phone OTP. The doc assumes MSG91 — adjust if Supabase Auth.
- [ ] [TODO confirm with Ketan] MSG91 account created with: API key, sender ID approved by TRAI, OTP template approved
- [ ] Upstash Redis project created (free tier OK for now) with REST URL + token

## Success criteria

- A user can: POST a phone number, receive an OTP via SMS, POST the OTP back, and get a JWT
- Rate limit enforced: max 1 OTP/phone/60s, max 5 OTPs/phone/hour
- Logged-in user can add/update/remove cart items and they persist across devices
- All auth routes have tests including the negative paths (wrong OTP, expired OTP, rate limit hit)
- `@veronica/contracts@0.2.0` published with new auth + cart schemas

## Estimated effort

2 sessions (~6 hours).

---

## Task 2.1 — Pick + integrate SMS provider

**Context**: [TODO confirm with Ketan — MSG91 vs Supabase Auth]. MSG91 is the recommended path (cheaper, India-first, full control). This task assumes MSG91; if Supabase Auth is chosen, swap the SDK calls but keep the route shapes.

**What to build**: a thin wrapper around MSG91's OTP API.

**Files to touch**:
- `apps/api/src/lib/sms.ts` (new)
- `apps/api/.env.example` — add MSG91 vars
- `apps/api/src/lib/env.ts` — add env validation for MSG91 vars

**Suggested Claude Code prompt**:
> Add MSG91 integration.
>
> 1. In `apps/api/src/lib/env.ts`, add to the env schema:
>    - `MSG91_AUTH_KEY: z.string().min(1)`
>    - `MSG91_SENDER_ID: z.string().length(6)` (e.g. "VRONIC")
>    - `MSG91_TEMPLATE_ID: z.string().min(1)` (the approved DLT template id)
>
> 2. Add the same vars to `.env.example` with placeholder values and a comment pointing to the MSG91 dashboard URL where each is found.
>
> 3. Create `apps/api/src/lib/sms.ts` exporting `sendOtp(phone: string, code: string): Promise<void>`. Use MSG91's "Send OTP" REST API: `POST https://control.msg91.com/api/v5/otp` with the appropriate headers and body. On non-2xx, throw an error with the MSG91 response body.
>
> 4. Add an `isStub` mode: if `NODE_ENV === "test"` or `LOG_LEVEL === "debug"`, log the OTP to stdout instead of dispatching. This lets us run tests without burning real SMS credits.
>
> Don't add tests against the real MSG91 API — only against the stub mode. Real-API check happens in Task 2.2.

**Verification commands**:
```bash
pnpm typecheck

# Mental check: in apps/api/src/lib/sms.ts, the function should be ~30 lines.
```

**Acceptance criteria**:
- [ ] Env vars validated
- [ ] `sendOtp` function exists
- [ ] Stub mode active in test/debug
- [ ] No tests yet (covered in Task 2.2)
- [ ] Commit: `feat(phase-2): add MSG91 SMS integration`

**Pitfalls**:
- TRAI requires DLT (Distributed Ledger Technology) template registration in India. Without an approved template, MSG91 silently drops messages. [TODO confirm with Ketan — template approved?]
- MSG91 has separate dev/prod sender IDs. Use the dev one for staging.

---

## Task 2.2 — `POST /auth/otp/send` endpoint

**Context**: Customer enters phone number on login page; this endpoint generates an OTP, hashes it for storage, dispatches via SMS, and returns success.

**Files to touch**:
- `apps/api/src/routes/auth.ts` (new)
- `apps/api/src/app.ts` — register
- `apps/api/src/lib/otp.ts` (new — helpers)
- `apps/api/tests/auth.test.ts` (new)
- `packages/contracts/src/auth.ts` (new)

**Suggested Claude Code prompt**:
> Add the OTP send flow.
>
> 1. Create `packages/contracts/src/auth.ts` with:
>    - `PhoneSchema = z.string().regex(/^\+91[6-9]\d{9}$/)` (Indian mobile in E.164)
>    - `OtpSendRequestSchema = z.object({ phone: PhoneSchema })`
>    - `OtpSendResponseSchema = z.object({ ok: z.literal(true), expiresInSeconds: z.number() })`
>    - Export from `packages/contracts/src/index.ts`
>
> 2. Create `apps/api/src/lib/otp.ts` with:
>    - `generateOtp(): string` — 6-digit numeric
>    - `hashOtp(code: string): Promise<string>` — bcrypt with 10 rounds
>    - `verifyOtp(code: string, hash: string): Promise<boolean>` — bcrypt compare
>
> 3. Create `apps/api/src/routes/auth.ts` exporting `makeAuthRouter(db)`:
>    - `POST /otp/send`:
>      a. Validate body with `OtpSendRequestSchema`
>      b. Generate 6-digit OTP
>      c. Hash it, insert into `otp_codes` with `expires_at = now + 5 minutes`
>      d. Call `sendOtp(phone, code)` from `lib/sms`
>      e. Return `{ ok: true, expiresInSeconds: 300 }`
>
> 4. Register the router at `/auth` in `app.ts`.
>
> 5. Tests:
>    - valid phone returns 200 with ok response
>    - invalid phone returns 400 with field error
>    - DB row created in otp_codes
>    - sendOtp is called (mock the SMS module)
>
> Rate limiting comes in Task 2.7 — leave a `// TODO Task 2.7: rate limit` comment for now.

**Verification commands**:
```bash
pnpm test apps/api/tests/auth.test.ts

# Manual:
curl -X POST http://localhost:8787/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919350529717"}'
# Expect: {"ok":true,"expiresInSeconds":300}
# Check stdout — should log the OTP in dev mode.

curl -X POST http://localhost:8787/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phone":"invalid"}'
# Expect: 400
```

**Acceptance criteria**:
- [ ] `POST /auth/otp/send` accepts valid Indian phones
- [ ] Rejects invalid format (400)
- [ ] Inserts hashed OTP into `otp_codes`
- [ ] Tests pass
- [ ] Commit: `feat(phase-2): add POST /auth/otp/send`

---

## Task 2.3 — `POST /auth/otp/verify` + JWT issuance

**Context**: User submits the 6-digit code; we verify, mark OTP consumed, upsert the user, and issue access + refresh JWTs.

**Files to touch**:
- `apps/api/src/routes/auth.ts`
- `apps/api/src/lib/jwt.ts` (new)
- `apps/api/src/lib/env.ts` — add JWT secrets
- `packages/contracts/src/auth.ts`
- Tests

**Suggested Claude Code prompt**:
> Add OTP verify + JWT.
>
> 1. In `apps/api/src/lib/env.ts`, add:
>    - `JWT_ACCESS_SECRET: z.string().min(32)` (256+ bits of entropy)
>    - `JWT_REFRESH_SECRET: z.string().min(32)`
>    - `JWT_ISSUER: z.string().default("veronica-api")`
>
> 2. Create `apps/api/src/lib/jwt.ts` with:
>    - `signAccess(payload: { sub: string; isAdmin: boolean }): Promise<string>` — 15min expiry, HS256, uses `jose` library
>    - `signRefresh(payload: { sub: string; jti: string }): Promise<string>` — 30 day expiry, separate secret
>    - `verifyAccess(token: string): Promise<{ sub, isAdmin }>` — throws on invalid
>    - `verifyRefresh(token: string): Promise<{ sub, jti }>`
>
> 3. In `packages/contracts/src/auth.ts`, add:
>    - `OtpVerifyRequestSchema = z.object({ phone: PhoneSchema, code: z.string().length(6).regex(/^\d+$/) })`
>    - `OtpVerifyResponseSchema = z.object({ accessToken: z.string(), refreshToken: z.string(), user: UserSchema })`
>    - `UserSchema = z.object({ id: z.string().uuid(), phone: PhoneSchema, name: z.string().nullable(), email: z.string().email().nullable(), isAdmin: z.boolean() })`
>
> 4. Add `POST /otp/verify` to `apps/api/src/routes/auth.ts`:
>    a. Validate body
>    b. Find the most-recent unconsumed OTP for this phone where `expires_at > now`
>    c. If none, return 401 with `{ error: "OTP expired or not found" }`
>    d. Increment `attempts`; if > 5, return 429 and mark consumed
>    e. `verifyOtp(code, row.code_hash)` — if false, return 401
>    f. Mark OTP consumed (`consumed_at = now`)
>    g. Upsert user by phone (`ON CONFLICT (phone) DO NOTHING ... RETURNING`)
>    h. Sign access JWT (15min) + refresh JWT (30 day)
>    i. Set refresh token as httpOnly cookie (`Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Lax; Path=/auth; Max-Age=2592000`)
>    j. Return `{ accessToken, user }`
>
> 5. Tests: success, wrong code, expired OTP, max attempts.

**Verification commands**:
```bash
pnpm test

# Manual:
# 1. Send OTP
curl -X POST http://localhost:8787/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919350529717"}'

# 2. Read the OTP from server stdout

# 3. Verify
curl -i -X POST http://localhost:8787/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919350529717","code":"<otp-from-stdout>"}'
# Expect: 200, JSON body with accessToken + user, and a Set-Cookie header for refresh_token
```

**Acceptance criteria**:
- [ ] Successful verify returns access token + user
- [ ] Refresh token set as httpOnly cookie
- [ ] User upserted in DB
- [ ] Wrong code → 401
- [ ] Expired OTP → 401
- [ ] Max attempts → 429
- [ ] Tests pass (≥ 4)
- [ ] Commit: `feat(phase-2): add POST /auth/otp/verify with JWT`

**Pitfalls**:
- Don't return the user's `isAdmin` field unless the cookie is consumed correctly — it's a privilege escalation surface if misused.
- bcrypt's 10 rounds adds ~70ms per verify on a Worker. That's fine.

---

## Task 2.4 — Refresh + logout endpoints

**Context**: Access tokens expire in 15 minutes. The frontend exchanges the refresh cookie for a new access token without re-prompting OTP.

**Files to touch**:
- `apps/api/src/routes/auth.ts`
- Tests

**Suggested Claude Code prompt**:
> Add refresh + logout.
>
> 1. `POST /auth/refresh`:
>    - Read refresh token from `refresh_token` cookie
>    - Verify with `verifyRefresh`
>    - Look up user (still active? if soft-deleted, reject)
>    - Issue new access token; rotate refresh token (new jti)
>    - Set new refresh cookie
>    - Return `{ accessToken, user }`
>
> 2. `POST /auth/logout`:
>    - Clear the refresh_token cookie (set Max-Age=0)
>    - [TODO Phase 5 with Redis: blacklist the jti so future refresh attempts fail]
>    - Return `{ ok: true }`
>
> 3. Tests: refresh happy path, refresh with bad token, refresh after logout (currently passes since no blacklist — flag this).

**Verification commands**:
```bash
pnpm test

# Manual:
# After verify, you have a refresh_token cookie. Send it back:
curl -i -X POST http://localhost:8787/auth/refresh \
  -b "refresh_token=<token-from-verify>"
# Expect: 200 with new accessToken + new Set-Cookie

curl -X POST http://localhost:8787/auth/logout \
  -b "refresh_token=<token>"
# Expect: 200, response sets refresh_token cookie to empty with Max-Age=0
```

**Acceptance criteria**:
- [ ] Refresh works with valid cookie
- [ ] Refresh fails with invalid/expired cookie (401)
- [ ] Logout clears the cookie
- [ ] Tests pass
- [ ] Commit: `feat(phase-2): add /auth/refresh and /auth/logout`

---

## Task 2.5 — Auth middleware + `GET /me`

**Context**: Now we need middleware that gates routes by JWT and exposes `c.get("user")` to handlers.

**Files to touch**:
- `apps/api/src/middleware/auth.ts` (new)
- `apps/api/src/routes/me.ts` (new)
- `apps/api/src/app.ts`
- Tests

**Suggested Claude Code prompt**:
> Add auth middleware and the /me endpoint.
>
> 1. Create `apps/api/src/middleware/auth.ts` exporting `requireAuth: MiddlewareHandler`. It should:
>    - Read `Authorization: Bearer <token>` header
>    - Verify with `verifyAccess`
>    - On failure: respond 401 immediately (don't call next)
>    - On success: `c.set("userId", payload.sub); c.set("isAdmin", payload.isAdmin); await next();`
>
> 2. Also export `requireAdmin: MiddlewareHandler` — runs `requireAuth` then checks `isAdmin === true`, else 403.
>
> 3. Create `apps/api/src/routes/me.ts` exporting `makeMeRouter(db)`:
>    - Apply `requireAuth` to the whole router
>    - `GET /` — fetch user from DB by `c.get("userId")`, return matching `UserSchema`
>
> 4. Register at `/me` in `app.ts`.
>
> 5. Tests:
>    - GET /me without Authorization → 401
>    - GET /me with valid token → 200 with user data
>    - GET /me with malformed token → 401

**Verification commands**:
```bash
pnpm test

# Manual:
curl http://localhost:8787/me
# Expect: 401

curl -H "Authorization: Bearer <access-token-from-verify>" http://localhost:8787/me
# Expect: 200 with { id, phone, name, email, isAdmin }
```

**Acceptance criteria**:
- [ ] `requireAuth` middleware in place
- [ ] `requireAdmin` middleware in place (no admins exist yet — manual SQL update can set `is_admin = true` for testing)
- [ ] `GET /me` returns current user
- [ ] Tests pass
- [ ] Commit: `feat(phase-2): add auth middleware + /me`

---

## Task 2.6 — Cart endpoints

**Context**: Logged-in users get a server-synced cart. (Guests still use Zustand localStorage in the frontend.)

**Files to touch**:
- `apps/api/src/routes/me.ts` — extend with cart routes
- `packages/contracts/src/cart.ts` (new)
- Tests

**Suggested Claude Code prompt**:
> Add cart endpoints under /me/cart.
>
> 1. In `packages/contracts/src/cart.ts`:
>    - `CartItemSchema = z.object({ id: z.number(), skuId: z.number(), productName: z.string(), variantLabel: z.string().nullable(), imageUrl: UrlSchema, unitPrice: z.number(), qty: z.number().int().positive() })`
>    - `CartSchema = z.object({ items: z.array(CartItemSchema), subtotal: z.number(), itemCount: z.number().int().nonnegative() })`
>    - `AddCartItemRequestSchema = z.object({ skuId: z.number().int().positive(), qty: z.number().int().positive().default(1) })`
>    - `UpdateCartItemRequestSchema = z.object({ qty: z.number().int().nonnegative() })`  // qty 0 = delete
>
> 2. In `apps/api/src/routes/me.ts`, all routes gated by `requireAuth`:
>    - `GET /cart`: find or create cart for `userId`, return populated `CartSchema` (join cart_items → skus → products → product_images for the display fields)
>    - `POST /cart/items`: validate body, upsert into cart_items (`ON CONFLICT (cart_id, sku_id) DO UPDATE SET qty = cart_items.qty + EXCLUDED.qty`)
>    - `PATCH /cart/items/:id`: update qty; if qty === 0, delete
>    - `DELETE /cart/items/:id`: delete
>
> 3. Tests: get empty cart, add item, get cart (1 item), add same SKU again (qty=2), update qty, delete, qty=0 deletes.
>
> 4. Edge: don't let users mutate other users' cart items. The :id is a cart_items.id, so verify `cart_items.cart_id === userId's cart.id` before update/delete.

**Verification commands**:
```bash
pnpm test

# Manual:
TOKEN="<access-token>"
curl -H "Authorization: Bearer $TOKEN" http://localhost:8787/me/cart
# Expect: { items: [], subtotal: 0, itemCount: 0 }

curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"skuId":1,"qty":2}' http://localhost:8787/me/cart/items
# Expect: 200 with cart item

curl -H "Authorization: Bearer $TOKEN" http://localhost:8787/me/cart
# Expect: items has 1 entry
```

**Acceptance criteria**:
- [ ] Cart CRUD works
- [ ] Same SKU re-add increments qty
- [ ] Qty 0 deletes
- [ ] Users can't mutate other users' carts (403 or 404)
- [ ] Tests pass (≥ 5)
- [ ] Commit: `feat(phase-2): add cart endpoints under /me/cart`

---

## Task 2.7 — Rate limit OTP send

**Context**: OTP send is a cheap DOS vector (we pay per SMS). Limit: 1 per phone per 60s, 5 per phone per hour.

**Files to touch**:
- `apps/api/src/lib/ratelimit.ts` (new)
- `apps/api/src/routes/auth.ts` — use it on `/otp/send`
- `apps/api/src/lib/env.ts` — add Upstash env vars
- Tests

**Suggested Claude Code prompt**:
> Add Redis-backed rate limiting.
>
> 1. Add env vars to `apps/api/src/lib/env.ts`:
>    - `UPSTASH_REDIS_REST_URL: z.string().url()`
>    - `UPSTASH_REDIS_REST_TOKEN: z.string().min(1)`
>
> 2. Install `@upstash/redis` and `@upstash/ratelimit`. Create `apps/api/src/lib/ratelimit.ts`:
>    - Init `@upstash/redis` client from env
>    - Export two limiters:
>      - `otpPerMinute = Ratelimit({ redis, limiter: Ratelimit.slidingWindow(1, "60 s"), prefix: "otp:60s" })`
>      - `otpPerHour = Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "1 h"), prefix: "otp:1h" })`
>    - Export `checkOtpLimit(phone: string)` that runs both, returns `{ allowed: boolean, retryAfterSeconds: number }`
>
> 3. In `/auth/otp/send`, call `checkOtpLimit(phone)` first. If `!allowed`, return 429 with `Retry-After: <seconds>` header.
>
> 4. Tests: 1 request OK, 2nd within 60s returns 429.

**Verification commands**:
```bash
pnpm test

# Manual:
curl -X POST http://localhost:8787/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919350529717"}'
# Expect: 200

# Immediately after:
curl -i -X POST http://localhost:8787/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919350529717"}'
# Expect: 429 with Retry-After header
```

**Acceptance criteria**:
- [ ] First request returns 200
- [ ] Second within 60s returns 429 with Retry-After
- [ ] 6th request in an hour returns 429
- [ ] Different phone numbers are independent (no cross-contamination)
- [ ] Tests pass
- [ ] Commit: `feat(phase-2): rate limit OTP send via Upstash`

---

## Task 2.8 — Bump and publish `@veronica/contracts@0.2.0`

**Suggested Claude Code prompt**:
> Bump `packages/contracts/package.json` to `0.2.0`. Build and publish. Tag.

**Acceptance criteria**:
- [ ] `@veronica/contracts@0.2.0` published
- [ ] Tag pushed
- [ ] Commit: `chore: bump contracts to 0.2.0`

---

## Common pitfalls across this phase

- **JWT secrets must be ≥ 32 bytes.** Use `openssl rand -hex 32` to generate. Set via `wrangler secret put` / `fly secrets set`, never commit.
- **Cookie SameSite**: refresh cookie must be `SameSite=Lax` or `None` (with Secure) for cross-origin storefront → API calls. The browser will silently drop it otherwise.
- **CORS for credentials**: API must respond `Access-Control-Allow-Credentials: true` and a specific origin (not `*`) for cookie-based auth to work.
- **bcrypt cost**: don't go above 10 — 12 rounds is too slow on Workers (might hit CPU limit).
- **Don't return password/code hashes in any response.** Explicitly omit from select projections.

## What's next

→ Phase 4: [Razorpay checkout](./phase-4-razorpay.md) — payment integration.
