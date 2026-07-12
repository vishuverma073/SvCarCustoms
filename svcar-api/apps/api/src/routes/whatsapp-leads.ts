import { Hono } from "hono";
import { z } from "zod";
import type { DbClient } from "../db/client.js";
import { whatsappLeads } from "../db/schema.js";
import type { AppEnv } from "../lib/types.js";

const TrackSchema = z.object({
  visitorId: z.string().max(64).optional().nullable(),
  path: z.string().max(512).optional().nullable(),
  source: z.enum(["floating", "product", "cart", "contact", "other"]).optional(),
  productId: z.number().int().optional().nullable(),
  productName: z.string().max(256).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  country: z.string().max(120).optional().nullable(),
});

/** Public WhatsApp-intent ingestion — records clicks on storefront WhatsApp CTAs. */
export function makeWhatsappLeadsRouter(db: DbClient) {
  const router = new Hono<AppEnv>();

  // POST /leads/whatsapp — record one WhatsApp CTA click (fire-and-forget).
  router.post("/whatsapp", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const parsed = TrackSchema.safeParse(body);
    if (!parsed.success) return c.json({ ok: false }, 400);
    const d = parsed.data;
    try {
      await db.insert(whatsappLeads).values({
        visitorId: d.visitorId || null,
        path: (d.path || "/").slice(0, 512),
        source: d.source ?? "other",
        productId: d.productId ?? null,
        productName: d.productName ? d.productName.slice(0, 256) : null,
        city: d.city || null,
        country: d.country || null,
      });
    } catch {
      // Lead capture must never break the storefront — swallow write errors.
    }
    return c.body(null, 204);
  });

  return router;
}
