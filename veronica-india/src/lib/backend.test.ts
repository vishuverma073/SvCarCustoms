import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { server } from "@/mocks/node";
import { backend } from "@/lib/backend";
import {
  CategoryListSchema,
  CategoryWithBreadcrumbSchema,
  ProductSchema,
  ProductListItemSchema,
} from "@veronica/contracts";
import { z } from "zod";

/**
 * Integration test for the storefront `backend` client against the MSW node
 * server (the same handlers SSR uses). Covers the Phase 2 read paths that
 * replaced the retired in-memory data layer.
 */

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterAll(() => server.close());

describe("backend categories", () => {
  it("returns root categories", async () => {
    const roots = await backend.getCategories();
    CategoryListSchema.parse(roots);
    expect(roots.length).toBeGreaterThanOrEqual(4);
    expect(roots.every((c) => c.parentId === null)).toBe(true);
  });

  it("returns a category with children + breadcrumb by slug", async () => {
    const cat = await backend.getCategoryBySlug("kitchen-sinks");
    CategoryWithBreadcrumbSchema.parse(cat);
    expect(cat.children.length).toBeGreaterThan(0);
    expect(cat.breadcrumb[cat.breadcrumb.length - 1].slug).toBe("kitchen-sinks");
  });

  it("returns a child category with a root→self breadcrumb by id", async () => {
    const cat = await backend.getCategoryById(10); // single-bowl
    expect(cat.breadcrumb.map((c) => c.slug)).toEqual(["kitchen-sinks", "single-bowl"]);
  });

  it("throws on an unknown category slug", async () => {
    await expect(backend.getCategoryBySlug("nope")).rejects.toThrow();
  });
});

describe("backend products", () => {
  it("lists paginated, contract-shaped items", async () => {
    const page = await backend.listProducts({ limit: 5 });
    z.array(ProductListItemSchema).parse(page.items);
    expect(page.items.length).toBeLessThanOrEqual(5);
    // 12 seeded products > 5 → a cursor is returned
    expect(page.nextCursor).not.toBeNull();
  });

  it("paginates forward with the cursor", async () => {
    const first = await backend.listProducts({ limit: 5 });
    const second = await backend.listProducts({ limit: 5, cursor: first.nextCursor! });
    const firstIds = new Set(first.items.map((p) => p.id));
    expect(second.items.every((p) => !firstIds.has(p.id))).toBe(true);
  });

  it("filters by flag and by category subtree", async () => {
    const best = await backend.listProducts({ bestseller: true });
    expect(best.items.every((p) => p.isBestseller)).toBe(true);

    const sinks = await backend.getProductsByCategory("kitchen-sinks");
    expect(sinks.length).toBeGreaterThan(0);
  });

  it("searches by free text", async () => {
    const results = await backend.searchProducts("faucet");
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every((p) => /faucet/i.test(p.name) || p.tags.some((t) => /faucet/i.test(t))),
    ).toBe(true);
  });

  it("fetches full product detail by slug, throws on unknown", async () => {
    const { items } = await backend.listProducts({ limit: 1 });
    const full = await backend.getProductBySlug(items[0].slug);
    ProductSchema.parse(full);
    expect(full.slug).toBe(items[0].slug);

    await expect(backend.getProductBySlug("does-not-exist")).rejects.toThrow();
  });
});
