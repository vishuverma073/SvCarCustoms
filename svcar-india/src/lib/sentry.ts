import type { ErrorEvent } from "@sentry/nextjs";

/**
 * Shared Sentry config. Sentry is OFF until NEXT_PUBLIC_SENTRY_DSN is set — every
 * init site guards on {@link SENTRY_DSN}, so with no DSN nothing initializes and
 * no events are sent. Paste a DSN into the env to switch it on (no code change).
 */
export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN ?? "";

/** Query params we must never let reach Sentry (auth/PII). */
const SENSITIVE_PARAMS = ["password", "code", "otp", "token", "access_token", "phone"];

function redactUrl(url: string): string {
  try {
    const u = new URL(url, "http://local");
    let touched = false;
    for (const key of SENSITIVE_PARAMS) {
      if (u.searchParams.has(key)) {
        u.searchParams.set(key, "[redacted]");
        touched = true;
      }
    }
    return touched ? u.toString() : url;
  } catch {
    return url;
  }
}

/** beforeSend hook: strip sensitive query params from the event + breadcrumbs. */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.request?.url) event.request.url = redactUrl(event.request.url);
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((b) =>
      typeof b.data?.url === "string"
        ? { ...b, data: { ...b.data, url: redactUrl(b.data.url) } }
        : b,
    );
  }
  return event;
}

/** Options shared by the client, server, and edge Sentry inits. */
export const SENTRY_INIT = {
  dsn: SENTRY_DSN,
  tracesSampleRate: 0.1,
  beforeSend: scrubEvent,
} as const;
