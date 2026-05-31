import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "@/mocks/node";
import type { AdminProductCreate } from "@veronica/contracts";

/**
 * Integration test for the real admin API client + auth store, exercised
 * against the MSW node server (the same handlers the browser uses). Covers the
 * end-to-end paths the admin UI depends on: login, token gating, product CRUD,
 * and the 409-on-dependencies category delete.
 */

// The persisted auth store needs a sessionStorage; provide one for node.
function installSessionStorage() {
  const map = new Map<string, string>();
  vi.stubGlobal("sessionStorage", {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => map.set(k, v),
    removeItem: (k: string) => map.delete(k),
    clear: () => map.clear(),
  });
}

// Imported dynamically AFTER the sessionStorage shim is installed.
let adminApi: typeof import("@/lib/admin-api").adminApi;
let AdminApiError: typeof import("@/lib/admin-api").AdminApiError;
let store: typeof import("@/store/adminAuthStore").useAdminAuthStore;

beforeAll(async () => {
  installSessionStorage();
  server.listen({ onUnhandledRequest: "bypass" });
  const api = await import("@/lib/admin-api");
  const s = await import("@/store/adminAuthStore");
  adminApi = api.adminApi;
  AdminApiError = api.AdminApiError;
  store = s.useAdminAuthStore;
});
afterAll(() => server.close());
beforeEach(() => store.getState().clear());

async function authed() {
  await adminApi.login("admin@test.local", "admin123");
}

describe("admin-api auth", () => {
  it("logs in and stores the bearer token", async () => {
    const res = await adminApi.login("admin@test.local", "admin123");
    expect(res.accessToken).toBe("mock-token");
    expect(store.getState().token).toBe("mock-token");
    expect(store.getState().admin?.email).toBe("admin@test.local");
  });

  it("throws AdminApiError(401) on bad credentials", async () => {
    await expect(adminApi.login("x@y.z", "nope")).rejects.toMatchObject({
      name: "AdminApiError",
      status: 401,
    });
    expect(store.getState().token).toBeNull();
  });

  it("rejects unauthenticated reads and clears any stale session", async () => {
    await expect(adminApi.listProducts()).rejects.toBeInstanceOf(AdminApiError);
  });

  it("validateSession returns false without a token, true after login", async () => {
    expect(await adminApi.validateSession()).toBe(false);
    await authed();
    expect(await adminApi.validateSession()).toBe(true);
  });
});

describe("admin-api products CRUD", () => {
  beforeEach(authed);

  it("lists contract-shaped product list items", async () => {
    const items = await adminApi.listProducts();
    expect(items.length).toBeGreaterThanOrEqual(10);
    expect(items[0]).toHaveProperty("minPrice");
    expect(items[0]).toHaveProperty("skuCount");
  });

  it("filters by status and flag", async () => {
    const active = await adminApi.listProducts({ status: "active" });
    expect(active.every((p) => p.status === "active")).toBe(true);
    const best = await adminApi.listProducts({ flag: "bestseller" });
    expect(best.every((p) => p.isBestseller)).toBe(true);
  });

  it("creates → reads → updates → deletes a product", async () => {
    const draft: AdminProductCreate = {
      name: "Test Faucet",
      slug: "",
      description: "integration test",
      categoryId: 20,
      isBestseller: false,
      isNew: true,
      isFeatured: false,
      status: "draft",
      tags: ["Test"],
      images: ["https://placehold.co/600x600/png"],
      dimensions: [],
      skus: [{ id: 9001, skuCode: "TST", price: 1200, salePrice: null, dimensionValues: {} }],
      specifications: [],
      includedAccessories: [],
    };

    const created = await adminApi.createProduct(draft);
    expect(created.id).toBeGreaterThan(0);
    expect(created.slug).toBe("test-faucet"); // server slugified empty slug

    const fetched = await adminApi.getProduct(created.id);
    expect(fetched.name).toBe("Test Faucet");

    const updated = await adminApi.updateProduct(created.id, { status: "active" });
    expect(updated.status).toBe("active");

    await adminApi.deleteProduct(created.id);
    await expect(adminApi.getProduct(created.id)).rejects.toMatchObject({ status: 404 });
  });
});

describe("admin-api categories", () => {
  beforeEach(authed);

  it("blocks deleting a category that still has products (409)", async () => {
    // Category 20 (ABS Faucets) has seeded products.
    await expect(adminApi.deleteCategory(20)).rejects.toMatchObject({
      name: "AdminApiError",
      status: 409,
    });
  });

  it("serves home config and settings of the expected shape", async () => {
    const home = await adminApi.getHome();
    expect(home.sections).toHaveLength(6);
    const settings = await adminApi.getSettings();
    expect(settings.gstRate).toBeGreaterThanOrEqual(0);
  });
});
