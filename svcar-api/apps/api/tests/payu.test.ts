import { afterEach, describe, expect, it } from "vitest";

process.env.JWT_ACCESS_SECRET = "test-access-secret-at-least-32-chars-long!!";
process.env.NODE_ENV = "test"; // forces PayU stub mode (deterministic dummy salt)

import { createApp } from "../src/app.js";
import { signAccess } from "../src/lib/jwt.js";
import {
  buildPayuRequest,
  verifyPayuResponse,
  computePayuResponseHash,
  isPayuStub,
} from "../src/lib/payu.js";
import { users, carts, addresses, orders } from "../src/db/schema.js";
import type { DbClient } from "../src/db/client.js";

const USER_ID = "11111111-1111-1111-1111-111111111111";
const USER = { id: USER_ID, phone: "+919350529717", name: "Asha", email: "asha@example.com" };

interface State {
  user?: unknown;
  cart?: { id: string };
  address?: unknown;
  order?: unknown;
  items?: unknown[];
}

function makeDb(state: State): DbClient {
  return {
    select: () => ({
      from: (table: unknown) => ({
        where: () => ({
          limit: async () => {
            if (table === users) return state.user ? [state.user] : [];
            if (table === carts) return state.cart ? [state.cart] : [];
            if (table === addresses) return state.address ? [state.address] : [];
            if (table === orders) return state.order ? [state.order] : [];
            return [];
          },
        }),
      }),
    }),
    query: { cartItems: { findMany: async () => state.items ?? [] } },
    transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({ insert: () => ({ values: async () => {} }) }),
    update: () => ({ set: () => ({ where: async () => {} }) }),
    delete: () => ({ where: async () => {} }),
  } as unknown as DbClient;
}

const cartItem = {
  id: 1,
  skuId: 10,
  qty: 2,
  sku: {
    id: 10,
    skuCode: "LAV-1",
    price: "1500.00",
    salePrice: null,
    dimensionValues: { Size: "18x16" },
    product: { name: "Lavender Sink", images: [{ url: "/a.png" }] },
  },
};
const ADDRESS = { line1: "123 Test St", city: "Delhi", state: "DL", pincode: "110001" };

async function token(sub = USER_ID) {
  return signAccess({ sub, isAdmin: false });
}

afterEach(() => {
  delete process.env.PAYMENT_PROVIDER;
  delete process.env.ENABLE_DEV_AUTH_BYPASS;
});

describe("lib/payu", () => {
  it("is in stub mode under NODE_ENV=test", () => {
    expect(isPayuStub()).toBe(true);
  });

  it("buildPayuRequest emits the hosted-page fields + a hash", () => {
    const { paymentUrl, params } = buildPayuRequest({
      txnid: "SV0000000001",
      amount: "3099.00",
      productinfo: "Order SV0000000001",
      firstname: "Asha",
      email: "asha@example.com",
      phone: "+919350529717",
      surl: "https://api.example.com/payments/payu/return",
      furl: "https://api.example.com/payments/payu/return",
      udf1: "SV0000000001",
    });
    expect(paymentUrl).toContain("payu.in");
    expect(params.txnid).toBe("SV0000000001");
    expect(params.amount).toBe("3099.00");
    expect(params.hash).toMatch(/^[0-9a-f]{128}$/); // sha512 hex
  });

  it("verifyPayuResponse accepts a correctly-computed reverse hash", () => {
    const fields = {
      status: "success",
      txnid: "SV0000000001",
      amount: "3099.00",
      productinfo: "Order SV0000000001",
      firstname: "Asha",
      email: "asha@example.com",
      udf1: "SV0000000001",
    };
    const hash = computePayuResponseHash(fields);
    expect(verifyPayuResponse({ ...fields, hash })).toBe(true);
    expect(verifyPayuResponse({ ...fields, hash: "0".repeat(128) })).toBe(false);
  });

  it("rejects a mock_* hash unless the dev-auth bypass is on", () => {
    const fields = { status: "success", txnid: "SV1", amount: "10.00", hash: "mock_abc" };
    expect(verifyPayuResponse(fields)).toBe(false);
    process.env.ENABLE_DEV_AUTH_BYPASS = "1";
    expect(verifyPayuResponse(fields)).toBe(true);
  });
});

describe("POST /checkout/order (PAYMENT_PROVIDER=payu)", () => {
  it("returns a PayU handoff instead of a Razorpay one", async () => {
    process.env.PAYMENT_PROVIDER = "payu";
    const res = await createApp({
      db: makeDb({ user: USER, cart: { id: "c1" }, items: [cartItem] }),
    }).request("/checkout/order", {
      method: "POST",
      headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ address: ADDRESS }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, any>;
    expect(body.provider).toBe("payu");
    expect(body.amount).toBe(309900);
    expect(body.razorpayOrderId).toBeUndefined();
    expect(body.payu?.paymentUrl).toContain("payu.in");
    expect(body.payu?.params?.txnid).toBe(body.orderNumber);
    expect(body.payu?.params?.hash).toMatch(/^[0-9a-f]{128}$/);
  });
});

describe("POST /payments/payu/return", () => {
  const order = {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    orderNumber: "SV0000000001",
    userId: USER_ID,
    payuTxnId: "SV0000000001",
    status: "pending",
  };

  function form(fields: Record<string, string>) {
    return new URLSearchParams(fields).toString();
  }

  it("303-redirects to the success page and marks the order paid on a valid hash", async () => {
    const fields = {
      status: "success",
      txnid: "SV0000000001",
      amount: "3099.00",
      productinfo: "Order SV0000000001",
      firstname: "Asha",
      email: "asha@example.com",
      udf1: "SV0000000001",
      mihpayid: "payu_123",
    };
    const hash = computePayuResponseHash(fields);
    const res = await createApp({ db: makeDb({ order, cart: { id: "c1" } }) }).request(
      "/payments/payu/return",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form({ ...fields, hash }),
      },
    );
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("/orders/SV0000000001?just=paid");
  });

  it("303-redirects to the failure page on a bad hash", async () => {
    const res = await createApp({ db: makeDb({ order }) }).request("/payments/payu/return", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form({ status: "success", txnid: "SV0000000001", hash: "0".repeat(128) }),
    });
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("pay=failed");
  });

  it("303-redirects to the failure page when PayU reports a non-success status", async () => {
    const fields = {
      status: "failure",
      txnid: "SV0000000001",
      amount: "3099.00",
      productinfo: "Order SV0000000001",
      firstname: "Asha",
      email: "asha@example.com",
      udf1: "SV0000000001",
    };
    const hash = computePayuResponseHash(fields);
    const res = await createApp({ db: makeDb({ order }) }).request("/payments/payu/return", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form({ ...fields, hash }),
    });
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("pay=failed");
  });
});
