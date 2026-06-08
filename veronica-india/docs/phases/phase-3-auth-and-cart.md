# Phase 3 (Frontend) — Auth + Cart

> Renumbered from Phase 2 → Phase 3 on 2026-05-28 (Admin moved to Phase 1). Sentry observability folds into this phase per agent-council review.

## What you'll build

A phone-OTP login flow, an auth-aware state store, server-synced cart for logged-in users (with guest→server merge on login), and a simple `/account` page.

## Prerequisites

- [ ] Backend Phase 2 complete — auth + cart endpoints live, MSG91 (or chosen provider) tested
- [ ] You can manually verify a phone via the backend (curl-tested in BE Phase 2)
- [ ] `@veronica/contracts@0.2.0` published

## Success criteria

- A new customer can log in via phone OTP from the storefront
- Returning customer's refresh token survives 30 days
- Logged-in user's cart syncs to the server within 500ms of any add/update/remove
- Guest cart in localStorage merges into the server cart on login (no duplicate items, qtys summed)
- Header shows the user's name (or "Account") when logged in
- `pnpm test` passes; Lighthouse perf still ≥ 90

## Estimated effort

2 sessions (~6 hours).

---

## Task 2.1 — Auth store (Zustand) + AuthProvider

**Context**: We need client-side state for the access token, user object, and login status. Refresh token is httpOnly so the frontend never sees it directly.

**Files to touch**:
- `src/store/authStore.ts` (new)
- `src/components/auth/AuthProvider.tsx` (new)
- `src/app/layout.tsx` — wrap with `<AuthProvider>`
- `src/lib/backend.ts` — add auth helpers

**Suggested Claude Code prompt**:
> 1. Create `src/store/authStore.ts` with Zustand (no persist — access token lives in memory only):
>    - state: `accessToken: string | null`, `user: User | null`, `status: "idle" | "authenticating" | "authenticated" | "unauthenticated"`
>    - actions: `setAuth(accessToken, user)`, `clearAuth()`
>
> 2. Extend `src/lib/backend.ts` with auth methods (all use `credentials: "include"` so cookies are sent):
>    - `sendOtp(phone)` — POSTs to `/auth/otp/send`
>    - `verifyOtp(phone, code)` — POSTs to `/auth/otp/verify`, returns `{ accessToken, user }`
>    - `refresh()` — POSTs to `/auth/refresh` (no body), returns `{ accessToken, user }`
>    - `logout()` — POSTs to `/auth/logout`
>    - `getMe(accessToken)` — GET `/me` with Authorization header
>
> 3. Also add an authenticated `fetcher` helper that takes a path + method, reads token from authStore, sends with `Authorization: Bearer ...`, and if response is 401, calls `refresh()` once and retries.
>
> 4. Create `src/components/auth/AuthProvider.tsx` — a client component that:
>    - On mount, calls `backend.refresh()` to attempt restoring session from cookie
>    - Sets the auth store on success
>    - Sets status to "unauthenticated" on failure
>
> 5. Wrap `<AuthProvider>` around `children` in `src/app/(store)/layout.tsx` (NOT the root `src/app/layout.tsx` — keep root server-side).

**Verification commands**:
```bash
pnpm typecheck
pnpm dev
# Open DevTools → Application → Cookies → localhost:3000
# - Initially no refresh_token cookie (since not logged in)
# - Console: no errors
```

**Acceptance criteria**:
- [ ] Auth store exists and is typed
- [ ] AuthProvider attempts silent refresh on mount
- [ ] `backend.*` auth methods all in place
- [ ] `pnpm typecheck` passes
- [ ] Commit: `feat(phase-2): add auth store and provider`

**Pitfalls**:
- The access token must NEVER go to localStorage (XSS exposure). Memory only.
- The refresh attempt on mount should not block render — fire-and-forget, update store when it resolves.

---

## Task 2.2 — Login page UI

**Context**: Two-step UI: phone entry → OTP entry. Show validation, loading, and error states.

**Files to touch**:
- `src/app/(store)/login/page.tsx` (new)
- `src/components/auth/PhoneInput.tsx` (new)
- `src/components/auth/OtpInput.tsx` (new)

**Suggested Claude Code prompt**:
> Build `/login` as a client component. Two screens:
>
> Screen 1 — Phone entry:
> - Heading "Sign in to Veronica"
> - +91 prefix locked, then 10-digit numeric input
> - Continue button, disabled until 10 digits entered
> - On submit: call `backend.sendOtp("+91" + digits)`, show inline error on 429 (use Retry-After) or 400, on 200 advance to Screen 2
> - "Continue as guest" link back to home
>
> Screen 2 — OTP entry:
> - "Enter the 6-digit code sent to +91 XXXXX XX${last4}"
> - 6-box OTP input (auto-advance between boxes, paste supports full code)
> - Use the Web OTP API if available: `<input autocomplete="one-time-code" />`. Show inline note "We'll try to autofill from SMS on supported phones"
> - On submit: `backend.verifyOtp(phone, code)`, on 401 show error and clear input, on 200 update auth store and redirect to where they came from (or `/` if no `returnTo`)
> - "Resend OTP" button — disabled for 60s after send, shows countdown
> - "Change number" link → back to Screen 1
>
> Match the existing storefront design tokens (`btn-primary`, `input`, etc. from globals.css).

**Verification commands**:
```bash
pnpm dev
# Browser: /login
# - Phone screen: enter 9350529717, click Continue
# - Server stdout: see the OTP printed (if BE is in debug mode)
# - OTP screen: enter the code
# - On success: redirect to /
# - Header now shows the user (via Task 2.3)
```

**Acceptance criteria**:
- [ ] /login route exists and renders both screens
- [ ] Phone input validates (only 10 digits, only numeric)
- [ ] OTP input has auto-advance, paste-friendly
- [ ] Web OTP autofill attribute set
- [ ] Error states show inline (not in alert dialogs)
- [ ] Resend disabled for 60s after send
- [ ] Successful login redirects to `?returnTo=` or `/`
- [ ] Mobile responsive (single column, large touch targets)
- [ ] Commit: `feat(phase-2): add /login with phone OTP flow`

---

## Task 2.3 — Header shows logged-in state

**Files to touch**:
- `src/components/store/Header.tsx`

**Suggested Claude Code prompt**:
> Update `src/components/store/Header.tsx` to be auth-aware (mark as client component if not already):
>
> - Read `user` and `status` from `useAuthStore`
> - If `status === "authenticated"`: show "Hi, ${user.name || 'there'}" with a dropdown including "Account", "My Orders", "Logout"
> - If `status === "unauthenticated"`: show "Sign In" link → `/login`
> - During `status === "idle"` or `"authenticating"`: show a skeleton (avoid flash of unauthenticated)
> - Mobile menu mirrors the same state
> - Logout: call `backend.logout()`, clear auth store, redirect to `/`

**Verification commands**:
```bash
pnpm dev
# - Logged out: header shows "Sign In"
# - Click Sign In → /login → complete flow
# - After verify: header updates to "Hi, ..." (or "Hi, there" if no name set)
# - Click Logout → header reverts to "Sign In", no refresh_token cookie remains
```

**Acceptance criteria**:
- [ ] Header reflects auth state
- [ ] No flash of unauthenticated content
- [ ] Logout fully clears state
- [ ] Mobile menu mirrors desktop
- [ ] Commit: `feat(phase-2): auth-aware header`

---

## Task 2.4 — Server-sync cart for logged-in users

**Context**: Today the cart is purely Zustand+localStorage (`useCartStore`). For logged-in users, we need to keep a server-side copy in sync.

**Strategy**: cart store keeps acting as the source of truth in the UI. On every mutation (`addItem`, `updateQty`, `removeItem`), if user is logged in, also fire a backend call. On app load (when user is logged in), fetch server cart and merge with local cart, then replace local with server.

**Files to touch**:
- `src/store/cartStore.ts`
- `src/components/auth/AuthProvider.tsx` — trigger cart hydration after auth resolves
- `src/lib/backend.ts` — add cart methods

**Suggested Claude Code prompt**:
> Add cart sync.
>
> 1. Extend `src/lib/backend.ts` with cart methods (all require auth — use the authenticated fetcher):
>    - `getCart()` — GET /me/cart
>    - `addCartItem(skuId, qty)` — POST /me/cart/items
>    - `updateCartItem(id, qty)` — PATCH /me/cart/items/:id
>    - `removeCartItem(id)` — DELETE /me/cart/items/:id
>
> 2. In `src/store/cartStore.ts`, the items shape needs to track server `id` for logged-in items. Add optional `serverId: number | undefined` to `CartItem`. Local-only items have it undefined.
>
> 3. Add a method `syncWithServer()`:
>    - Fetch server cart
>    - For each server item not in local: add to local
>    - For each local item not on server (no serverId, or server has a different qty): push to server
>    - Idempotency: use `(skuId)` as the merge key. If both have the same SKU, sum quantities.
>    - After merge, set local state to match server (with serverIds attached)
>
> 4. In `AuthProvider`, after auth resolves to "authenticated", call `useCartStore.getState().syncWithServer()`.
>
> 5. Modify `addItem`, `updateQty`, `removeItem` in cart store: if user is authenticated, also call the corresponding backend method. If the call fails, surface a toast/error but don't roll back local state (keep optimistic UX).

**Verification commands**:
```bash
pnpm dev
# 1. As guest, add 2 items to cart from PDPs.
# 2. Open /cart — see 2 items.
# 3. Go to /login, log in.
# 4. Open Network tab; see calls to /me/cart on auth.
# 5. Open /cart — still see 2 items.
# 6. Logout, log back in on a different browser session — cart should still have the 2 items (it persisted server-side).
```

**Acceptance criteria**:
- [ ] Guest cart works (localStorage as before)
- [ ] After login, local cart merges with server cart (no duplicates by SKU)
- [ ] Mutations while logged-in sync to server
- [ ] Cart visible across devices when logged in
- [ ] Commit: `feat(phase-2): server-sync cart for logged-in users`

**Pitfalls**:
- Race conditions: if the user clicks "add" 3 times quickly, you'll fire 3 POSTs. The server is idempotent (sums quantities) but you may see 3 confirmations in dev tools.
- If the access token expires mid-session, the authenticated fetcher should refresh and retry — but only once per request to avoid infinite loops.

---

## Task 2.5 — `/account` page

**Context**: A simple page showing the user's profile and a link to orders (orders page comes in Phase 3).

**Files to touch**:
- `src/app/(store)/account/page.tsx` (new)
- `src/components/store/Header.tsx` — the "Account" link points here

**Suggested Claude Code prompt**:
> Create `/account` as a client component (because it depends on auth state). Redirect to `/login?returnTo=/account` if not logged in.
>
> Show:
> - User's phone (formatted as +91 XXXXX XXXXX)
> - Editable name field (text input + save button — calls `PATCH /me` on the backend; [TODO confirm backend has this endpoint, add to Phase 2 BE if missing])
> - Editable email field
> - Link to "My Orders" (stub for now → `/orders`, which is built in Phase 3)
> - Logout button
>
> Style with the existing design tokens.

**Verification commands**:
```bash
pnpm dev
# - Not logged in → /account redirects to /login
# - Logged in → /account shows phone, name input, email input, logout
```

**Acceptance criteria**:
- [ ] /account exists and requires auth
- [ ] Phone displayed correctly
- [ ] Name + email editable and persist after refresh
- [ ] Logout button works
- [ ] Commit: `feat(phase-2): add /account page`

---

## Task 2.6 — Smoke test the full auth + cart loop

**Suggested Claude Code prompt**:
> Manual smoke test. Walk through these steps and report:
>
> 1. Start fresh (clear cookies + localStorage)
> 2. Add 2 items to cart as a guest. Confirm /cart shows them.
> 3. Click Sign In → enter phone → submit → enter OTP → verify success
> 4. Check that /cart still shows 2 items
> 5. Open a Private/Incognito window. Log in with same phone. Confirm /cart shows the 2 items in the new session.
> 6. In the new session, add a 3rd item. Switch back to the original window. Hard refresh `/cart`. Should now show 3 items.
> 7. Logout. Confirm header reverts to "Sign In". Refresh `/cart` — should still show items (localStorage persists for guests).
> 8. Add a 4th item as guest. Log back in. Confirm cart shows 4 items (or sums if duplicate SKU).
>
> Run `pnpm test` and `pnpm typecheck`.

**Acceptance criteria**:
- [ ] All 8 steps pass
- [ ] Phase 2 status updated in `docs/phases/README.md`
- [ ] Commit final fixes

---

## Common pitfalls across this phase

- **Cookie SameSite + CORS**: if cookies don't reach the backend, check `credentials: "include"` on fetch, CORS `Access-Control-Allow-Credentials: true` on backend, and specific origin (not `*`).
- **Hydration mismatch on Header**: if Header reads from authStore on the server and client differently, you'll see hydration warnings. Use the `isMounted` pattern (already in the existing Header for cart count).
- **Cart sync race**: don't sync on every keystroke (e.g. don't sync per-second cart updates from quantity dragging). Debounce or only sync on commit.
- **OTP autofill on iOS**: requires `autocomplete="one-time-code"` AND the message must contain "code" or similar keyword. iOS shows a suggestion above the keyboard.

## What's next

→ Phase 4: [Razorpay checkout](./phase-4-razorpay.md) — payment integration.
