import { describe, expect, it } from "vitest";

process.env.JWT_ADMIN_SECRET = "test-admin-secret-at-least-32-chars-long!!";
process.env.LOG_LEVEL = "debug";

import { createApp } from "../src/app.js";
import { signAdminAccess } from "../src/lib/jwt.js";
import type { DbClient } from "../src/db/client.js";

const ADMIN_ID = "fb354b9c-6c05-4379-8f2c-4c59962d4761";

function mockDb(opts: { admin?: boolean } = {}): DbClient {
  const adminRow = opts.admin === false ? null : { id: ADMIN_ID, email: "a@b.com", name: "A", isAdmin: true };
  return {
    select: () => ({ from: () => ({ where: () => ({ limit: async () => (adminRow ? [adminRow] : []) }) }) }),
  } as unknown as DbClient;
}

const token = () => signAdminAccess({ sub: ADMIN_ID });

describe("admin categories authz + validation", () => {
  it("401 without a token", async () => {
    const res = await createApp({ db: mockDb() }).request("/admin/categories", { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("403 for a non-admin token", async () => {
    const res = await createApp({ db: mockDb({ admin: false }) }).request("/admin/categories", {
      headers: { Authorization: `Bearer ${await token()}` },
    });
    expect(res.status).toBe(403);
  });

  it("400 when creating without a name", async () => {
    const res = await createApp({ db: mockDb({ admin: true }) }).request("/admin/categories", {
      method: "POST",
      headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sortOrder: 1 }),
    });
    expect(res.status).toBe(400);
  });
});
