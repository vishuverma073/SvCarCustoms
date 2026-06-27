import type { Address, Order } from "@svcar/contracts";

/**
 * Mock checkout state: saved addresses and placed orders, keyed by user id so
 * they persist across a logout/login of the same user yet never leak between
 * users. Pending (unpaid) orders are parked by their Razorpay order id until
 * `/checkout/verify` confirms payment.
 */

const addressesByUser = new Map<string, Address[]>();
const ordersByUser = new Map<string, Order[]>();
const pendingByRzpId = new Map<string, { order: Order; userId: string }>();

let addressSeq = 5000;
let orderSeq = 9000;
export const nextAddressId = () => ++addressSeq;
export const nextOrderId = () => ++orderSeq;

// ── Addresses ──
export function getAddresses(userId: string): Address[] {
  return addressesByUser.get(userId) ?? [];
}
export function setAddresses(userId: string, list: Address[]) {
  addressesByUser.set(userId, list);
}

// ── Orders ──
export function getOrders(userId: string): Order[] {
  return ordersByUser.get(userId) ?? [];
}
export function addOrder(userId: string, order: Order) {
  ordersByUser.set(userId, [order, ...getOrders(userId)]);
}
export function findOrder(userId: string, orderNumber: string): Order | undefined {
  return getOrders(userId).find((o) => o.orderNumber === orderNumber);
}
/** Mutate an existing order in place (e.g. created → paid on verify). */
export function updateOrder(
  userId: string,
  orderNumber: string,
  patch: Partial<Order>,
): Order | undefined {
  const list = getOrders(userId);
  const idx = list.findIndex((o) => o.orderNumber === orderNumber);
  if (idx === -1) return undefined;
  list[idx] = { ...list[idx], ...patch };
  ordersByUser.set(userId, list);
  return list[idx];
}

// ── Pending (awaiting payment) ──
export function putPending(rzpId: string, userId: string, order: Order) {
  pendingByRzpId.set(rzpId, { order, userId });
}
export function takePending(rzpId: string) {
  const p = pendingByRzpId.get(rzpId);
  if (p) pendingByRzpId.delete(rzpId);
  return p;
}

/** Test-only: wipe all checkout state so suites start from a clean slate. */
export function __resetCheckoutState() {
  addressesByUser.clear();
  ordersByUser.clear();
  pendingByRzpId.clear();
}
