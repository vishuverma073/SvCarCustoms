# Integration Milestones (Frontend's view)

Gate criteria between phases. Same content as `veronica-api/docs/integration-milestones.md` — keeping a copy here so the FE intern doesn't have to flip repos.

## How a milestone works (frontend's responsibilities)

1. **Wait for BE signal**: contracts version bumped, BE staging deployed.
2. **Update mocks**: `pnpm add @veronica/contracts@latest`, fix any new TS errors, update MSW handlers to match new schema shape.
3. **Flip env**: in `.env.local`, set `NEXT_PUBLIC_USE_MOCKS=false` and `NEXT_PUBLIC_API_URL=<staging URL>`.
4. **Click through every page that touched this phase's data**. Real browser, mobile + desktop widths.
5. **Run the integration checklist below with the BE intern**.
6. **File specific issues** for anything that fails (BE bug, FE bug, contracts mismatch).
7. **Tag git after pass**: `git tag milestone-N && git push --tags`.

## Where to put the env var

`.env.local` (gitignored):

```
NEXT_PUBLIC_API_URL=https://veronica-api-staging.workers.dev
NEXT_PUBLIC_USE_MOCKS=false
```

In code, `src/lib/backend.ts` reads `process.env.NEXT_PUBLIC_USE_MOCKS` and:
- If `"true"` → MSW intercepts all `/api/*` requests with mocked responses
- If `"false"` → real fetch to the API URL

Default: mocks ON in dev, mocks OFF in production builds. Each phase's integration milestone is where you stress-test the real connection.

---

(The detailed checklist for M0 through M6 is in the BE repo at the same path. Read it there or copy here if it gets out of sync — but treat the BE copy as source of truth.)

## FE-specific things to verify at every milestone

Beyond the cross-repo checklist:

- [ ] Mobile view works (DevTools → iPhone 14 width) for any new page
- [ ] No hydration warnings in console
- [ ] No "fetch failed" red errors in console
- [ ] Lighthouse perf doesn't drop below 90 on any key page
- [ ] Tab refresh doesn't unexpectedly log user out (auth state restoration works)
- [ ] Slow network simulation (DevTools → throttle to "Slow 3G") doesn't break the page (just makes it slower) — loading states must show, not just blank screen
