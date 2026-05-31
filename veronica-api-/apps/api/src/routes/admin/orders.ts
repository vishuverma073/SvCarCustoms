import { Hono } from "hono";
import type { DbClient } from "../../db/client.js";
import { makeRequireAdmin } from "../../middleware/auth.js";
import type { AppEnv } from "../../lib/types.js";

/**
 * Admin order management.
 *
 * Phase 4 (Razorpay checkout) fills this in. For now it returns an empty page
 * so the FE can scaffold the Orders screen against a stable shape.
 */
export function makeAdminOrdersRouter(db: DbClient) {
  const router = new Hono<AppEnv>();
  router.use("*", makeRequireAdmin(db));

  router.get("/", (c) => c.json({ items: [], nextCursor: null }));

  return router;
}
