# Svcar India — Production Planning Docs

These documents are the source of truth for the production e-commerce transition. They were drafted on 2026-05-28 during the kick-off planning session between Ketan (PM/owner) and Claude (primary developer).

## How to use these docs

- Read [00-overview.md](./00-overview.md) first for context.
- Each `0X-*.md` file is a self-contained reference for one concern.
- Decisions can change — when they do, **update the doc in the same PR as the code change**. Stale docs are worse than no docs.
- Anything still TBD lives in [07-open-questions.md](./07-open-questions.md). When a question is resolved, move the answer into the relevant doc.

## Index

These are **reference docs** — read once, refer back occasionally. For **execution playbooks** an intern can work through with Claude Code, see [../phases/README.md](../phases/README.md) (frontend tasks) and `svcar-api/docs/phases/` (backend tasks).

| File | Topic |
|---|---|
| [00-overview.md](./00-overview.md) | What we're building, why, success criteria |
| [01-stack.md](./01-stack.md) | Locked tech stack + rationale |
| [02-hosting-and-costs.md](./02-hosting-and-costs.md) | Hosting options for FE + BE, costs at MVP and growth scale |
| [03-data-model.md](./03-data-model.md) | (Moved) Postgres schema design — see `svcar-api/docs/01-data-model.md` |
| [04-phases.md](./04-phases.md) | Phase 0 through Phase 6 — **high-level overview only**; detailed task lists live in `docs/phases/` (FE) and `svcar-api/docs/phases/` (BE) |
| [05-caching.md](./05-caching.md) | Multi-layer caching strategy |
| [06-observability.md](./06-observability.md) | Errors, logs, metrics, alerts |
| [07-open-questions.md](./07-open-questions.md) | Decisions deferred or pending |
