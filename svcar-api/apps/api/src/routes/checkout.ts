import crypto from "node:crypto";
import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import {
  CreateOrderRequestSchema,
  CreateOrderResponseSchema,
} from "@svcar/contracts";
import type { DbClient } from "../db/client.js";
import { addresses, cartItems, carts, orderItems, orders, settings, users } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";
import type { AppEnv } from "../lib/types.js";
import { calculatePricing } from "../lib/pricing.js";
import { orderNumberFromId } from "../lib/order-number.js";
// [Razorpay disabled — PayU-only project] The Razorpay lib + /checkout/verify
// route below are intentionally turned off; PayU confirms payment via its own
// server/browser callback (routes/payments.ts + /webhooks/payu), not a client
// verify call. Re-enable by restoring these and getPaymentProvider().
// import { createRazorpayOrder, getPublicKeyId, verifyPaymentSignature } from "../lib/razorpay.js";
// import { VerifyOrderRequestSchema } from "@svcar/contracts";
import { buildPayuRequest } from "../lib/payu.js";
import { getPaymentProvider } from "../lib/payments.js";
import { log } from "../lib/logger.js";
import { logOrderEvent } from "../lib/order-events.js";
import { backupOrder } from "../lib/order-backup.js";
import type { Context } from "hono";

/**
 * Public base URL PayU should POST its result back to. Prefer an explicit
 * API_PUBLIC_URL (set this when behind a proxy/tunnel so PayU can reach us);
 * otherwise derive it from the incoming request origin.
 */
function payuCallbackBase(c: Context): string {
  const explicit = process.env.API_PUBLIC_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  return new URL(c.req.url).origin;
}

/**
 * Build the PayU hosted-checkout handoff for an order and record its txnid on the
 * row. `attempt` makes the txnid unique across retries (PayU rejects duplicates).
 */
async function initPayuPayment(
  db: DbClient,
  c: Context,
  order: {
    id: string;
    orderNumber: string;
    total: number;
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string;
  },
  attempt = 0,
) {
  const txnid = attempt > 0 ? `${order.orderNumber}-r${attempt}` : order.orderNumber;
  const base = payuCallbackBase(c);
  const handoff = buildPayuRequest({
    txnid,
    amount: order.total.toFixed(2),
    productinfo: `Order ${order.orderNumber}`,
    firstname: order.customerName || "Customer",
    email: order.customerEmail || "",
    phone: order.customerPhone || "",
    surl: `${base}/payments/payu/return`,
    furl: `${base}/payments/payu/return`,
    udf1: order.orderNumber,
  });
  await db
    .update(orders)
    .set({ paymentProvider: "payu", payuTxnId: txnid, updatedAt: new Date() })
    .where(eq(orders.id, order.id));
  return handoff;
}

export function makeCheckoutRouter(db: DbClient) {
  const router = new Hono<AppEnv>();
  router.use("*", requireAuth);

  // POST /checkout/order — validate cart, compute totals, create Razorpay order.
  router.post("/order", async (c) => {
    const userId = c.get("userId")!;
    const parsed = CreateOrderRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json({ error: "Invalid request", issues: parsed.error.flatten() }, 400);
    }
    const body = parsed.data;

    // Order rows require customer name/phone — load the user.
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    // Load the cart with current SKU + product + primary image.
    const [cart] = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.userId, userId))
      .limit(1);
    const items = cart
      ? await db.query.cartItems.findMany({
          where: eq(cartItems.cartId, cart.id),
          orderBy: (ci, { asc }) => [asc(ci.id)],
          with: {
            sku: {
              with: {
                product: { with: { images: { orderBy: (img, { asc }) => [asc(img.sortOrder)] } } },
              },
            },
          },
        })
      : [];
    if (items.length === 0) return c.json({ error: "Cart is empty" }, 400);

    // Re-validate against the DB: fail fast if a SKU vanished (don't drop it).
    const gone = items.find((ci) => !ci.sku);
    if (gone) return c.json({ error: `SKU ${gone.skuId} is no longer available` }, 400);

    // Build lines at *current* prices (never trust the cart's reported price).
    const lines = items.map((ci) => {
      const sku = ci.sku;
      const product = sku.product;
      const unitPrice = Number(sku.salePrice ?? sku.price);
      const dv = sku.dimensionValues ?? {};
      const variantLabel = Object.keys(dv).length ? Object.values(dv).join(" / ") : null;
      return {
        skuId: ci.skuId,
        productName: product.name,
        skuCode: sku.skuCode,
        variantLabel,
        imageUrl: product.images[0]?.url ?? null,
        unitPrice,
        qty: ci.qty,
      };
    });

    // Pricing knobs come from the admin Settings (free-shipping threshold, flat
    // fee, GST rate) so checkout charges what the admin configured.
    const [settingsRow] = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
    const pricingConfig = settingsRow
      ? {
          freeShippingThreshold: Number(settingsRow.shippingFreeAbove),
          flatShippingFee: Number(settingsRow.shippingFlatFee),
          gstRate: Number(settingsRow.gstRate) / 100, // stored as a percentage
        }
      : undefined;
    const pricing = calculatePricing(
      lines.map((l) => ({ unitPrice: l.unitPrice, qty: l.qty })),
      pricingConfig,
    );

    // Resolve the shipping address (saved id → verify ownership, else inline).
    let shippingAddress;
    if (body.addressId !== undefined) {
      const [addr] = await db
        .select()
        .from(addresses)
        .where(and(eq(addresses.id, body.addressId), eq(addresses.userId, userId)))
        .limit(1);
      if (!addr) return c.json({ error: "Address not found" }, 400);
      shippingAddress = {
        fullName: addr.fullName ?? undefined,
        phone: addr.phone ?? undefined,
        label: addr.label ?? undefined,
        line1: addr.line1,
        line2: addr.line2 ?? undefined,
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        landmark: addr.landmark ?? undefined,
      };
    } else {
      shippingAddress = body.address!;
    }

    // Delivery phone comes from the shipping address (login is email-based, so
    // the user row may have no phone); fall back to any phone on the user.
    const customerPhone = shippingAddress.phone ?? user.phone ?? "";

    // Order number is hashed from the row UUID — atomic, no sequence, no volume leak.
    const orderId = crypto.randomUUID();
    const orderNumber = orderNumberFromId(orderId);

    // Persist order + items atomically.
    await db.transaction(async (tx) => {
      await tx.insert(orders).values({
        id: orderId,
        orderNumber,
        userId,
        customerName: user.name ?? "Customer",
        customerPhone,
        customerEmail: user.email,
        shippingAddress,
        subtotal: String(pricing.subtotal),
        shippingFee: String(pricing.shippingFee),
        gstAmount: String(pricing.gstAmount),
        total: String(pricing.total),
        status: "pending",
        notes: body.notes,
      });
      await tx.insert(orderItems).values(
        lines.map((l) => ({
          orderId,
          skuId: l.skuId,
          productName: l.productName,
          skuCode: l.skuCode,
          variantLabel: l.variantLabel,
          imageUrl: l.imageUrl,
          unitPrice: String(l.unitPrice),
          qty: l.qty,
          lineTotal: String(l.unitPrice * l.qty),
        })),
      );
    });

    const provider = getPaymentProvider(); // locked to "payu"
    const amountPaise = Math.round(pricing.total * 100);

    // Initialise the PayU payment outside the tx. If it fails our order stays
    // `pending` and the reconciliation cron cleans it up later.
    const payuHandoff = await initPayuPayment(db, c, {
      id: orderId,
      orderNumber,
      total: pricing.total,
      customerName: user.name,
      customerEmail: user.email,
      customerPhone,
    });
    await logOrderEvent(db, { orderId, eventType: "placed" });

    // Durable backup of the order the moment it's placed (best-effort; never
    // blocks checkout). A second snapshot is written when it's paid.
    await backupOrder(db, "created", {
      orderId,
      orderNumber,
      userId,
      customer: { name: user.name ?? "Customer", phone: customerPhone, email: user.email },
      shippingAddress,
      totals: {
        subtotal: pricing.subtotal,
        shippingFee: pricing.shippingFee,
        gstAmount: pricing.gstAmount,
        total: pricing.total,
      },
      items: lines.map((l) => ({
        skuId: l.skuId,
        productName: l.productName,
        skuCode: l.skuCode,
        variantLabel: l.variantLabel,
        qty: l.qty,
        unitPrice: l.unitPrice,
        lineTotal: l.unitPrice * l.qty,
      })),
      status: "pending",
      notes: body.notes,
      razorpayOrderId: null,
      capturedAt: new Date().toISOString(),
    });

    log("info", "checkout.order_created", {
      order_id: orderId,
      order_number: orderNumber,
      total: pricing.total,
      request_id: c.get("requestId"),
    });

    // Cart is intentionally NOT cleared here — only on payment confirmation.
    return c.json(
      CreateOrderResponseSchema.parse({
        orderId,
        orderNumber,
        provider,
        amount: amountPaise,
        currency: "INR",
        payu: payuHandoff,
      }),
    );
  });

  // [Razorpay disabled — PayU-only project] POST /checkout/verify was the
  // Razorpay modal signature-verification path. PayU confirms payment via its
  // own callbacks instead: POST /payments/payu/return (browser) and
  // POST /webhooks/payu (server-to-server). There is no client-side verify step
  // for PayU, so this route is intentionally removed. (See git history to
  // restore the Razorpay flow.)

  // POST /checkout/order/:orderNumber/pay — re-initiate payment for an existing
  // unpaid order (the customer's earlier attempt failed or was dismissed).
  // Builds a fresh PayU handoff (unique txnid) for the pending order.
  router.post("/order/:orderNumber/pay", async (c) => {
    const userId = c.get("userId")!;
    const orderNumber = c.req.param("orderNumber");

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);
    if (!order || order.userId !== userId) return c.json({ error: "Not Found" }, 404);
    if (order.status !== "pending") {
      // Already paid / shipped / cancelled — nothing to retry.
      return c.json({ error: "Order is not awaiting payment", status: order.status }, 409);
    }

    const provider = getPaymentProvider(); // locked to "payu"
    const amountPaise = Math.round(Number(order.total) * 100);

    // A fresh, unique txnid for the re-attempt (PayU rejects duplicates). Use a
    // monotonically increasing suffix based on the current epoch seconds.
    const attempt = Math.floor(Date.now() / 1000) % 100000;
    const payuHandoff = await initPayuPayment(
      db,
      c,
      {
        id: order.id,
        orderNumber: order.orderNumber,
        total: Number(order.total),
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
      },
      attempt,
    );
    return c.json(
      CreateOrderResponseSchema.parse({
        orderId: order.id,
        orderNumber: order.orderNumber,
        provider,
        payu: payuHandoff,
        amount: amountPaise,
        currency: "INR",
      }),
    );
  });

  return router;
}
