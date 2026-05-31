import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../lib/types.js";

/** Accepts up to 64 chars of alphanumerics and dashes. */
const REQUEST_ID_RE = /^[A-Za-z0-9-]{1,64}$/;

/**
 * Reads a client-supplied `x-request-id` (if well-formed) or generates a UUID,
 * stores it on the context, and echoes it back on the response header.
 */
export const requestId = createMiddleware<AppEnv>(async (c, next) => {
  const incoming = c.req.header("x-request-id");
  const id = incoming && REQUEST_ID_RE.test(incoming) ? incoming : crypto.randomUUID();
  c.set("requestId", id);
  c.header("x-request-id", id);
  await next();
});
