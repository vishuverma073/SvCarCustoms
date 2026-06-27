import { describe, expect, it } from "vitest";

process.env.JWT_ADMIN_SECRET = "test-admin-secret-at-least-32-chars-long!!";
process.env.LOG_LEVEL = "debug";

import { createApp } from "../src/app.js";
import { signAdminAccess } from "../src/lib/jwt.js";
import type { DbClient } from "../src/db/client.js";

const ADMIN_ID = "fb354b9c-6c05-4379-8f2c-4c59962d4761";

const settingsRow = {
  id: 1,
  storeName: "Svcar India",
  supportPhone: "+919350529717",
  supportEmail: "svcarsanitarygoods@gmail.com",
  storeAddress: { line1: "Shop 1", city: "Delhi", state: "Delhi", pincode: "110001" },
  gstRate: "18.00",
  shippingFreeAbove: "5000",
  shippingFlatFee: "200",
  whatsappNumber: "+919350529717",
  updatedAt: new Date(),
};

function publicDb(): DbClient {
  return {
    select: () => ({ from: () => ({ where: () => ({ limit: async () => [settingsRow] }) }) }),
  } as unknown as DbClient;
}

function adminDb(): DbClient {
  const adminRow = { id: ADMIN_ID, email: "a@b.com", name: "A", isAdmin: true };
  let calls = 0;
  return {
    // requireAdmin's first select must return the admin; later selects return the settings row.
    select: () => ({
      from: () => ({ where: () => ({ limit: async () => (calls++ === 0 ? [adminRow] : [settingsRow]) }) }),
    }),
    update: () => ({ set: () => ({ where: () => ({ returning: async () => [settingsRow] }) }) }),
    insert: () => ({ values: async () => undefined }),
  } as unknown as DbClient;
}

const token = () => signAdminAccess({ sub: ADMIN_ID });

describe("GET /settings (public)", () => {
  it("returns the public subset and excludes storeAddress", async () => {
    const res = await createApp({ db: publicDb() }).request("/settings");
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.storeName).toBe("Svcar India");
    expect(body.gstRate).toBe(18);
    expect(body.storeAddress).toBeUndefined();
    expect(body.updatedAt).toBeUndefined();
  });
});

describe("/admin/settings", () => {
  it("401 without a token", async () => {
    const res = await createApp({ db: adminDb() }).request("/admin/settings");
    expect(res.status).toBe(401);
  });

  it("PATCH updates and returns full settings", async () => {
    const res = await createApp({ db: adminDb() }).request("/admin/settings", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ gstRate: 12 }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.storeAddress).toBeDefined(); // full settings include address
  });

  it("PATCH 400 for an invalid value", async () => {
    const res = await createApp({ db: adminDb() }).request("/admin/settings", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ gstRate: 999 }), // > 100
    });
    expect(res.status).toBe(400);
  });
});
