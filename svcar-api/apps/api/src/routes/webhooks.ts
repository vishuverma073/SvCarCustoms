import { Hono } from "hono";
import { eq } from "drizzle-orm";
import type { DbClient } from "../db/client.js";
import { orders } from "../db/schema.js";
import type { AppEnv } from "../lib/types.js";
// [Razorpay disabled — PayU-only project] The /webhooks/razorpay route below is
// turned off; only PayU's webhook is live. Re-enable by restoring this import
// and the route. import { verifyWebhookSignature } from "../lib/razorpay.js";
import { verifyPayuResponse } from "../lib/payu.js";
import { markProcessedOnce } from "../lib/idempotency.js";
import { emitOrderPaid } from "../lib/events.js";
import { log } from "../lib/logger.js";
import { alertSlack } from "../lib/alerts.js";
import { logOrderEvent } from "../lib/order-events.js";

export function makeWebhooksRouter(db: DbClient) {
  const router = new Hono<AppEnv>();

  // [Razorpay disabled — PayU-only project] The GET /webhooks/razorpay-health
  // and POST /webhooks/razorpay routes are intentionally removed. Only PayU's
  // webhook is live below. Registering a Razorpay webhook is not required for
  // this project. (See git history to restore the Razorpay webhook handler.)

  // POST /webhooks/payu — PayU's server-to-server callback (form-encoded), the
  // durable backup to the browser /payments/payu/return path. Authenticated by
  // the reverse hash; idempotent (an already-paid order is a no-op).
  router.post("/payu", async (c) => {
    const form = await c.req.parseBody();
    const params: Record<string, string> = {};
    for (const [k, v] of Object.entries(form)) params[k] = typeof v === "string" ? v : String(v);

    if (!verifyPayuResponse(params)) {
      log("warn", "payu_webhook_bad_hash", { txnid: params.txnid, request_id: c.get("requestId") });
      void alertSlack("critical", "PayU webhook hash failure", "A PayU webhook arrived with an invalid hash — possible misconfiguration or spoofing.");
      return c.json({ error: "Invalid hash" }, 401);
    }

    const txnid = params.txnid ?? "";
    const eventId = `${txnid}:${params.mihpayid ?? ""}:${params.status ?? ""}`;
    if (!(await markProcessedOnce(`payu:webhook:${eventId}`))) {
      log("info", "payu_webhook_duplicate", { txnid });
      return c.json({ ok: true }, 200);
    }

    try {
      if (params.status === "success" && txnid) {
        const [order] = await db.select().from(orders).where(eq(orders.payuTxnId, txnid)).limit(1);
        if (!order) {
          log("warn", "payu_webhook_order_not_found", { txnid });
        } else if (order.status === "pending") {
          await db
            .update(orders)
            .set({ payuPaymentId: params.mihpayid ?? null, status: "paid", updatedAt: new Date() })
            .where(eq(orders.id, order.id));
          await logOrderEvent(db, { orderId: order.id, eventType: "paid" });
          await emitOrderPaid(order.id);
          log("info", "payu_webhook_order_paid", { orderNumber: order.orderNumber });
        }
      } else if (params.status && params.status !== "success") {
        log("warn", "payu_webhook_payment_failed", { txnid, status: params.status });
        void alertSlack("warning", "PayU payment failed", "A customer payment failed.", {
          payu_txnid: txnid,
        });
      }
    } catch (err) {
      log("error", "payu_webhook_processing_error", { error: (err as Error).message });
    }

    return c.json({ ok: true }, 200);
  });

  return router;
}
