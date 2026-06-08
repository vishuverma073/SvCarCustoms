import * as Sentry from "@sentry/nextjs";
import { SENTRY_DSN, SENTRY_INIT } from "@/lib/sentry";

/**
 * Client-side Sentry init (Next.js runs this file in the browser). Guarded on
 * the DSN: with none configured, Sentry stays inert. Session replay is left OFF
 * for privacy until explicitly enabled.
 */
if (SENTRY_DSN) {
  Sentry.init({
    ...SENTRY_INIT,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}

// Lets Sentry trace client-side navigations (no-op when Sentry isn't initialized).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
