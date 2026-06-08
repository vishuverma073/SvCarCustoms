import { Hono } from "hono";
import type { DbClient } from "../../db/client.js";
import { makeRequireAdmin } from "../../middleware/auth.js";
import { logAudit } from "../../lib/audit.js";
import { UploadError, uploadImage } from "../../lib/storage.js";
import type { AppEnv } from "../../lib/types.js";

export function makeAdminUploadsRouter(db: DbClient) {
  const router = new Hono<AppEnv>();
  router.use("*", makeRequireAdmin(db));

  // POST /admin/uploads — multipart/form-data with a `file` field.
  router.post("/", async (c) => {
    const body = await c.req.parseBody();
    const file = body.file;
    if (!file || typeof file === "string" || typeof (file as File).arrayBuffer !== "function") {
      return c.json({ error: "Missing 'file' field (multipart/form-data)" }, 400);
    }
    const f = file as File;

    try {
      const result = await uploadImage({
        name: f.name,
        type: f.type,
        data: await f.arrayBuffer(),
      });
      await logAudit(db, {
        actorUserId: c.get("adminUserId") ?? null,
        action: "upload.create",
        resourceType: "upload",
        resourceId: result.key,
        changes: { after: result },
      });
      return c.json(result, 201);
    } catch (err) {
      if (err instanceof UploadError) {
        return c.json({ error: err.message }, err.status as 400 | 500 | 503);
      }
      throw err;
    }
  });

  return router;
}
