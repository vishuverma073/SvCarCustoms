/**
 * Public payment callbacks (no auth — authenticated by the gateway's hash).
 *
 * PayU's hosted page POSTs the payment result here (the `surl`/`furl` we passed
 * at checkout). We verify the reverse hash, mark the order paid on success, and
 * 303-redirect the browser back to the storefront order page either way. This is
 * a browser navigation (not JSON), so the customer always lands somewhere sane.
 * The /webhooks/payu server-to-server callback is the durable backup path.
 */
import { Hono } from "hono";
import { eq } from "drizzle-orm";
import type { DbClient } from "../db/client.js";
import { carts, cartItems, orders } from "../db/schema.js";
import type { AppEnv } from "../lib/types.js";
import { verifyPayuResponse } from "../lib/payu.js";
import { emitOrderPaid } from "../lib/events.js";
import { logOrderEvent } from "../lib/order-events.js";
import { log } from "../lib/logger.js";

function storefrontBase(): string {
  return (process.env.STOREFRONT_URL ?? "https://www.svcarcustoms.com").replace(/\/$/, "");
}

export function makePaymentsRouter(db: DbClient) {
  const router = new Hono<AppEnv>();

  // POST /payments/payu/return — PayU posts the result (form-encoded) here.
  router.post("/payu/return", async (c) => {
    const form = await c.req.parseBody();
    const params: Record<string, string> = {};
    for (const [k, v] of Object.entries(form)) params[k] = typeof v === "string" ? v : String(v);

    const orderNumber = params.udf1 || params.txnid || "";
    const failureUrl = `${storefrontBase()}/orders/${encodeURIComponent(orderNumber)}?pay=failed`;

    if (!verifyPayuResponse(params)) {
      log("warn", "payu_return_bad_hash", { txnid: params.txnid, request_id: c.get("requestId") });
      return c.redirect(failureUrl, 303);
    }

    const txnid = params.txnid;
    if (!txnid) return c.redirect(failureUrl, 303);

    const [order] = await db.select().from(orders).where(eq(orders.payuTxnId, txnid)).limit(1);
    if (!order) {
      log("warn", "payu_return_order_not_found", { txnid });
      return c.redirect(failureUrl, 303);
    }

    // Failure / cancellation: leave the order `pending` so the customer can retry.
    if (params.status !== "success") {
      log("info", "payu_return_not_success", { txnid, status: params.status });
      return c.redirect(`${storefrontBase()}/orders/${encodeURIComponent(order.orderNumber)}?pay=failed`, 303);
    }

    // Idempotent: an already-paid order just redirects to success.
    if (order.status === "pending") {
      await db
        .update(orders)
        .set({ payuPaymentId: params.mihpayid ?? null, status: "paid", updatedAt: new Date() })
        .where(eq(orders.id, order.id));

      const [cart] = await db
        .select({ id: carts.id })
        .from(carts)
        .where(eq(carts.userId, order.userId!))
        .limit(1);
      if (cart) await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));

      await logOrderEvent(db, { orderId: order.id, eventType: "paid" });
      await emitOrderPaid(order.id);
      log("info", "payu_return_order_paid", { orderNumber: order.orderNumber });
    }

    return c.redirect(`${storefrontBase()}/orders/${encodeURIComponent(order.orderNumber)}?just=paid`, 303);
  });

  return router;
}
