import { describe, expect, it } from "vitest";

process.env.JWT_ADMIN_SECRET = "test-admin-secret-at-least-32-chars-long!!";
process.env.LOG_LEVEL = "debug";

import { createApp } from "../src/app.js";
import { signAdminAccess } from "../src/lib/jwt.js";
import type { DbClient } from "../src/db/client.js";

const ADMIN_ID = "fb354b9c-6c05-4379-8f2c-4c59962d4761";

function mockDb(opts: { admin?: boolean; product?: unknown } = {}): DbClient {
  const adminRow = opts.admin === false ? null : { id: ADMIN_ID, email: "a@b.com", name: "A", isAdmin: true };
  return {
    select: () => ({ from: () => ({ where: () => ({ limit: async () => (adminRow ? [adminRow] : []) }) }) }),
    query: {
      products: {
        findFirst: async () => opts.product ?? undefined,
        findMany: async () => [],
      },
    },
  } as unknown as DbClient;
}

async function adminToken() {
  return signAdminAccess({ sub: ADMIN_ID });
}

describe("admin products authz + validation", () => {
  it("401 without a token", async () => {
    const res = await createApp({ db: mockDb() }).request("/admin/products", { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("403 for a non-admin token", async () => {
    const token = await adminToken();
    const res = await createApp({ db: mockDb({ admin: false }) }).request("/admin/products", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
  });

  it("400 when creating with missing required fields", async () => {
    const token = await adminToken();
    const res = await createApp({ db: mockDb({ admin: true }) }).request("/admin/products", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "draft" }), // no name / categoryId
    });
    expect(res.status).toBe(400);
  });

  it("404 when fetching a non-existent product", async () => {
    const token = await adminToken();
    const res = await createApp({ db: mockDb({ admin: true, product: undefined }) }).request(
      "/admin/products/99999",
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(res.status).toBe(404);
  });

  it("400 when patching with an invalid field", async () => {
    const token = await adminToken();
    const res = await createApp({ db: mockDb({ admin: true }) }).request("/admin/products/1", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: -5 }), // must be a positive int
    });
    expect(res.status).toBe(400);
  });
});
