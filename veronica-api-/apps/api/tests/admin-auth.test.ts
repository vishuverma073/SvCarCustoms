import { describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";

// Set before any login() call — signAdminAccess reads this lazily at call time.
process.env.JWT_ADMIN_SECRET = "test-admin-secret-at-least-32-chars-long!!";

import { createApp } from "../src/app.js";
import type { DbClient } from "../src/db/client.js";

const PASSWORD = "supersecret1";
const adminUser = {
  id: "11111111-1111-1111-1111-111111111111",
  phone: "+919999999999",
  email: "admin@veronica.dev",
  name: "Admin",
  isAdmin: true,
  passwordHash: bcrypt.hashSync(PASSWORD, 10),
  createdAt: new Date(),
};

function mockDb(rows: unknown[]): DbClient {
  return {
    select: () => ({ from: () => ({ where: () => ({ limit: async () => rows }) }) }),
    insert: () => ({ values: async () => undefined }),
  } as unknown as DbClient;
}

function login(db: DbClient, payload: unknown) {
  return createApp({ db }).request("/admin/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

describe("POST /admin/auth/login", () => {
  it("returns 200 + token for valid admin credentials", async () => {
    const res = await login(mockDb([adminUser]), { email: adminUser.email, password: PASSWORD });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { accessToken: string; admin: Record<string, unknown> };
    expect(body.accessToken).toBeTypeOf("string");
    expect(body.admin).toMatchObject({ id: adminUser.id, email: adminUser.email, isAdmin: true });
    expect(body.admin.passwordHash).toBeUndefined();
  });

  it("401 for wrong password", async () => {
    const res = await login(mockDb([adminUser]), { email: adminUser.email, password: "wrongpassword" });
    expect(res.status).toBe(401);
  });

  it("401 when no admin matches the email", async () => {
    const res = await login(mockDb([]), { email: "nobody@example.com", password: PASSWORD });
    expect(res.status).toBe(401);
  });

  it("400 when email is missing", async () => {
    const res = await login(mockDb([adminUser]), { password: PASSWORD });
    expect(res.status).toBe(400);
  });

  it("400 when password is too short", async () => {
    const res = await login(mockDb([adminUser]), { email: adminUser.email, password: "short" });
    expect(res.status).toBe(400);
  });
});
