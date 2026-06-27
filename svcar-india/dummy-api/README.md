# Svcar Dummy Backend

A **real HTTP server** for local testing — so the frontend can run against an
external API (`NEXT_PUBLIC_USE_MOCKS=false`) exactly as it will against the
production backend, instead of in-browser MSW mocks.

## How it works

It **reuses the exact same MSW request handlers + seed data** the frontend mocks
use (`src/mocks/handlers/*`, `src/mocks/data/*`), served over real HTTP via
[`@mswjs/http-middleware`](https://github.com/mswjs/http-middleware). So every
response shape is byte-identical to what the frontend's `@svcar/contracts`
zod schemas expect — zero drift, same products / images / categories / details.

On top of the reused handlers it adds the one thing MSW can't do: **real
cookie-based auth**. `/auth/otp/verify` sets an httpOnly `svcar_refresh`
cookie (`SameSite=Lax`, which is sent on same-site `localhost:3000 ↔ :8787`
fetches), `/auth/refresh` reads it to restore the session on reload, and
`/auth/logout` clears it. Everything else (catalog, cart, orders, addresses,
admin, pincode, order events) is the reused handler logic.

State is **in-memory in this process**, so — unlike the mocks — it survives
frontend reloads. It resets when you restart the server.

## Run it

```bash
# 1. Start the dummy backend (port 8787)
npm run dummy-api

# 2. Point the frontend at it — in .env.local:
#    NEXT_PUBLIC_API_URL=http://localhost:8787
#    NEXT_PUBLIC_USE_MOCKS=false
#    NEXT_PUBLIC_MOCK_PAYMENTS=true     # simulate Razorpay (no real keys)
# 3. Start the frontend (separate terminal)
npm run dev
```

Open http://localhost:3000 — the storefront, cart, login, checkout, orders and
admin all run against the dummy backend.

**Test credentials**
- Customer OTP code: `123456` (any phone number works)
- Admin login: `admin@test.local` / `admin123`
- Razorpay: simulated in-app modal (no real keys needed)

## Going back to mocks

Set `NEXT_PUBLIC_USE_MOCKS=true` in `.env.local` and restart `next dev`. You
don't need the dummy server running in mock mode.

## Going to the real backend later

Point `NEXT_PUBLIC_API_URL` at the real API, keep `NEXT_PUBLIC_USE_MOCKS=false`,
and set `NEXT_PUBLIC_MOCK_PAYMENTS=false` once real Razorpay keys are wired. No
frontend code changes — see `../INTEGRATION.md`. The dummy backend implements
the same endpoint surface documented there.

## Notes / limits (it's a dummy)

- Single signed-in customer at a time (the reused handlers track one current
  user); fine for manual testing, not concurrent multi-user.
- Payment verification trusts any signature (no real Razorpay signature check).
- No persistence across server restarts (in-memory).
