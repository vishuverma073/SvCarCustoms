import { Hono } from "hono";
import { desc, gte, sql } from "drizzle-orm";
import type { DbClient } from "../../db/client.js";
import { carts, subscribers, whatsappLeads } from "../../db/schema.js";
import { makeRequireAdmin } from "../../middleware/auth.js";
import type { AppEnv } from "../../lib/types.js";

/**
 * Admin engagement endpoints: Leads (customer carts), Live (recently-active
 * shoppers) and Subscribers (newsletter). Leads/Live read real signed-in
 * customer carts; true realtime presence (heartbeat/WebSocket) isn't wired yet,
 * so "Live" approximates presence with carts touched in the last few minutes.
 */

async function fetchActiveCarts(db: DbClient, sinceMs?: number) {
  const rows = await db.query.carts.findMany({
    where: sinceMs ? gte(carts.updatedAt, new Date(Date.now() - sinceMs)) : undefined,
    with: {
      user: true,
      items: {
        orderBy: (ci, { asc }) => [asc(ci.addedAt)],
        with: {
          sku: {
            with: {
              product: {
                with: { images: { orderBy: (img, { asc }) => [asc(img.sortOrder)] } },
              },
            },
          },
        },
      },
    },
    orderBy: (c, { desc: d }) => [d(c.updatedAt)],
  });
  return rows.filter((c) => c.items.length > 0);
}

type ActiveCart = Awaited<ReturnType<typeof fetchActiveCarts>>[number];

function toLead(cart: ActiveCart) {
  const items = cart.items.map((ci) => {
    const sku = ci.sku;
    const product = sku.product;
    const unitPrice = Number(sku.salePrice ?? sku.price);
    const dv = sku.dimensionValues ?? {};
    const variantLabel = Object.keys(dv).length ? Object.values(dv).join(" / ") : "";
    return {
      productId: product.id,
      productName: product.name,
      slug: product.slug,
      image: product.images[0]?.url ?? "",
      variantLabel,
      qty: ci.qty,
      unitPrice,
      lineTotal: unitPrice * ci.qty,
      addedAt: ci.addedAt.toISOString(),
    };
  });
  const total = items.reduce((s, i) => s + i.lineTotal, 0);
  const itemCount = items.reduce((s, i) => s + i.qty, 0);
  const oldestAddedAt = items.reduce(
    (min, i) => (i.addedAt < min ? i.addedAt : min),
    cart.updatedAt.toISOString(),
  );
  return {
    id: cart.id,
    customerName: cart.user?.name ?? "",
    customerEmail: cart.user?.email ?? "",
    customerPhone: cart.user?.phone ?? "",
    isGuest: false,
    itemCount,
    total,
    updatedAt: cart.updatedAt.toISOString(),
    oldestAddedAt,
    items,
  };
}

/** GET /admin/leads — every signed-in customer's current cart. */
export function makeAdminLeadsRouter(db: DbClient) {
  const router = new Hono<AppEnv>();
  router.use("*", makeRequireAdmin(db));
  router.get("/", async (c) => {
    const list = (await fetchActiveCarts(db)).map(toLead);
    return c.json({
      items: list,
      total: list.length,
      totalValue: list.reduce((s, l) => s + l.total, 0),
    });
  });
  return router;
}

/** GET /admin/live — shoppers with carts touched in the last 20 minutes. */
export function makeAdminLiveRouter(db: DbClient) {
  const router = new Hono<AppEnv>();
  router.use("*", makeRequireAdmin(db));
  router.get("/", async (c) => {
    const items = (await fetchActiveCarts(db, 20 * 60 * 1000)).map((cart) => {
      const lead = toLead(cart);
      return {
        id: lead.id,
        customerName: lead.customerName,
        customerEmail: lead.customerEmail,
        customerPhone: lead.customerPhone,
        isGuest: lead.isGuest,
        currentPath: "",
        startedAt: lead.oldestAddedAt,
        lastSeen: lead.updatedAt,
        itemCount: lead.itemCount,
        total: lead.total,
        items: lead.items,
      };
    });
    return c.json({ items, onlineCount: items.length });
  });
  return router;
}

/** GET /admin/whatsapp-leads — WhatsApp CTA intent clicks, newest first. */
export function makeAdminWhatsappLeadsRouter(db: DbClient) {
  const router = new Hono<AppEnv>();
  router.use("*", makeRequireAdmin(db));
  router.get("/", async (c) => {
    const rows = await db
      .select()
      .from(whatsappLeads)
      .orderBy(desc(whatsappLeads.createdAt))
      .limit(200);
    const [{ count } = { count: 0 }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(whatsappLeads);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const items = rows.map((r) => ({
      id: r.id,
      path: r.path,
      source: r.source,
      productId: r.productId ?? null,
      productName: r.productName ?? "",
      city: r.city ?? "",
      country: r.country ?? "",
      createdAt: r.createdAt.toISOString(),
    }));
    return c.json({
      items,
      total: Number(count),
      todayCount: items.filter((i) => new Date(i.createdAt) >= dayAgo).length,
    });
  });
  return router;
}

/** GET /admin/subscribers — newsletter signups. */
export function makeAdminSubscribersRouter(db: DbClient) {
  const router = new Hono<AppEnv>();
  router.use("*", makeRequireAdmin(db));
  router.get("/", async (c) => {
    const rows = await db.select().from(subscribers).orderBy(desc(subscribers.subscribedAt));
    const items = rows.map((s) => ({
      id: s.id,
      email: s.email,
      name: s.name ?? "",
      phone: s.phone ?? "",
      source: s.source,
      status: s.status === "unsubscribed" ? "unsubscribed" : "active",
      subscribedAt: s.subscribedAt.toISOString(),
    }));
    return c.json({
      items,
      total: items.length,
      activeCount: items.filter((s) => s.status === "active").length,
    });
  });
  return router;
}
