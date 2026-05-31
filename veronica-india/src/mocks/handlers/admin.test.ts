import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { server } from "../node";
import { API_BASE } from "@/lib/api-config";
import {
  ProductListItemSchema,
  ProductSchema,
  CategoryListSchema,
  SettingsSchema,
  HomeConfigSchema,
} from "@veronica/contracts";

const AUTH = { Authorization: "Bearer mock-token" };

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterAll(() => server.close());

describe("admin mock handlers", () => {
  it("logs in with the mock credentials", async () => {
    const res = await fetch(`${API_BASE}/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@test.local", password: "admin123" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accessToken).toBe("mock-token");
    expect(body.admin.email).toBe("admin@test.local");
  });

  it("rejects bad credentials with 401", async () => {
    const res = await fetch(`${API_BASE}/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "x@y.z", password: "nope" }),
    });
    expect(res.status).toBe(401);
  });

  it("gates product listing behind the bearer token", async () => {
    const res = await fetch(`${API_BASE}/admin/products`);
    expect(res.status).toBe(401);
  });

  it("returns contract-shaped product list items when authed", async () => {
    const res = await fetch(`${API_BASE}/admin/products`, { headers: AUTH });
    expect(res.status).toBe(200);
    const body = await res.json();
    z.array(ProductListItemSchema).parse(body);
    expect(body.length).toBeGreaterThanOrEqual(10);
  });

  it("returns a full product by id", async () => {
    const res = await fetch(`${API_BASE}/admin/products/1`, { headers: AUTH });
    expect(res.status).toBe(200);
    ProductSchema.parse(await res.json());
  });

  it("serves categories, settings and home config", async () => {
    const cats = await (await fetch(`${API_BASE}/admin/categories`, { headers: AUTH })).json();
    CategoryListSchema.parse(cats);

    const settings = await (await fetch(`${API_BASE}/admin/settings`, { headers: AUTH })).json();
    SettingsSchema.parse(settings);

    const home = await (await fetch(`${API_BASE}/admin/home`, { headers: AUTH })).json();
    HomeConfigSchema.parse(home);
  });

  it("blocks deleting a category that has products", async () => {
    const res = await fetch(`${API_BASE}/admin/categories/10`, {
      method: "DELETE",
      headers: AUTH,
    });
    expect(res.status).toBe(409);
  });
});
