# 01 — Stack

## Locked decisions

| Concern | Choice | Why |
|---|---|---|
| **Frontend framework** | Next.js 16 (App Router) | Already in place. Best SSR/ISR/edge support. Best Vercel integration. |
| **Frontend host** | Vercel | Best-fit for Next.js. Free hobby tier covers MVP. Mumbai+Singapore edge PoPs. |
| **Backend language + framework** | Node.js + Hono (written in TypeScript) | Hono is a Node.js framework — same runtime ecosystem as the existing frontend. Tiny (~12KB), well-typed, portable across Node/Bun/Workers/Deno. Same language as FE → shared zod schemas. |
| **Database** | Postgres | Gold standard for OLTP. Drizzle ORM works against any Postgres. |
| **ORM** | Drizzle | Already in the existing project. Light, fully TypeScript-native, easier for AI than Prisma's heavier generator. |
| **Type sharing** | `@svcar/contracts` package | Lives inside `svcar-api` repo, published to GitHub Packages under `ketan18710`. Versions zod schemas + inferred TS types. |
| **Repo layout** | Two repos: `svcar-web` + `svcar-api` | User preference. Types shared via the contracts package. |
| **Payments** | Razorpay | Best-fit for India (UPI + cards + netbanking + wallets). |
| **SMS provider** | MSG91 (deferred to Phase 2) | India-native, better deliverability than Twilio, ~₹0.15 per SMS. |
| **Email** | Resend + react-email | Cheap, good deliverability, React templates. |
| **Background jobs** | Inngest | Generous free tier, built-in retries, great DX for order confirmations / abandoned cart. |
| **Errors** | Sentry | Free tier sufficient for MVP. |
| **Tests** | Vitest | Already in place. |
| **Lint/format** | ESLint + Prettier | Already in place. |
| **CI** | GitHub Actions | Free for public, generous for private. |

## Deferred decisions (will pick by end of Phase 1)

| Concern | Candidates | Decision criteria |
|---|---|---|
| **Backend host** | Cloudflare Workers / Fly.io Mumbai / Render Singapore / Vercel functions | Cost at projected traffic + latency from Indian users. See [02-hosting-and-costs.md](./02-hosting-and-costs.md). |
| **Database host (prod)** | Supabase Pro Mumbai / Neon Singapore | Latency vs. feature bundle. Strong lean: Supabase Mumbai. |
| **Auth provider** | Supabase Auth (managed) / MSG91 + custom JWT | Cost vs. control. Decided in Phase 2. |
| **CDN for images** | Cloudflare Images / Vercel image optimization | Volume + transform needs at launch. |
| **Search backend** | Postgres FTS → Meilisearch | When catalog grows past ~500 SKUs. |

## Why these specific choices for an AI-built codebase

### Why Hono over Express/Fastify/NestJS

- **Hono** is the most modern, smallest, most-typed of the three. It runs on every JS runtime via a unified adapter pattern.
- **Express** has more training data but predates async/await and has weaker types. Middleware ordering issues are common LLM mistakes.
- **Fastify** is great but has more conventions to remember.
- **NestJS** is too magical (decorators, DI) — adds cognitive overhead with little gain for a small team.

### Why Drizzle over Prisma

- Drizzle is **TypeScript-first**, no codegen step, no separate schema file.
- Migrations are SQL — easier for me to read and reason about.
- Prisma's generated client is large; its query API has more "magic" that I sometimes mis-remember.
- Already in the existing project — zero learning curve cost.

### Why Postgres (not MongoDB)

- E-commerce is intrinsically relational: order → line items → SKUs → products → categories.
- Postgres + JSON columns gives us schemaless escape hatches (SKU `attributes`, product metadata).
- Universally supported, every host has it.

### Why Node.js + Hono, not Go or Rust

- Go saves ~$2-5/mo on compute at MVP scale. Not enough to justify slower AI iteration.
- Rust saves slightly more compute but I write Rust meaningfully slower than Node.js.
- Both also lose the shared-types-with-FE win (TypeScript on both sides).

### A note on naming

Throughout these docs, "Node.js + Hono" and "TypeScript + Hono" mean the same thing. Hono is a Node.js framework written in TypeScript. The frontend (Next.js) is also Node.js + TypeScript. So this is a **single-language stack** end to end, not two separate ecosystems.

### Why two repos (despite the AI tradeoff)

- User preference is firm here.
- We mitigate the cost via the `@svcar/contracts` package — schemas + types live in one place and both repos depend on it.
- Trade-off accepted: each cross-cutting feature takes me ~10–20% longer than a monorepo would.
