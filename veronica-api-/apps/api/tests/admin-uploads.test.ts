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

function uploadReq(token: string | null, blob: Blob, filename: string) {
  const fd = new FormData();
  fd.append("file", blob, filename);
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return { method: "POST", headers, body: fd };
}

describe("POST /admin/uploads", () => {
  it("401 without a token", async () => {
    const res = await createApp({ db: mockDb() }).request(
      "/admin/uploads",
      uploadReq(null, new Blob([new Uint8Array(10)], { type: "image/png" }), "x.png"),
    );
    expect(res.status).toBe(401);
  });

  it("403 for a non-admin token", async () => {
    const res = await createApp({ db: mockDb({ admin: false }) }).request(
      "/admin/uploads",
      uploadReq(await token(), new Blob([new Uint8Array(10)], { type: "image/png" }), "x.png"),
    );
    expect(res.status).toBe(403);
  });

  it("400 for a non-image file", async () => {
    const res = await createApp({ db: mockDb({ admin: true }) }).request(
      "/admin/uploads",
      uploadReq(await token(), new Blob([new Uint8Array(10)], { type: "text/plain" }), "x.txt"),
    );
    expect(res.status).toBe(400);
  });

  it("400 for a file over 5MB", async () => {
    const big = new Uint8Array(5 * 1024 * 1024 + 1);
    const res = await createApp({ db: mockDb({ admin: true }) }).request(
      "/admin/uploads",
      uploadReq(await token(), new Blob([big], { type: "image/png" }), "big.png"),
    );
    expect(res.status).toBe(400);
  });
});
