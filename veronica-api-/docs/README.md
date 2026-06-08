# veronica-api docs

Backend-specific documentation. Cross-cutting project planning (vision, hosting/cost comparison, open questions) lives in `veronica-web/docs/planning/`.

## Where to start

If you're new to this repo, read in this order:

1. [phases/README.md](./phases/README.md) — phase overview + how BE+FE develop in parallel
2. [phases/phase-0-foundations.md](./phases/phase-0-foundations.md) — create the repo from scratch
3. [admin-design.md](./admin-design.md) — design + schema spec for the admin (referenced heavily by Phase 1)
4. [integration-milestones.md](./integration-milestones.md) — gate criteria between phases

## Index

| File | Topic |
|---|---|
| [admin-design.md](./admin-design.md) | Admin UX, visual language, schema additions for home_config + settings |
| [integration-milestones.md](./integration-milestones.md) | M0-M6 checklists for when BE+FE converge after each phase |
| [phases/](./phases/) | Per-phase execution playbooks (the doc set an intern actually works through) |

## Reference docs to be added (not yet written)

These would be useful once the codebase exists. They aren't blockers — phase docs cover the same content inline. Add as needed:

- `api-design.md` — the canonical REST endpoint spec (replicates info from phase docs once we want a single index)
- `local-dev.md` — how to run the backend locally (Phase 0 covers this in-context)
- `deployment.md` — Cloudflare Workers vs Fly.io setup (Phase 1 Task 1.7 covers it in-context)

For now, treat the **schema (`apps/api/src/db/schema.ts` once created) and the contracts package (`packages/contracts/`) as the source of truth** for data shapes. Phase docs explain everything else.
