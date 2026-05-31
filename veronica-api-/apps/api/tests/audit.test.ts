import { describe, expect, it, vi } from "vitest";
import { logAudit } from "../src/lib/audit.js";
import type { DbClient } from "../src/db/client.js";

describe("logAudit", () => {
  it("inserts an audit row", async () => {
    const values = vi.fn().mockResolvedValue(undefined);
    const db = { insert: () => ({ values }) } as unknown as DbClient;

    await logAudit(db, {
      actorUserId: "u1",
      action: "product.update",
      resourceType: "product",
      resourceId: "5",
    });

    expect(values).toHaveBeenCalledOnce();
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ action: "product.update", resourceType: "product", resourceId: "5" }),
    );
  });

  it("swallows DB failures (fire-and-forget)", async () => {
    const db = {
      insert: () => ({ values: () => Promise.reject(new Error("db down")) }),
    } as unknown as DbClient;

    await expect(
      logAudit(db, { actorUserId: null, action: "x", resourceType: "user", resourceId: "1" }),
    ).resolves.toBeUndefined();
  });
});
