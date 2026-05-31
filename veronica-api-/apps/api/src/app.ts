import { Hono } from "hono";
import { requestId } from "./middleware/request-id.js";
import { logger } from "./middleware/logger.js";
import { healthRouter } from "./routes/health.js";
import { makeCategoriesRouter } from "./routes/categories.js";
import { makeAdminAuthRouter } from "./routes/admin/auth.js";
import { makeAdminProductsRouter } from "./routes/admin/products.js";
import { makeAdminCategoriesRouter } from "./routes/admin/categories.js";
import { makePublicHomeRouter } from "./routes/home.js";
import { makeAdminHomeRouter } from "./routes/admin/home.js";
import { makePublicSettingsRouter } from "./routes/settings.js";
import { makeAdminSettingsRouter } from "./routes/admin/settings.js";
import { makeAdminOrdersRouter } from "./routes/admin/orders.js";
import { makeAdminAuditRouter } from "./routes/admin/audit.js";
import { makeAdminUploadsRouter } from "./routes/admin/uploads.js";
import type { AppEnv } from "./lib/types.js";
import type { DbClient } from "./db/client.js";

export interface AppDeps {
  db: DbClient;
}

/** Build the Hono application with middleware, routes, and error handlers wired in. */
export function createApp(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  app.use("*", requestId);
  app.use("*", logger);

  app.route("/healthz", healthRouter);
  app.route("/categories", makeCategoriesRouter(deps.db));
  app.route("/admin/auth", makeAdminAuthRouter(deps.db));
  app.route("/admin/products", makeAdminProductsRouter(deps.db));
  app.route("/admin/categories", makeAdminCategoriesRouter(deps.db));
  app.route("/home", makePublicHomeRouter(deps.db));
  app.route("/admin/home", makeAdminHomeRouter(deps.db));
  app.route("/settings", makePublicSettingsRouter(deps.db));
  app.route("/admin/settings", makeAdminSettingsRouter(deps.db));
  app.route("/admin/orders", makeAdminOrdersRouter(deps.db));
  app.route("/admin/audit-log", makeAdminAuditRouter(deps.db));
  app.route("/admin/uploads", makeAdminUploadsRouter(deps.db));

  app.notFound((c) => c.json({ error: "Not Found" }, 404));

  app.onError((err, c) => {
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        level: "error",
        msg: "unhandled_error",
        error: err.message,
        stack: err.stack,
        request_id: c.get("requestId"),
      }),
    );
    return c.json({ error: "Internal Server Error" }, 500);
  });

  return app;
}
