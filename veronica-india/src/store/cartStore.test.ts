import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import { server } from "@/mocks/node";
import { backend } from "@/lib/backend";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { serverCart } from "@/mocks/data/account";

/**
 * Regression tests for the cart ⇄ server reconciliation (Phase 3). These lock
 * in the fixes for two confirmed bugs found in the deep audit:
 *  1. A logged-in cart was wiped on reload (sync mirrored an empty server).
 *  2. The mock server cart leaked across users because logout never cleared it.
 */

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterAll(() => server.close());

beforeEach(() => {
  useAuthStore.getState().clearAuth();
  useCartStore.setState({ items: [] });
  serverCart.length = 0;
});

const GUEST_ITEM = {
  id: 101,
  cartKey: "101",
  name: "Test Sink",
  slug: "test-sink",
  price: 1200,
  image: "https://placehold.co/600x600/png",
  qty: 2,
};

async function login(phone = "+919350529717") {
  await backend.sendOtp(phone);
  await backend.verifyOtp(phone, "123456");
}

describe("cartStore.syncWithServer", () => {
  it("merges a guest cart into an empty server on login and attaches serverIds", async () => {
    useCartStore.setState({ items: [{ ...GUEST_ITEM }] });
    await login();
    await useCartStore.getState().syncWithServer();

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].qty).toBe(2);
    expect(items[0].serverId).toBeDefined();
    expect(serverCart).toHaveLength(1);
  });

  it("does NOT wipe the cart on reload when the server starts empty", async () => {
    await login();
    // Simulate a reload: persisted items rehydrate WITHOUT serverId (partialize),
    // and the in-memory mock server cart has reset to empty.
    useCartStore.setState({ items: [{ ...GUEST_ITEM, serverId: undefined }] });
    serverCart.length = 0;

    await useCartStore.getState().syncWithServer();

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1); // restored, not wiped
    expect(items[0].qty).toBe(2);
    expect(serverCart).toHaveLength(1);
  });

  it("pushes a locally-changed quantity up to the server (e.g. edited after a reload)", async () => {
    useCartStore.setState({ items: [{ ...GUEST_ITEM }] }); // qty 2
    await login();
    await useCartStore.getState().syncWithServer();
    expect(serverCart[0].qty).toBe(2);

    // Shopper bumps qty to 5 locally; serverId stripped (as after a reload), so
    // the change never PATCHed the server directly. Sync must reconcile it.
    useCartStore.setState({ items: [{ ...GUEST_ITEM, qty: 5, serverId: undefined }] });
    await useCartStore.getState().syncWithServer();

    expect(serverCart).toHaveLength(1);
    expect(serverCart[0].qty).toBe(5); // server now matches the cart the shopper sees
    expect(useCartStore.getState().items[0].qty).toBe(5);
  });

  it("does not double-count items already on the server across repeated syncs", async () => {
    useCartStore.setState({ items: [{ ...GUEST_ITEM }] });
    await login();
    await useCartStore.getState().syncWithServer();
    await useCartStore.getState().syncWithServer(); // sync again — should be idempotent

    expect(serverCart).toHaveLength(1);
    expect(serverCart[0].qty).toBe(2);
    expect(useCartStore.getState().items[0].qty).toBe(2);
  });
});

describe("logout cart isolation", () => {
  it("clears the server cart on logout so the next user doesn't inherit it", async () => {
    useCartStore.setState({ items: [{ ...GUEST_ITEM }] });
    await login("+919350529717");
    await useCartStore.getState().syncWithServer();
    expect(serverCart).toHaveLength(1);

    await backend.logout();
    expect(serverCart).toHaveLength(0);

    // A different user signing in starts from a clean server cart.
    useCartStore.setState({ items: [] });
    await login("+919999999999");
    const cart = await backend.getCart();
    expect(cart.items).toHaveLength(0);
  });
});
