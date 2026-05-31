import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { SettingsPatchSchema, SettingsSchema, type Settings } from "@veronica/contracts";
import type { DbClient } from "../../db/client.js";
import { settings } from "../../db/schema.js";
import { makeRequireAdmin } from "../../middleware/auth.js";
import { logAudit } from "../../lib/audit.js";
import type { AppEnv } from "../../lib/types.js";

type SettingsRow = typeof settings.$inferSelect;

function mapSettings(row: SettingsRow): Settings {
  return SettingsSchema.parse({
    storeName: row.storeName,
    supportPhone: row.supportPhone,
    supportEmail: row.supportEmail,
    storeAddress: row.storeAddress,
    gstRate: Number(row.gstRate),
    shippingFreeAbove: Number(row.shippingFreeAbove),
    shippingFlatFee: Number(row.shippingFlatFee),
    whatsappNumber: row.whatsappNumber,
    updatedAt: row.updatedAt.toISOString(),
  });
}

export function makeAdminSettingsRouter(db: DbClient) {
  const router = new Hono<AppEnv>();
  router.use("*", makeRequireAdmin(db));

  // GET /admin/settings — full settings.
  router.get("/", async (c) => {
    const [row] = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
    if (!row) return c.json({ error: "Not Found" }, 404);
    return c.json(mapSettings(row));
  });

  // PATCH /admin/settings — partial update.
  router.patch("/", async (c) => {
    const parsed = SettingsPatchSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json({ error: "Invalid request", issues: parsed.error.flatten() }, 400);
    }
    const body = parsed.data;

    const [existing] = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
    if (!existing) return c.json({ error: "Not Found" }, 404);

    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (body.storeName !== undefined) update.storeName = body.storeName;
    if (body.supportPhone !== undefined) update.supportPhone = body.supportPhone;
    if (body.supportEmail !== undefined) update.supportEmail = body.supportEmail;
    if (body.storeAddress !== undefined) update.storeAddress = body.storeAddress;
    if (body.gstRate !== undefined) update.gstRate = String(body.gstRate);
    if (body.shippingFreeAbove !== undefined) update.shippingFreeAbove = String(body.shippingFreeAbove);
    if (body.shippingFlatFee !== undefined) update.shippingFlatFee = String(body.shippingFlatFee);
    if (body.whatsappNumber !== undefined) update.whatsappNumber = body.whatsappNumber;

    const [row] = await db.update(settings).set(update).where(eq(settings.id, 1)).returning();
    const after = mapSettings(row!);

    await logAudit(db, {
      actorUserId: c.get("adminUserId") ?? null,
      action: "settings.update",
      resourceType: "settings",
      resourceId: "1",
      changes: { before: mapSettings(existing), after },
    });
    return c.json(after);
  });

  return router;
}
