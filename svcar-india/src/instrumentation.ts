import * as Sentry from "@sentry/nextjs";
import { SENTRY_DSN, SENTRY_INIT } from "@/lib/sentry";

/**
 * Next.js instrumentation hook — runs once at server process startup.
 *
 * 1. Starts the MSW node interceptor so Server Component / SSR fetches to the
 *    API are mocked in dev when NEXT_PUBLIC_USE_MOCKS=true.
 * 2. Initializes Sentry on the server/edge runtimes when a DSN is configured
 *    (inert otherwise).
 */
export async function register() {
  // MSW node server — guarded to the Node runtime (msw/node can't load on edge).
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NEXT_PUBLIC_USE_MOCKS === "true"
  ) {
    const { server } = await import("./mocks/node");
    // `bypass` is mandatory: Next makes many internal fetches (.rsc, static,
    // fonts, telemetry) that we must let through untouched.
    server.listen({ onUnhandledRequest: "bypass" });
  }

  // Server + edge Sentry — only when a DSN is set.
  if (SENTRY_DSN) {
    Sentry.init(SENTRY_INIT);
  }
}

/** Captures errors thrown in Server Components / route handlers (no-op without a DSN). */
export const onRequestError = Sentry.captureRequestError;
