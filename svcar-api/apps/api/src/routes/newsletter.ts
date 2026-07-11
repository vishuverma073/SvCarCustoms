import { Hono } from "hono";
import { z } from "zod";
import type { DbClient } from "../db/client.js";
import { subscribers } from "../db/schema.js";
import type { AppEnv } from "../lib/types.js";

const SubscribeSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  phone: z.string().optional(),
  source: z.string().optional(),
});

/** Public newsletter signup (storefront footer). */
export function makeNewsletterRouter(db: DbClient) {
  const router = new Hono<AppEnv>();

  // POST /newsletter/subscribe — idempotent upsert on email.
  router.post("/subscribe", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const parsed = SubscribeSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "A valid email is required" }, 400);
    }
    const { email, name, phone, source } = parsed.data;
    await db
      .insert(subscribers)
      .values({
        email: email.trim().toLowerCase(),
        name: name?.trim() || null,
        phone: phone?.trim() || null,
        source: source || "footer",
        status: "active",
      })
      .onConflictDoUpdate({
        target: subscribers.email,
        // Re-subscribing flips an unsubscribed row back to active.
        set: { status: "active" },
      });
    return c.json({ subscribed: true });
  });

  return router;
}
