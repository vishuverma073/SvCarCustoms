# Phase 0 (Frontend) — Foundations + MSW

## What you'll build

Three things, all small:
1. Rename the repo `svcar-catelog` → `svcar-web` (cosmetic, but lines things up with the BE repo naming)
2. Install `@svcar/contracts` (the shared schema package the BE intern will publish)
3. Set up **MSW (Mock Service Worker)** so you can develop the entire admin (Phase 1) and storefront (Phase 2) against fake API responses while the BE is still being built

The existing storefront continues working unchanged. No user-visible changes in this phase.

## Prerequisites

- [ ] BE intern has published `@svcar/contracts@0.1.0` to GitHub Packages (sync with them; this is the M0 milestone)
- [ ] You have a GitHub PAT with `read:packages` scope and `GITHUB_TOKEN` env var set
- [ ] You can run `pnpm dev` on the current repo and see the storefront at http://localhost:3000

## Success criteria

- Repo (on GitHub and local disk) is renamed `svcar-web`; Vercel project linkage updated
- `package.json` name is `svcar-web`
- `@svcar/contracts@0.1.0` installed
- MSW is set up with handlers and fake data; `pnpm dev` with `NEXT_PUBLIC_USE_MOCKS=true` works
- Flipping `NEXT_PUBLIC_USE_MOCKS=false` against the staging BE returns real data
- All existing storefront pages still render correctly (no regressions)
- Existing tests pass

## Estimated effort

<1 session (~2 hours).

## Coordinate with BE

The handoff is "BE publishes contracts → FE installs it". After that, FE works independently for the rest of Phase 0.

---

## Task 0.1 — Rename the GitHub repo (intern action — manual)

**What to do**:

1. https://github.com/ketan18710/svcar-catelog (or wherever the repo is) → Settings → "Repository name" → change to `svcar-web` → Save
2. GitHub automatically sets up a redirect from the old URL

**Verification**:
- Open https://github.com/ketan18710/svcar-web → loads
- Old URL redirects

**Acceptance criteria**:
- [ ] Repo renamed on GitHub
- [ ] Old URL redirects

---

## Task 0.2 — Rename local directory (intern action — manual)

**What to do**:

1. Close all editors and terminals with the old directory open
2. ```bash
   cd /Users/ketanverma/Desktop/Personal
   mv svcar-catelog svcar-web
   ```
3. Re-open the new path in your editor

**Acceptance criteria**:
- [ ] `/Users/ketanverma/Desktop/Personal/svcar-web/` exists
- [ ] Old path gone
- [ ] Editor opens cleanly at new path

---

## Task 0.3 — Update git remote + package.json name

**Suggested Claude Code prompt**:
> I just renamed the repo from `svcar-catelog` to `svcar-web` (GitHub + local). Update the git remote `origin` to point at `https://github.com/ketan18710/svcar-web.git`. Verify with `git remote -v` and `git fetch`. Then update `package.json` `name` field from "svcar-catelog" to "svcar-web". Run `pnpm install` to regenerate the lockfile. Run `pnpm typecheck` to confirm nothing broke.

**Verification commands**:
```bash
git remote -v
# Expect: origin  https://github.com/ketan18710/svcar-web.git

cat package.json | grep '"name"'
# Expect: "name": "svcar-web",

pnpm typecheck
# Expect: exits 0
```

**Acceptance criteria**:
- [ ] Remote updated
- [ ] Package name updated
- [ ] Typecheck passes
- [ ] Commit: `chore(phase-0): rename to svcar-web`

---

## Task 0.4 — Update Vercel project name (intern action — manual)

**What to do**:

1. https://vercel.com/dashboard → find project named `svcar-catelog`
2. Settings → General → "Project Name" → change to `svcar-web` → Save
3. Production URL or custom domain keeps working; preview URLs now use `svcar-web-...` prefix

**Acceptance criteria**:
- [ ] Vercel project renamed
- [ ] Latest production deploy still resolves
- [ ] No build errors

---

## Task 0.5 — Install `@svcar/contracts`

**Prerequisite**: BE intern published `@svcar/contracts@0.1.0`. Confirm with them.

**Files to touch**:
- `.npmrc` (create — gitignored)
- `package.json`

**Suggested Claude Code prompt**:
> Add GitHub Packages auth:
>
> 1. Create `.npmrc` at the repo root:
>    ```
>    @svcar:registry=https://npm.pkg.github.com/
>    //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
>    ```
> 2. Verify `.npmrc` is in `.gitignore` (add it if not).
> 3. Install: `pnpm add @svcar/contracts@^0.1.0`. Should succeed if my `GITHUB_TOKEN` env var is set with `read:packages` scope.
> 4. Verify the package is in `node_modules`: `ls node_modules/@svcar/contracts/dist/` — should show index.js, index.d.ts, etc.
> 5. As a smoke test, create a temp file `/tmp/sanity.ts` with `import { CategorySchema } from "@svcar/contracts"; console.log(CategorySchema);` and run `pnpm tsx /tmp/sanity.ts` — should print the schema object. Delete the temp file after.

**Verification commands**:
```bash
cat .gitignore | grep .npmrc
# Expect: .npmrc

pnpm list @svcar/contracts
# Expect: 0.1.0
```

**Acceptance criteria**:
- [ ] `.npmrc` exists and is gitignored
- [ ] `@svcar/contracts@^0.1.0` installed
- [ ] Sanity import works
- [ ] Commit: `chore(phase-0): install @svcar/contracts`

**Pitfalls**:
- 401 on install → `GITHUB_TOKEN` not set or wrong scope (needs `read:packages`)
- 404 on install → BE intern hasn't actually published yet; confirm with them

---

## Task 0.6 — Install + scaffold MSW

**Context**: MSW (Mock Service Worker) intercepts `fetch` calls during development to return canned responses. This lets you build the entire admin (Phase 1) and storefront (Phase 2) without the BE existing.

**Files to touch**:
- `package.json` — add `msw` + `@faker-js/faker`
- `src/mocks/handlers/index.ts` (new — central handler list, empty for now)
- `src/mocks/handlers/categories.ts` (new — sample handlers for /categories)
- `src/mocks/data/categories.ts` (new — realistic fake data)
- `src/mocks/browser.ts` (new — browser worker setup)
- `src/mocks/node.ts` (new — Node setup for Server Components / tests)
- `public/mockServiceWorker.js` (generated by MSW init)
- `src/lib/backend.ts` (new — typed fetcher with mock/real switch)
- `src/components/MswProvider.tsx` (new — starts MSW worker on client mount)
- `.env.local.example` (new) — `NEXT_PUBLIC_API_URL` + `NEXT_PUBLIC_USE_MOCKS`

**Suggested Claude Code prompt**:
> Set up MSW for the frontend.
>
> 1. Install: `pnpm add -D msw @faker-js/faker`. Generate the service worker: `npx msw init public/ --save`.
>
> 2. `src/mocks/data/categories.ts` — export an array of 8 categories matching the seed data (4 roots: kitchen-sinks, health-faucet-sets, bathroom-accessories, plumbing-fittings + 4 subcategories under Kitchen Sinks and Health Faucet Sets). Match `CategorySchema` shape from `@svcar/contracts`.
>
> 3. `src/mocks/handlers/categories.ts` — MSW handlers:
>    - `http.get('${API_URL}/categories', () => HttpResponse.json(rootCategories))`
>    - Later phases add more
>
> 4. `src/mocks/handlers/index.ts` — combine handler arrays from each file:
>    ```ts
>    import { categoriesHandlers } from "./categories";
>    export const handlers = [...categoriesHandlers];
>    ```
>
> 5. `src/mocks/browser.ts`:
>    ```ts
>    import { setupWorker } from "msw/browser";
>    import { handlers } from "./handlers";
>    export const worker = setupWorker(...handlers);
>    ```
>
> 6. `src/mocks/node.ts`:
>    ```ts
>    import { setupServer } from "msw/node";
>    import { handlers } from "./handlers";
>    export const server = setupServer(...handlers);
>    ```
>
> 7. `src/components/MswProvider.tsx` (client component):
>    - On mount, if `process.env.NEXT_PUBLIC_USE_MOCKS === "true"`, dynamically import `mocks/browser` and start the worker
>    - Otherwise no-op
>    - Render children
>
> 8. `src/lib/backend.ts`:
>    - Read `NEXT_PUBLIC_API_URL` from env (default `http://localhost:8787`)
>    - Export `backend` object with `getCategories()` that fetches `${API_URL}/categories`, validates with `CategoryListSchema.parse()`, returns array
>    - Throw descriptive error on non-OK responses
>
> 9. `.env.local.example`:
>    ```
>    NEXT_PUBLIC_API_URL=http://localhost:8787
>    NEXT_PUBLIC_USE_MOCKS=true
>    ```
>
> 10. In `src/app/(store)/layout.tsx`, wrap children with `<MswProvider>`.
>
> Don't wire `backend.getCategories()` into any actual page yet — that's Phase 2. This is plumbing only.

**Verification commands**:
```bash
pnpm typecheck

# Manually:
cp .env.local.example .env.local
# Edit: NEXT_PUBLIC_USE_MOCKS=true

pnpm dev
# In browser DevTools console:
fetch("/api/categories").then(r=>r.json()).then(console.log)
# Wait — this won't intercept because MSW operates on full URLs.
# Try:
fetch("http://localhost:8787/categories").then(r=>r.json()).then(console.log)
# Expect: mocked categories array

# Console should also show "[MSW] Mocking enabled" or similar
```

**Acceptance criteria**:
- [ ] MSW installed and `public/mockServiceWorker.js` exists
- [ ] Handlers + data files created
- [ ] `<MswProvider>` mounted in store layout
- [ ] `backend.getCategories()` works against mocks
- [ ] Storefront still renders normally (no behavior change)
- [ ] Commit: `chore(phase-0): scaffold MSW with categories mock`

**Pitfalls**:
- MSW only works in browser (for client-side fetches) by default. For Server Component fetches, you need the Node setup (`src/mocks/node.ts`) wired into `next.config.ts` or similar. We'll handle that in Phase 1 when Server Components actually start using the backend. For Phase 0, browser-only is fine.
- The `public/mockServiceWorker.js` is auto-generated. Don't edit it manually; re-run `npx msw init public/` if it gets stale.

---

## Task 0.7 — `next.config.ts` image domains

**Context**: Once Phase 1 admin starts uploading to Supabase Storage, `<Image>` from `next/image` needs to allow that domain. Add it now so it's not forgotten.

**Suggested Claude Code prompt**:
> Update `next.config.ts` to add `images.remotePatterns`:
> ```ts
> images: {
>   formats: ["image/avif", "image/webp"],
>   qualities: [75, 90],
>   remotePatterns: [
>     { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
>     { protocol: "https", hostname: "placeholder.com", pathname: "/**" },  // for MSW mock URLs
>   ],
> },
> ```
>
> Run `pnpm dev` and confirm storefront still renders.

**Acceptance criteria**:
- [ ] `next.config.ts` updated
- [ ] Storefront renders without errors
- [ ] Commit: `chore(phase-0): allow Supabase Storage in next/image`

---

## Task 0.8 — Smoke test

**Suggested Claude Code prompt**:
> Run the full smoke test:
> 1. `pnpm dev`
> 2. Open http://localhost:3000 — home page renders
> 3. Click into a category, a product, the cart — all work
> 4. Check DevTools console: no red errors, MSW message visible if `NEXT_PUBLIC_USE_MOCKS=true`
> 5. `pnpm test` — existing tests still pass
> 6. `pnpm typecheck` — green
> 7. `pnpm build` — successful production build (validates MSW doesn't break SSR)

**Acceptance criteria**:
- [ ] Dev server starts cleanly
- [ ] All existing pages work (no visual regression)
- [ ] Tests pass
- [ ] Production build succeeds
- [ ] Phase 0 status updated in `docs/phases/README.md`
- [ ] Commit any pending fixes; merge to `main`

---

## Common pitfalls across this phase

- **Don't commit `.npmrc` or `.env.local`.** Both have secrets. Verify with `git status`.
- **Vercel rebuild after renaming**: Vercel may take 2-3 minutes to recognize the new repo name. If a deploy fails, retry.
- **MSW + Server Components**: Phase 0 doesn't wire MSW for SSR. Phase 1 admin pages are all client components, so they'll work fine. Phase 2 (storefront) is when SSR + MSW will matter — that's the Node setup.

## What's next

→ Phase 1: [Admin UI](./phase-1-admin.md) — the merchant-facing CMS. Mobile-first, with the home page composer.

Before Phase 1, both interns sync at [M0 — Integration milestone](../integration-milestones.md#m0--after-phase-0-foundations).
