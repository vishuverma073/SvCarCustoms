import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../lib/types.js";

/** Emits one structured JSON log line per request after it completes. */
export const logger = createMiddleware<AppEnv>(async (c, next) => {
  const start = Date.now();
  await next();
  const elapsedMs = Date.now() - start;
  const status = c.res.status;
  const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";

  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      level,
      msg: "request",
      method: c.req.method,
      path: c.req.path,
      status,
      elapsed_ms: elapsedMs,
      request_id: c.get("requestId"),
    }),
  );
});
