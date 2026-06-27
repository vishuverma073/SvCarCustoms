# Frontend Phase Docs

Execution playbooks for the `svcar-web` repo (the Next.js storefront + admin). Each phase is a self-contained set of tasks an intern can complete with Claude Code.

## How development works across the two repos

The frontend and backend develop **in parallel, independently**. You don't wait for the backend intern. Instead, you use **MSW (Mock Service Worker)** to fake all API responses against the schemas exported by `@svcar/contracts`. Your UI develops as if the backend exists.

At the end of each phase, both repos converge at an **integration milestone**: you flip an env var to point at the staging backend instead of mocks, run the integration checklist together with the BE intern (~30-60 min sync), and confirm end-to-end flows work. Only then do both tracks move to the next phase.

Integration milestones are defined in [../integration-milestones.md](../integration-milestones.md).

## How to use these docs

1. **Open the phase doc** you're working on (start with Phase 0).
2. **Read "Prerequisites"** at the top. The contracts package version is the main hard dependency — if BE hasn't published the version you need, sync up with the BE intern.
3. **Work through tasks in order.** Each has context, files to touch, suggested Claude Code prompt, verification commands, acceptance checklist.
4. **Verify in the browser.** UI work has to look right. Run `pnpm dev` and click through. Type checks and tests aren't enough.
5. **At end of phase**: check the integration milestone passes before moving on.
6. **If stuck for >30 min, escalate to Ketan.**

## How to work with Claude Code

- Open the phase doc next to Claude Code.
- Copy each task's "Suggested Claude Code prompt" verbatim.
- After Claude finishes, **manually verify in the browser** at `http://localhost:3000`. UI regressions are common — type checks pass but the page is broken.
- For admin work (Phase 1), test on mobile too — open DevTools → device toolbar → iPhone 14 width.
- If Claude proposes deploying, dropping the cart store, removing analytics, **stop and ask Ketan**.
- "Intern action — manual" means you do it without Claude (e.g. renaming a GitHub repo, updating Vercel settings).
- **Commit after each task**, format: `feat(phase-N): task description`.

## Phases

| Phase | Doc | Status | Estimated effort |
|---|---|---|---|
| 0 | [Foundations + MSW](./phase-0-foundations.md) | not started | <1 session (~2 hrs) |
| **1** | [Admin UI](./phase-1-admin.md) | not started — **biggest FE phase, plan for 4 sessions** | 4 sessions (~12 hrs) |
| 2 | [Storefront swap](./phase-2-read-paths.md) | not started | 1-2 sessions |
| 3 | [Customer login + cart + Sentry](./phase-3-auth-and-cart.md) | not started | 2 sessions |
| 4 | [Razorpay checkout UI](./phase-4-razorpay.md) | not started | 2 sessions |
| 5 | [ISR tags + remaining obs](./phase-5-caching-and-obs.md) | not started | 1 session |
| 6 | [SEO + polish](./phase-6-search-and-polish.md) | not started | 2 sessions |

## Coordinating with the BE intern

Every phase has a **"Coordinate with BE"** callout. Sync at the start (to confirm what's coming) and end (to verify integration).

The biggest coordination boundary: the contracts package. Every BE schema change is a version bump you need to install. When BE says "I'm publishing 0.X.0", you should:
1. `pnpm add @svcar/contracts@latest`
2. Run typecheck — fix any new errors (usually adding optional fields)
3. Update MSW mocks if the schema changed shape

## When you finish a phase

- [ ] All acceptance criteria boxes checked
- [ ] You've clicked through every affected page on mobile + desktop widths
- [ ] Lighthouse score on key pages ≥ 90 perf, ≥ 95 a11y
- [ ] CI green
- [ ] Integration milestone passes (see [integration-milestones.md](../integration-milestones.md))
- [ ] You've demoed the change to Ketan
- [ ] Update the phase status table above
- [ ] Move to next phase

## Reference docs in this repo

- [../planning/](../planning/) — cross-cutting planning (vision, hosting, costs, open questions)
- [../admin-design.md](../admin-design.md) — admin UX principles (used heavily in Phase 1)
- [../integration-milestones.md](../integration-milestones.md) — gate criteria between phases
