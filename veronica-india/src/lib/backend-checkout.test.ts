import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import { server } from "@/mocks/node";
import { backend, BackendAuthError } from "@/lib/backend";
import { useAuthStore } from "@/store/authStore";
import { serverCart } from "@/mocks/data/account";
import { __resetCheckoutState } from "@/mocks/data/orders";
import type { AddressInput } from "@veronica/contracts";

/**
 * Integration test for the Phase 4 checkout client against the MSW node server:
 * address CRUD, order create→verify, cart-clearing, and order history.
 */

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterAll(() => server.close());
beforeEach(() => {
  useAuthStore.getState().clearAuth();
  serverCart.length = 0;
  __resetCheckoutState();
});

const EMAIL = "asha@example.com";

async function login() {
  await backend.sendOtp(EMAIL);
  await backend.verifyOtp(EMAIL, "123456");
}

const SAMPLE_ADDRESS: AddressInput = {
  label: "Home",
  fullName: "Ketan",
  phone: "9350529717", // address contact: a 10-digit Indian mobile (login phone is E.164)
  line1: "12 MG Road",
  line2: "",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
  landmark: "",
  isDefault: false,
};

async function seedCart() {
  await backend.addCartItem({
    skuId: 101, qty: 2, name: "Test Sink", slug: "test-sink",
    price: 1200, image: "https://placehold.co/600x600/png",
  });
}

describe("addresses", () => {
  beforeEach(login);

  it("creates the first address as default and lists it", async () => {
    const created = await backend.createAddress(SAMPLE_ADDRESS);
    expect(created.id).toBeGreaterThan(0);
    expect(created.isDefault).toBe(true); // first address is forced default
    const list = await backend.listAddresses();
    expect(list).toHaveLength(1);
  });

  it("moves the default flag when a new default is added", async () => {
    const first = await backend.createAddress(SAMPLE_ADDRESS);
    const second = await backend.createAddress({ ...SAMPLE_ADDRESS, line1: "9 Park St", isDefault: true });
    const list = await backend.listAddresses();
    expect(list.find((a) => a.id === second.id)?.isDefault).toBe(true);
    expect(list.find((a) => a.id === first.id)?.isDefault).toBe(false);
  });

  it("deletes an address", async () => {
    const a = await backend.createAddress(SAMPLE_ADDRESS);
    await backend.removeAddress(a.id);
    expect(await backend.listAddresses()).toHaveLength(0);
  });

  it("rejects address access without auth", async () => {
    useAuthStore.getState().clearAuth();
    await expect(backend.listAddresses()).rejects.toBeInstanceOf(BackendAuthError);
  });
});

describe("checkout order flow", () => {
  beforeEach(login);

  it("creates a pending order then verifies it, clearing the cart", async () => {
    await seedCart();
    const address = await backend.createAddress(SAMPLE_ADDRESS);

    const created = await backend.createOrder({ addressId: address.id });
    expect(created.orderNumber).toMatch(/^VE/);
    expect(created.razorpayOrderId).toContain(created.orderNumber);
    expect(created.amount).toBe(2400 + 99); // 2×1200 + flat shipping

    const result = await backend.verifyOrder({
      razorpayOrderId: created.razorpayOrderId,
      razorpayPaymentId: "pay_mock_123",
      razorpaySignature: "sig_mock_123",
    });
    // verifyOrder now returns just the order number to route to (the real API's
    // /checkout/verify responds { ok, orderNumber }); fetch detail for the rest.
    expect(result.orderNumber).toBe(created.orderNumber);
    expect(serverCart).toHaveLength(0); // cart emptied on success
  });

  it("refuses to create an order with an empty cart", async () => {
    const address = await backend.createAddress(SAMPLE_ADDRESS);
    await expect(backend.createOrder({ addressId: address.id })).rejects.toMatchObject({ status: 422 });
  });

  it("surfaces the placed order in history and by number", async () => {
    await seedCart();
    const address = await backend.createAddress(SAMPLE_ADDRESS);
    const created = await backend.createOrder({ addressId: address.id });
    await backend.verifyOrder({
      razorpayOrderId: created.razorpayOrderId,
      razorpayPaymentId: "pay_mock_1",
      razorpaySignature: "sig_1",
    });

    const page = await backend.getOrders();
    expect(page.items).toHaveLength(1);
    expect(page.items[0].orderNumber).toBe(created.orderNumber);

    const detail = await backend.getOrder(created.orderNumber);
    expect(detail.items[0].qty).toBe(2);
  });

  it("404s an unknown order number", async () => {
    await expect(backend.getOrder("VE-DOESNOTEXIST")).rejects.toMatchObject({ status: 404 });
  });

  it("returns a tracking timeline for a paid order", async () => {
    await seedCart();
    const address = await backend.createAddress(SAMPLE_ADDRESS);
    const created = await backend.createOrder({ addressId: address.id });
    await backend.verifyOrder({
      razorpayOrderId: created.razorpayOrderId,
      razorpayPaymentId: "pay_mock_1",
      razorpaySignature: "sig_1",
    });
    const events = await backend.getOrderEvents(created.orderNumber);
    // getOrderEvents now preserves the backend's granular event types so the
    // tracking timeline can show every stage (placed → paid → … → delivered).
    expect(events.map((e) => e.eventType)).toEqual(["placed", "paid"]);
  });
});

describe("pincode lookup", () => {
  it("autofills a known pincode", async () => {
    const res = await backend.lookupPincode("110061");
    expect(res).toMatchObject({ pincode: "110061", city: "New Delhi", state: "Delhi" });
  });

  it("fails (404) for an unknown pincode", async () => {
    await expect(backend.lookupPincode("999999")).rejects.toThrow(/404/);
  });
});
