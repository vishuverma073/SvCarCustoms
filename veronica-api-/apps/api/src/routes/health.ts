import { Hono } from "hono";
import type { AppEnv } from "../lib/types.js";

export const healthRouter = new Hono<AppEnv>();

healthRouter.get("/", (c) =>
  c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "0.0.1",
  }),
);
