import { Hono } from "hono";
import { and, asc, desc, eq, gte, or, sql } from "drizzle-orm";
import {
  AddOrderEventRequestSchema,
  OrderEventListResponseSchema,
  type OrderStatus,
} from "@svcar/contracts";
import type { DbClient } from "../../db/client.js";
import { orderEvents, orders } from "../../db/schema.js";
import { makeRequireAdmin } from "../../middleware/auth.js";
import { logAudit } from "../../lib/audit.js";
import type { AppEnv } from "../../lib/types.js";

/** Date-range presets shared by the order list filter and the stats tiles. */
const RANGE_DAYS: Record<string, number | null> = {
  today: 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "12m": 365,
  all: null,
};
function rangeStart(range: string | undefined): Date {
  const d = RANGE_DAYS[range ?? "12m"] ?? 365;
  return d == null ? new Date(0) : new Date(Date.now() - d * 86400000);
}

/** Event types that are also order statuses — posting one advances the order. */
const STATUS_EVENTS: ReadonlySet<string> = new Set<OrderStatus>([
  "paid",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

/**
 * Admin order management.
 *
 * The list is still a Phase 4 stub; Phase 6 adds the tracking timeline so admins
 * can push manual shipping updates ("Out for delivery via Bluedart, AWB#…").
 */
export function makeAdminOrdersRouter(db: DbClient) {
  const router = new Hono<AppEnv>();
  router.use("*", makeRequireAdmin(db));

  // GET /admin/orders?status= — newest-first order list for the admin table.
  // Optional ?status filters to a single order status.
  router.get("/", async (c) => {
    const status = c.req.query("status") as OrderStatus | undefined;
    const q = c.req.query("q")?.trim();
    const range = c.req.query("range");
    const conditions = [];
    if (status) conditions.push(eq(orders.status, status));
    if (range && range !== "all") conditions.push(gte(orders.createdAt, rangeStart(range)));
    if (q) {
      conditions.push(
        or(
          sql`${orders.orderNumber} ILIKE ${`%${q}%`}`,
          sql`${orders.customerPhone} ILIKE ${`%${q}%`}`,
          sql`${orders.customerName} ILIKE ${`%${q}%`}`,
        ),
      );
    }
    const where = conditions.length ? and(...conditions) : undefined;

    const rows = await db.query.orders.findMany({
      where,
      orderBy: [desc(orders.createdAt)],
      limit: 200,
      with: { items: { columns: { qty: true } } },
    });
    return c.json({
      items: rows.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        total: Number(o.total),
        status: o.status,
        itemCount: o.items.reduce((s, it) => s + it.qty, 0),
        createdAt: o.createdAt.toISOString(),
      })),
      nextCursor: null,
    });
  });

  // GET /admin/orders/:id — full order detail for the admin order view.
  // GET /admin/orders/stats?range= — dashboard tiles + per-status counts.
  router.get("/stats", async (c) => {
    const range = c.req.query("range") ?? "12m";
    const start = rangeStart(range);
    // db.execute needs an ISO string cast to timestamptz (a JS Date serializes
    // via toString() and Postgres can't parse it).
    const raw = await db.execute(sql`
      select status, count(*)::int cnt, coalesce(sum(total),0) revenue
      from orders where created_at >= ${start.toISOString()}::timestamptz group by status`);
    const rows = (Array.isArray(raw) ? raw : (raw as { rows?: unknown[] }).rows ?? []) as {
      status: string;
      cnt: number;
      revenue: string;
    }[];
    const statusCounts: Record<string, number> = {};
    let totalOrders = 0;
    let totalRevenue = 0;
    let pendingOrders = 0;
    let completedOrders = 0;
    for (const r of rows) {
      const cnt = Number(r.cnt);
      statusCounts[r.status] = cnt;
      totalOrders += cnt;
      if (r.status !== "cancelled" && r.status !== "refunded") totalRevenue += Number(r.revenue);
      if (["pending", "paid", "confirmed", "shipped"].includes(r.status)) pendingOrders += cnt;
      if (r.status === "delivered") completedOrders += cnt;
    }
    return c.json({ range, totalOrders, totalRevenue, pendingOrders, completedOrders, statusCounts });
  });

  router.get("/:id", async (c) => {
    const id = c.req.param("id");
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: { items: { orderBy: (oi, { asc }) => [asc(oi.id)] } },
    });
    if (!order) return c.json({ error: "Not Found" }, 404);
    return c.json({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      shippingAddress: order.shippingAddress,
      subtotal: Number(order.subtotal),
      shippingFee: Number(order.shippingFee),
      gstAmount: Number(order.gstAmount),
      total: Number(order.total),
      razorpayPaymentId: order.razorpayPaymentId,
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((it) => ({
        productName: it.productName,
        skuCode: it.skuCode,
        variantLabel: it.variantLabel,
        imageUrl: it.imageUrl,
        unitPrice: Number(it.unitPrice),
        qty: it.qty,
        lineTotal: Number(it.lineTotal),
      })),
    });
  });

  // GET /admin/orders/:id/events — full timeline for the admin order view.
  router.get("/:id/events", async (c) => {
    const id = c.req.param("id");
    const events = await db
      .select({
        id: orderEvents.id,
        eventType: orderEvents.eventType,
        note: orderEvents.note,
        createdAt: orderEvents.createdAt,
      })
      .from(orderEvents)
      .where(eq(orderEvents.orderId, id))
      .orderBy(asc(orderEvents.createdAt));

    return c.json(
      OrderEventListResponseSchema.parse({
        events: events.map((e) => ({
          id: e.id,
          eventType: e.eventType,
          note: e.note,
          createdAt: e.createdAt.toISOString(),
        })),
      }),
    );
  });

  // POST /admin/orders/:id/events — append a tracking event (and advance the
  // order status when the event maps to one).
  router.post("/:id/events", async (c) => {
    const id = c.req.param("id");
    const raw = await c.req.json().catch(() => null);
    const parsed = AddOrderEventRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return c.json({ error: "Invalid request", issues: parsed.error.flatten() }, 400);
    }
    const { eventType, note } = parsed.data;

    // Optional custom timestamp: the admin can backdate/forward-date when a step
    // actually happened, instead of "now". Ignored if missing/invalid.
    let occurredAt: Date | undefined;
    const rawAt = (raw as { occurredAt?: unknown } | null)?.occurredAt;
    if (typeof rawAt === "string") {
      const d = new Date(rawAt);
      if (!Number.isNaN(d.getTime())) occurredAt = d;
    }

    const [order] = await db.select({ id: orders.id }).from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) return c.json({ error: "Not Found" }, 404);

    const adminUserId = c.get("adminUserId") ?? null;
    const [event] = await db
      .insert(orderEvents)
      .values({
        orderId: id,
        eventType,
        note: note ?? null,
        createdBy: adminUserId,
        ...(occurredAt ? { createdAt: occurredAt } : {}),
      })
      .returning();

    // Advance the order's status when the event is a status transition.
    if (STATUS_EVENTS.has(eventType)) {
      await db
        .update(orders)
        .set({ status: eventType as OrderStatus, updatedAt: new Date() })
        .where(eq(orders.id, id));
    }

    await logAudit(db, {
      actorUserId: adminUserId,
      action: "order.event.add",
      resourceType: "order",
      resourceId: id,
      changes: { after: { eventType, note: note ?? null } },
    });

    return c.json(
      {
        id: event!.id,
        eventType: event!.eventType,
        note: event!.note,
        createdAt: event!.createdAt.toISOString(),
      },
      201,
    );
  });

  return router;
}
