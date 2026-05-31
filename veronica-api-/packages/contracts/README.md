# @veronica/contracts

Shared **zod schemas** and inferred **TypeScript types** that define the contract between the Veronica API (`@veronica/api`) and the web client (`veronica-web`).

This is the single source of truth for request/response shapes. The API validates its responses against these schemas before sending; the frontend installs this package and uses the same schemas to type its API calls (and to drive MSW mocks).

## Usage

```ts
import { CategorySchema, type Category } from "@veronica/contracts";

const category = CategorySchema.parse(apiResponse);
```

## Publishing

Published to GitHub Packages under the `@veronica` scope. Every schema change is a **version bump** that the frontend must install — announce it in `#veronica-dev` before publishing.

```bash
pnpm --filter @veronica/contracts build
pnpm --filter @veronica/contracts publish --access restricted --no-git-checks
```
