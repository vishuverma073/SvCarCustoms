# Svcar

Monorepo with two apps:

- `svcar-api` — backend API (Hono + Drizzle), runs on **:8787**. Uses a remote Supabase Postgres, so no local DB needed.
- `svcar-india` — frontend (Next.js), runs on **:3000**. Already pointed at the backend via `.env.local`.

## Run locally (both)

Open two terminals from the repo root:

```bash
# 1. Backend  → http://localhost:8787
cd svcar-api && pnpm install && pnpm dev

# 2. Frontend → http://localhost:3000
cd svcar-india && npm install && npm run dev
```

Then open http://localhost:3000 (admin at http://localhost:3000/admin).

## Notes

- Env files already exist: `svcar-api/apps/api/.env` and `svcar-india/.env.local`. Copy from the matching `.example` if missing.
- `pnpm install` / `npm install` can be skipped once dependencies are installed.
- Frontend without the backend: set `NEXT_PUBLIC_USE_MOCKS=true` in `svcar-india/.env.local` to use in-browser mocks.
- "Port already in use" just means the app is already running — open the URL above.

## Local dev notes

- **Login / OTP**: login uses **email OTP** (via Resend). Without a `RESEND_API_KEY` the code runs in stub mode and is **printed in the backend terminal** instead of emailed. After you tap “Send code”, look for **`🔐 DEV OTP for <email>: 123456`** in the terminal running `pnpm dev`.
- **Cart**: in dev the cart is stored in `sessionStorage`, so each fresh browser session starts empty (reloads within a session keep it). Production uses `localStorage`.
- The backend allows CORS from `localhost`/`127.0.0.1` automatically; add deployed frontend origins via `CORS_ORIGINS` (comma-separated) in the API `.env`.

## Online orders — production minimum

Everything below the site/admin baseline. Skip Inngest, Sentry, Slack, etc. until later.

**API** (`svcar-api/apps/api/.env`):

| Variable | Why |
|----------|-----|
| `DATABASE_URL` | Cart, orders, users |
| `JWT_ACCESS_SECRET` + `JWT_REFRESH_SECRET` | Customer login session |
| `JWT_ADMIN_SECRET` | Admin login session |
| `RESEND_API_KEY` + `RESEND_FROM_EMAIL` | Email OTP login (required in production — no email = no customer login) + order confirmation emails |
| `PAYU_MERCHANT_KEY`, `PAYU_MERCHANT_SALT`, `PAYU_MODE=live` | PayU hosted checkout + webhook (this project uses **PayU only**; Razorpay is disabled) |
| `CORS_ORIGINS=https://yourdomain.com` | Browser → API |
| `STOREFRONT_URL=https://yourdomain.com` | Order tracking links |
| `NODE_ENV=production` | Disables dev OTP/payment shortcuts |

Optional (order-update SMS): `MSG91_AUTH_KEY`, `MSG91_SENDER_ID`, `MSG91_ORDER_TEMPLATE_ID`. When unset, order SMS runs in stub mode (logged, not sent) — login does **not** depend on SMS.

Register PayU webhook: `POST https://<api-host>/webhooks/payu`

**Frontend** (`svcar-india/.env.local` on Vercel):

```
NEXT_PUBLIC_API_URL=https://<api-host>
NEXT_PUBLIC_USE_MOCKS=false
NEXT_PUBLIC_MOCK_PAYMENTS=false
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

**Local test flow (no Resend yet):** keep `ENABLE_DEV_AUTH_BYPASS=1` on the API, leave PayU unset (stub mode) or use PayU **test** keys with `PAYU_MODE=test`, OTP appears in the API terminal (`🔐 DEV OTP`).
