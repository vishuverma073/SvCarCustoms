import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { HomeConfigSchema } from "@veronica/contracts";
import type { DbClient } from "../../db/client.js";
import { homeConfig } from "../../db/schema.js";
import { makeRequireAdmin } from "../../middleware/auth.js";
import { logAudit } from "../../lib/audit.js";
import type { AppEnv } from "../../lib/types.js";

export function makeAdminHomeRouter(db: DbClient) {
  const router = new Hono<AppEnv>();
  router.use("*", makeRequireAdmin(db));

  // GET /admin/home — raw config (includes disabled sections) for editing.
  router.get("/", async (c) => {
    const [row] = await db.select().from(homeConfig).where(eq(homeConfig.id, 1)).limit(1);
    return c.json(HomeConfigSchema.parse({ sections: row?.sections ?? [] }));
  });

  // PUT /admin/home — atomic replace of the whole config.
  router.put("/", async (c) => {
    const parsed = HomeConfigSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json({ error: "Invalid request", issues: parsed.error.flatten() }, 400);
    }
    const adminUserId = c.get("adminUserId") ?? null;
    const [before] = await db.select().from(homeConfig).where(eq(homeConfig.id, 1)).limit(1);

    await db
      .update(homeConfig)
      .set({ sections: parsed.data.sections, updatedAt: new Date(), updatedBy: adminUserId })
      .where(eq(homeConfig.id, 1));

    await logAudit(db, {
      actorUserId: adminUserId,
      action: "home_config.update",
      resourceType: "home_config",
      resourceId: "1",
      changes: { before: before?.sections, after: parsed.data.sections },
    });
    return c.json(HomeConfigSchema.parse(parsed.data));
  });

  return router;
}
