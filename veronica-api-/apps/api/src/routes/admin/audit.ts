import { Hono } from "hono";
import { and, desc, eq, gte, lt, lte } from "drizzle-orm";
import type { DbClient } from "../../db/client.js";
import { auditLog } from "../../db/schema.js";
import { makeRequireAdmin } from "../../middleware/auth.js";
import type { AppEnv } from "../../lib/types.js";

const LIMIT = 50;

/** Audit-log viewer. Read-only; filterable; id-desc cursor pagination. */
export function makeAdminAuditRouter(db: DbClient) {
  const router = new Hono<AppEnv>();
  router.use("*", makeRequireAdmin(db));

  router.get("/", async (c) => {
    const q = c.req.query();
    const conditions = [];
    if (q.actor_user_id) conditions.push(eq(auditLog.actorUserId, q.actor_user_id));
    if (q.resource_type) conditions.push(eq(auditLog.resourceType, q.resource_type));
    if (q.resource_id) conditions.push(eq(auditLog.resourceId, q.resource_id));
    if (q.from) conditions.push(gte(auditLog.createdAt, new Date(q.from)));
    if (q.to) conditions.push(lte(auditLog.createdAt, new Date(q.to)));
    if (q.cursor && Number.isInteger(Number(q.cursor))) {
      conditions.push(lt(auditLog.id, Number(q.cursor)));
    }

    const rows = await db
      .select()
      .from(auditLog)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(auditLog.id))
      .limit(LIMIT + 1);

    const hasMore = rows.length > LIMIT;
    const items = rows.slice(0, LIMIT).map((r) => ({
      id: Number(r.id),
      actorUserId: r.actorUserId,
      action: r.action,
      resourceType: r.resourceType,
      resourceId: r.resourceId,
      changes: r.changes ?? null,
      createdAt: r.createdAt.toISOString(),
    }));
    const last = items[items.length - 1];
    return c.json({ items, nextCursor: hasMore && last ? String(last.id) : null });
  });

  return router;
}
