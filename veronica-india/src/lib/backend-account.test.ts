import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import { server } from "@/mocks/node";
import { backend, BackendAuthError } from "@/lib/backend";
import { useAuthStore } from "@/store/authStore";

/**
 * Integration test for the Phase 3 auth + cart client against the MSW node
 * server: OTP login, profile, and the authenticated cart endpoints.
 */

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterAll(() => server.close());
beforeEach(() => useAuthStore.getState().clearAuth());

const PHONE = "+919350529717";

async function login() {
  await backend.sendOtp(PHONE);
  await backend.verifyOtp(PHONE, "123456");
}

describe("auth", () => {
  it("sends an OTP", async () => {
    const res = await backend.sendOtp(PHONE);
    expect(res.sent).toBe(true);
  });

  it("rejects a wrong OTP with 401", async () => {
    await expect(backend.verifyOtp(PHONE, "000000")).rejects.toMatchObject({
      name: "BackendAuthError",
      status: 401,
    });
    expect(useAuthStore.getState().status).not.toBe("authenticated");
  });

  it("verifies the OTP and sets the in-memory session", async () => {
    const session = await backend.verifyOtp(PHONE, "123456");
    expect(session.accessToken).toBe("mock-user-token");
    expect(session.user.phone).toBe(PHONE);
    expect(useAuthStore.getState().status).toBe("authenticated");
    expect(useAuthStore.getState().accessToken).toBe("mock-user-token");
  });

  it("fetches and updates the profile", async () => {
    await login();
    const me = await backend.getMe();
    expect(me.phone).toBe(PHONE);
    const updated = await backend.updateMe({ name: "Ketan", email: "k@example.com" });
    expect(updated.name).toBe("Ketan");
    expect(updated.email).toBe("k@example.com");
  });

  it("rejects /me without a token", async () => {
    await expect(backend.getMe()).rejects.toBeInstanceOf(BackendAuthError);
  });
});

describe("cart", () => {
  beforeEach(login);

  it("adds, sums-by-sku, updates and removes items", async () => {
    let cart = await backend.addCartItem({
      skuId: 101,
      qty: 1,
      name: "Test Sink",
      slug: "test-sink",
      price: 1200,
      image: "https://placehold.co/600x600/png",
    });
    expect(cart.items).toHaveLength(1);
    const lineId = cart.items[0].id;

    // same SKU again → quantity sums, no new line
    cart = await backend.addCartItem({
      skuId: 101,
      qty: 2,
      name: "Test Sink",
      slug: "test-sink",
      price: 1200,
      image: "https://placehold.co/600x600/png",
    });
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].qty).toBe(3);

    cart = await backend.updateCartItem(lineId, 5);
    expect(cart.items[0].qty).toBe(5);

    cart = await backend.removeCartItem(lineId);
    expect(cart.items).toHaveLength(0);
  });
});
