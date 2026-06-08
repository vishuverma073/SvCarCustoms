import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/**
 * Node request interceptor — used for Server Component / SSR fetches and tests.
 * SERVER-ONLY: never import this from a client or edge bundle. It is lazy-imported
 * by src/instrumentation.ts behind a `NEXT_RUNTIME === "nodejs"` guard.
 */
export const server = setupServer(...handlers);
