import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import { sign } from "hono/jwt";

process.env.JWT_ADMIN_SECRET = "test-admin-secret-at-least-32-chars-long!!";
process.env.LOG_LEVEL = "debug"; // skip the cache so each test hits the (mocked) DB

import { makeRequireAdmin } from "../src/middleware/auth.js";
import { signAdminAccess } from "../src/lib/jwt.js";
import type { DbClient } from "../src/db/client.js";
import type { AppEnv } from "../src/lib/types.js";

const ADMIN_ID = "fb354b9c-6c05-4379-8f2c-4c59962d4761";

function mockDb(row: unknown | null): DbClient {
  return {
    select: () => ({ from: () => ({ where: () => ({ limit: async () => (row ? [row] : []) }) }) }),
  } as unknown as DbClient;
}

function appWith(db: DbClient) {
  const app = new Hono<AppEnv>();
  app.use("/admin/*", makeRequireAdmin(db));
  app.get("/admin/test", (c) => c.json({ ok: true, adminUserId: c.get("adminUserId") }));
  return app;
}

describe("requireAdmin", () => {
  it("passes through for a valid admin token", async () => {
    const token = await signAdminAccess({ sub: ADMIN_ID });
    const db = mockDb({ id: ADMIN_ID, email: "a@b.com", name: "A", isAdmin: true });
    const res = await appWith(db).request("/admin/test", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, adminUserId: ADMIN_ID });
  });

  it("401 when the token is missing", async () => {
    const res = await appWith(mockDb(null)).request("/admin/test");
    expect(res.status).toBe(401);
  });

  it("401 for a malformed token", async () => {
    const res = await appWith(mockDb(null)).request("/admin/test", {
      headers: { Authorization: "Bearer not-a-jwt" },
    });
    expect(res.status).toBe(401);
  });

  it("401 for a token with the wrong issuer (e.g. a customer token)", async () => {
    const now = Math.floor(Date.now() / 1000);
    const customerToken = await sign(
      { sub: ADMIN_ID, iss: "svcar-customer", iat: now, exp: now + 3600 },
      process.env.JWT_ADMIN_SECRET!,
      "HS256",
    );
    const res = await appWith(mockDb({ id: ADMIN_ID, isAdmin: true })).request("/admin/test", {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    expect(res.status).toBe(401);
  });

  it("403 when the user is no longer an admin (revoked)", async () => {
    const token = await signAdminAccess({ sub: ADMIN_ID });
    const db = mockDb({ id: ADMIN_ID, email: "a@b.com", name: "A", isAdmin: false });
    const res = await appWith(db).request("/admin/test", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
  });
});
