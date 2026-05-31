import { describe, expect, it } from "vitest";
import { CategoryListSchema } from "@veronica/contracts";
import { createApp } from "../src/app.js";
import type { DbClient } from "../src/db/client.js";

/** Minimal stub of the drizzle `select().from().where().orderBy()` chain the route uses. */
function mockDb(rows: unknown[]): DbClient {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => Promise.resolve(rows),
        }),
      }),
    }),
  } as unknown as DbClient;
}

const sampleRow = {
  id: 1,
  parentId: null,
  name: "Kitchen Sinks",
  slug: "kitchen-sinks",
  description: "Premium quartz and stainless steel kitchen sinks",
  imageUrl: "/uploads/products/sink-hero-1.png",
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("GET /categories", () => {
  it("returns 200 with rows mapped to the contracts schema", async () => {
    const app = createApp({ db: mockDb([sampleRow]) });
    const res = await app.request("/categories");
    expect(res.status).toBe(200);

    const body = await res.json();
    // Validates the response shape against the published contract.
    const parsed = CategoryListSchema.parse(body);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({
      id: 1,
      parentId: null,
      slug: "kitchen-sinks",
      image: "/uploads/products/sink-hero-1.png",
      sortOrder: 0,
    });
  });

  it("returns [] when there are no root categories", async () => {
    const app = createApp({ db: mockDb([]) });
    const res = await app.request("/categories");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });
});
