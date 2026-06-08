# veronica-api

This is the planning home for the Veronica India backend API. **No code lives here yet** — only the plans an intern (with Claude Code) will follow to build it.

## What this will become

A production Node.js + Hono backend serving:
- The Veronica India storefront (`veronica-web`)
- The Veronica India admin panel (same Next.js app, `/admin` routes)
- Razorpay checkout, phone OTP auth, Supabase Postgres in Mumbai, Upstash Redis

Stack and rationale: see `docs/` and the cross-cutting planning in `veronica-web/docs/planning/`.

## Start here

If you're the intern (or Claude Code) about to build this repo:

1. Read [`docs/phases/README.md`](./docs/phases/README.md) for the phase overview and how the BE+FE develop in parallel.
2. Begin with [`docs/phases/phase-0-foundations.md`](./docs/phases/phase-0-foundations.md). It walks you through creating every file in this repo from scratch.
3. Refer to [`docs/admin-design.md`](./docs/admin-design.md) and [`docs/integration-milestones.md`](./docs/integration-milestones.md) throughout.

## What's currently in this repo

```
veronica-api/
├── README.md                  ← you are here
├── .gitignore                 (template for what will be ignored once code exists)
└── docs/                      ← the plans
    ├── README.md              ← index of backend reference docs
    ├── admin-design.md        ← UX + schema spec for the admin
    ├── integration-milestones.md  ← M0-M6 gate criteria
    └── phases/
        ├── README.md
        ├── phase-0-foundations.md   ← start here
        ├── phase-1-admin.md
        ├── phase-2-read-paths.md
        ├── phase-3-auth-and-cart.md
        ├── phase-4-razorpay.md
        ├── phase-5-caching-and-obs.md
        └── phase-6-search-and-polish.md
```

## License

Private — © Veronica India.
