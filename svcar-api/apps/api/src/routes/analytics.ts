import { Hono } from "hono";
import { z } from "zod";
import type { DbClient } from "../db/client.js";
import { analyticsEvents } from "../db/schema.js";
import { parseDevice, channelFrom } from "../lib/analytics.js";
import type { AppEnv } from "../lib/types.js";

const TrackSchema = z.object({
  visitorId: z.string().min(1).max(64),
  sessionId: z.string().min(1).max(64),
  path: z.string().min(1).max(512),
  referrer: z.string().max(512).optional().nullable(),
  utmSource: z.string().max(120).optional().nullable(),
  userAgent: z.string().max(512).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  country: z.string().max(120).optional().nullable(),
});

/** Public storefront page-view ingestion for Store Analytics. */
export function makeAnalyticsRouter(db: DbClient) {
  const router = new Hono<AppEnv>();

  // POST /analytics/track — record one page view (fire-and-forget beacon).
  router.post("/track", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const parsed = TrackSchema.safeParse(body);
    if (!parsed.success) return c.json({ ok: false }, 400);
    const d = parsed.data;
    const ua = d.userAgent ?? c.req.header("user-agent") ?? "";
    const { deviceType, os, browser } = parseDevice(ua);
    try {
      await db.insert(analyticsEvents).values({
        visitorId: d.visitorId,
        sessionId: d.sessionId,
        path: d.path.slice(0, 512),
        referrer: d.referrer || null,
        channel: channelFrom(d.referrer, d.utmSource),
        deviceType,
        os,
        browser,
        city: d.city || null,
        country: d.country || null,
      });
    } catch {
      // Analytics must never break the storefront — swallow write errors.
    }
    return c.body(null, 204);
  });

  return router;
}
