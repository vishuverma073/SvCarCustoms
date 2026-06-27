import { http, HttpResponse } from "msw";
import { API_BASE } from "@/lib/api-config";
import {
  AddressInputSchema,
  AddressUpdateSchema,
  CreateOrderRequestSchema,
  VerifyOrderRequestSchema,
  type Address,
  type Order,
  type OrderItem,
  type OrderListItem,
} from "@svcar/contracts";
import { computeTotals } from "@/lib/checkout";
import { generateOrderNumber } from "@/lib/utils";
import { MOCK_USER_TOKEN, getCurrentUser, serverCart } from "../data/account";
import { PINCODES } from "../data/pincodes";
import {
  nextAddressId,
  nextOrderId,
  getAddresses,
  setAddresses,
  getOrders,
  addOrder,
  findOrder,
  updateOrder,
  putPending,
  takePending,
} from "../data/orders";

let retrySeq = 0;

const A = API_BASE;

/** Resolve the signed-in mock user, or null. */
function requireUser(request: Request) {
  if (request.headers.get("Authorization") !== `Bearer ${MOCK_USER_TOKEN}`) return null;
  return getCurrentUser();
}
const unauthorized = () => HttpResponse.json({ error: "unauthorized" }, { status: 401 });
const bad = () => HttpResponse.json({ error: "bad_request" }, { status: 400 });

/** Apply default-address bookkeeping: exactly one default when any exist. */
function normalizeDefaults(list: Address[], preferId?: number): Address[] {
  if (list.length === 0) return list;
  const hasPreferred = preferId != null && list.some((a) => a.id === preferId);
  const target = hasPreferred ? preferId : list.some((a) => a.isDefault) ? undefined : list[0].id;
  if (target == null) return list; // an existing default stands
  return list.map((a) => ({ ...a, isDefault: a.id === target }));
}

function toListItem(o: Order): OrderListItem {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    total: o.totals.total,
    itemCount: o.items.reduce((n, i) => n + i.qty, 0),
    firstItemImage: o.items[0]?.image ?? "",
    createdAt: o.createdAt,
  };
}

export const checkoutHandlers = [
  // ── Addresses ──
  http.get(`${A}/me/addresses`, ({ request }) => {
    const user = requireUser(request);
    if (!user) return unauthorized();
    return HttpResponse.json(getAddresses(user.id));
  }),

  http.post(`${A}/me/addresses`, async ({ request }) => {
    const user = requireUser(request);
    if (!user) return unauthorized();
    const parsed = AddressInputSchema.safeParse(await request.json());
    if (!parsed.success) return bad();
    const current = getAddresses(user.id);
    const address: Address = { ...parsed.data, id: nextAddressId() };
    // First address is always default; an explicit isDefault wins otherwise.
    const wantsDefault = current.length === 0 || parsed.data.isDefault;
    let next = [...current, address];
    next = normalizeDefaults(next, wantsDefault ? address.id : undefined);
    setAddresses(user.id, next);
    return HttpResponse.json(next.find((a) => a.id === address.id), { status: 201 });
  }),

  http.patch(`${A}/me/addresses/:id`, async ({ request, params }) => {
    const user = requireUser(request);
    if (!user) return unauthorized();
    const parsed = AddressUpdateSchema.safeParse(await request.json());
    if (!parsed.success) return bad();
    const id = Number(params.id);
    const current = getAddresses(user.id);
    if (!current.some((a) => a.id === id)) {
      return HttpResponse.json({ error: "not_found" }, { status: 404 });
    }
    let next = current.map((a) => (a.id === id ? { ...a, ...parsed.data } : a));
    next = normalizeDefaults(next, parsed.data.isDefault ? id : undefined);
    setAddresses(user.id, next);
    return HttpResponse.json(next.find((a) => a.id === id));
  }),

  http.delete(`${A}/me/addresses/:id`, ({ request, params }) => {
    const user = requireUser(request);
    if (!user) return unauthorized();
    const id = Number(params.id);
    let next = getAddresses(user.id).filter((a) => a.id !== id);
    next = normalizeDefaults(next); // promote a new default if we removed it
    setAddresses(user.id, next);
    return HttpResponse.json({ ok: true });
  }),

  // ── Checkout: create a pending order + Razorpay order id ──
  http.post(`${A}/checkout/order`, async ({ request }) => {
    const user = requireUser(request);
    if (!user) return unauthorized();
    const parsed = CreateOrderRequestSchema.safeParse(await request.json());
    if (!parsed.success) return bad();

    const address = getAddresses(user.id).find((a) => a.id === parsed.data.addressId);
    if (!address) return HttpResponse.json({ error: "address_not_found" }, { status: 422 });
    if (serverCart.length === 0) {
      return HttpResponse.json({ error: "cart_empty" }, { status: 422 });
    }

    const items: OrderItem[] = serverCart.map((i) => ({
      skuId: i.skuId,
      name: i.name,
      slug: i.slug,
      image: i.image,
      variant: i.variant,
      qty: i.qty,
      price: i.price,
    }));
    const totals = computeTotals(items);
    const orderNumber = generateOrderNumber();
    const razorpayOrderId = `order_${orderNumber}`;

    const order: Order = {
      id: nextOrderId(),
      orderNumber,
      status: "created",
      items,
      totals,
      address,
      paymentId: null,
      notes: parsed.data.notes ?? "",
      createdAt: new Date().toISOString(),
    };
    // Persist the order right away (status "created") so a checkout the customer
    // started but didn't pay for still appears in their history and can be
    // retried — mirroring the real backend, which inserts the pending order row
    // at creation. `putPending` maps the Razorpay id → order for verify.
    addOrder(user.id, order);
    putPending(razorpayOrderId, user.id, order);

    return HttpResponse.json({
      orderNumber,
      razorpayOrderId,
      razorpayKeyId: "rzp_test_mockkey",
      // The real API (and Razorpay) work in paise; the client divides by 100.
      amount: Math.round(totals.total * 100),
    });
  }),

  // ── Checkout: verify payment → mark paid, persist order, clear cart ──
  http.post(`${A}/checkout/verify`, async ({ request }) => {
    const user = requireUser(request);
    if (!user) return unauthorized();
    const parsed = VerifyOrderRequestSchema.safeParse(await request.json());
    if (!parsed.success) return bad();

    const pending = takePending(parsed.data.razorpayOrderId);
    if (!pending || pending.userId !== user.id) {
      return HttpResponse.json({ error: "order_not_found" }, { status: 404 });
    }
    const orderNumber = pending.order.orderNumber;
    // Mark the existing order paid in place (it was persisted at creation), or
    // add it if somehow missing. No duplicate row.
    const updated = updateOrder(user.id, orderNumber, {
      status: "paid",
      paymentId: parsed.data.razorpayPaymentId,
    });
    if (!updated) {
      addOrder(user.id, { ...pending.order, status: "paid", paymentId: parsed.data.razorpayPaymentId });
    }
    serverCart.length = 0; // order placed → empty the cart
    // The real API responds { ok, orderNumber }; the client routes on that.
    return HttpResponse.json({ ok: true, orderNumber });
  }),

  // ── Retry payment for an existing unpaid order ──
  http.post(`${A}/checkout/order/:orderNumber/pay`, ({ request, params }) => {
    const user = requireUser(request);
    if (!user) return unauthorized();
    const order = findOrder(user.id, String(params.orderNumber));
    if (!order) return HttpResponse.json({ error: "not_found" }, { status: 404 });
    if (order.status !== "created") {
      // Already paid / shipped / cancelled — nothing to retry.
      return HttpResponse.json({ error: "not_payable", status: order.status }, { status: 409 });
    }
    // Fresh Razorpay order id for the re-attempt; park it for verify.
    const razorpayOrderId = `order_${order.orderNumber}_retry${++retrySeq}`;
    putPending(razorpayOrderId, user.id, order);
    return HttpResponse.json({
      orderNumber: order.orderNumber,
      razorpayOrderId,
      razorpayKeyId: "rzp_test_mockkey",
      amount: Math.round(order.totals.total * 100),
    });
  }),

  // ── Order history (cursor-paginated, newest first) ──
  http.get(`${A}/me/orders`, ({ request }) => {
    const user = requireUser(request);
    if (!user) return unauthorized();
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 10);
    const cursor = url.searchParams.get("cursor");

    const all = getOrders(user.id); // already newest-first
    const start = cursor ? all.findIndex((o) => o.id === Number(cursor)) + 1 : 0;
    const page = all.slice(start, start + limit);
    const nextCursor = start + limit < all.length ? page[page.length - 1].id : null;
    return HttpResponse.json({ items: page.map(toListItem), nextCursor });
  }),

  http.get(`${A}/me/orders/:orderNumber`, ({ request, params }) => {
    const user = requireUser(request);
    if (!user) return unauthorized();
    const order = findOrder(user.id, String(params.orderNumber));
    return order
      ? HttpResponse.json(order)
      : HttpResponse.json({ error: "not_found" }, { status: 404 });
  }),

  // ── Order tracking timeline ──
  http.get(`${A}/me/orders/:orderNumber/events`, ({ request, params }) => {
    const user = requireUser(request);
    if (!user) return unauthorized();
    const order = findOrder(user.id, String(params.orderNumber));
    if (!order) return HttpResponse.json({ error: "not_found" }, { status: 404 });

    // Derive a timeline from the order's lifecycle, in the real backend's wire
    // shape: { events: [{ eventType, note, createdAt }] }. The client maps the
    // backend `eventType` ("placed", "paid", …) to a storefront status.
    const placedAt = order.createdAt;
    const events: { eventType: string; note: string | null; createdAt: string }[] = [
      { eventType: "placed", note: "We’ve received your order.", createdAt: placedAt },
    ];
    if (["paid", "shipped", "delivered"].includes(order.status)) {
      events.push({
        eventType: "paid",
        note: "Payment confirmed.",
        createdAt: new Date(new Date(placedAt).getTime() + 60_000).toISOString(),
      });
    }
    if (["shipped", "delivered"].includes(order.status)) {
      events.push({ eventType: "shipped", note: "Your order is on its way.", createdAt: placedAt });
    }
    if (order.status === "delivered") {
      events.push({ eventType: "delivered", note: "Delivered.", createdAt: placedAt });
    }
    if (order.status === "cancelled") {
      events.push({ eventType: "cancelled", note: null, createdAt: placedAt });
    }
    return HttpResponse.json({ events });
  }),

  // ── Pincode autofill (public) ──
  http.get(`${A}/pincode/:pincode`, ({ params }) => {
    const pincode = String(params.pincode);
    const hit = PINCODES[pincode];
    return hit
      ? HttpResponse.json({ pincode, ...hit })
      : HttpResponse.json({ error: "not_found" }, { status: 404 });
  }),
];
