import { describe, expect, it } from "vitest";

process.env.NODE_ENV = "test"; // PayU stub mode (deterministic dummy salt)

// [Razorpay disabled — PayU-only project] This file previously tested the
// /webhooks/razorpay route, which has been removed. It now covers the live
// PayU server-to-server webhook (/webhooks/payu).
import { createApp } from "../src/app.js";
import { computePayuResponseHash } from "../src/lib/payu.js";
import type { DbClient } from "../src/db/client.js";

interface Counters {
  updates: number;
  lastSet?: Record<string, unknown>;
}

function makeDb(order: unknown, counters: Counters): DbClient {
  return {
    select: () => ({
      from: () => ({ where: () => ({ limit: async () => (order ? [order] : []) }) }),
    }),
    update: () => ({
      set: (vals: Record<string, unknown>) => ({
        where: async () => {
          counters.updates++;
          counters.lastSet = vals;
        },
      }),
    }),
    insert: () => ({ values: async () => {} }),
  } as unknown as DbClient;
}

const BASE_ORDER = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  orderNumber: "SV0000000001",
  userId: "11111111-1111-1111-1111-111111111111",
  status: "pending",
};

function form(fields: Record<string, string>) {
  return new URLSearchParams(fields).toString();
}

async function post(db: DbClient, fields: Record<string, string>) {
  return createApp({ db }).request("/webhooks/payu", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form(fields),
  });
}

describe("POST /webhooks/payu", () => {
  it("401 on an invalid hash", async () => {
    const counters: Counters = { updates: 0 };
    const res = await post(makeDb({ ...BASE_ORDER, payuTxnId: "SV_BAD_1" }, counters), {
      status: "success",
      txnid: "SV_BAD_1",
      mihpayid: "payu_bad_1",
      hash: "0".repeat(128),
    });
    expect(res.status).toBe(401);
    expect(counters.updates).toBe(0);
  });

  it("success + valid hash → marks the order paid", async () => {
    const counters: Counters = { updates: 0 };
    const fields = {
      status: "success",
      txnid: "SV_OK_1",
      amount: "3099.00",
      productinfo: "Order SV0000000001",
      firstname: "Asha",
      email: "asha@example.com",
      udf1: "SV0000000001",
      mihpayid: "payu_ok_1",
    };
    const hash = computePayuResponseHash(fields);
    const order = { ...BASE_ORDER, payuTxnId: "SV_OK_1" };
    const res = await post(makeDb(order, counters), { ...fields, hash });
    expect(res.status).toBe(200);
    expect(counters.updates).toBe(1);
    expect(counters.lastSet).toMatchObject({ status: "paid" });
  });

  it("duplicate callback → 200 and no second state change", async () => {
    const counters: Counters = { updates: 0 };
    const fields = {
      status: "success",
      txnid: "SV_DUP_1",
      amount: "3099.00",
      productinfo: "Order SV0000000001",
      firstname: "Asha",
      email: "asha@example.com",
      udf1: "SV0000000001",
      mihpayid: "payu_dup_1",
    };
    const hash = computePayuResponseHash(fields);
    const order = { ...BASE_ORDER, payuTxnId: "SV_DUP_1" };
    const first = await post(makeDb(order, counters), { ...fields, hash });
    const second = await post(makeDb(order, counters), { ...fields, hash });
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(counters.updates).toBe(1); // second request short-circuited
  });

  it("non-success status → 200 with no state change", async () => {
    const counters: Counters = { updates: 0 };
    const fields = {
      status: "failure",
      txnid: "SV_FAIL_1",
      amount: "3099.00",
      productinfo: "Order SV0000000001",
      firstname: "Asha",
      email: "asha@example.com",
      udf1: "SV0000000001",
    };
    const hash = computePayuResponseHash(fields);
    const order = { ...BASE_ORDER, payuTxnId: "SV_FAIL_1" };
    const res = await post(makeDb(order, counters), { ...fields, hash });
    expect(res.status).toBe(200);
    expect(counters.updates).toBe(0);
  });
});
