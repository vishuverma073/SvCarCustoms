import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { SettingsPublicSchema } from "@svcar/contracts";
import type { DbClient } from "../db/client.js";
import { settings } from "../db/schema.js";
import type { AppEnv } from "../lib/types.js";

/** Public store settings (safe subset only). */
export function makePublicSettingsRouter(db: DbClient) {
  const router = new Hono<AppEnv>();

  router.get("/", async (c) => {
    const [row] = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
    if (!row) return c.json({ error: "Not Found" }, 404);
    c.header("Cache-Control", "public, max-age=3600");
    return c.json(
      SettingsPublicSchema.parse({
        storeName: row.storeName,
        supportPhone: row.supportPhone,
        supportEmail: row.supportEmail,
        gstRate: Number(row.gstRate),
        shippingFreeAbove: Number(row.shippingFreeAbove),
        shippingFlatFee: Number(row.shippingFlatFee),
        whatsappNumber: row.whatsappNumber,
      }),
    );
  });

  return router;
}
