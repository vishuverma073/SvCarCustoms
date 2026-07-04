import { z } from "zod";
import { IdSchema, MoneySchema, paginated } from "./common";
import { AddressSchema } from "./address";

/**
 * Orders + Razorpay checkout. Catalog prices are GST-inclusive (the storefront
 * shows "inclusive of all taxes"), so `gstIncluded` is the tax *already inside*
 * the subtotal, surfaced for the invoice breakdown — it is NOT added on top.
 * `total = subtotal + shippingFee`.
 */

export const ORDER_STATUSES = [
  "created", // order placed, awaiting payment
  "paid", // payment captured + verified
  "shipped",
  "delivered",
  "cancelled",
  "failed", // payment failed / abandoned
] as const;
export const OrderStatusSchema = z.enum(ORDER_STATUSES);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

/** A purchased line — a price/name snapshot taken at order time. */
export const OrderItemSchema = z.object({
  skuId: IdSchema,
  name: z.string(),
  slug: z.string(),
  image: z.string(),
  variant: z.string().optional(),
  qty: z.number().int().positive(),
  price: MoneySchema, // unit price (GST-inclusive)
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

/** GST-inclusive money breakdown shown at checkout and on the invoice. */
export const OrderTotalsSchema = z.object({
  subtotal: MoneySchema, // sum of line totals (tax-inclusive)
  shippingFee: MoneySchema, // 0 when free
  gstIncluded: MoneySchema, // tax already inside subtotal (display only)
  total: MoneySchema, // subtotal + shippingFee
});
export type OrderTotals = z.infer<typeof OrderTotalsSchema>;

export const OrderSchema = z.object({
  id: IdSchema,
  orderNumber: z.string(),
  status: OrderStatusSchema,
  items: z.array(OrderItemSchema),
  totals: OrderTotalsSchema,
  address: AddressSchema,
  paymentId: z.string().nullable().default(null),
  notes: z.string().default(""),
  createdAt: z.string(), // ISO timestamp
});
export type Order = z.infer<typeof OrderSchema>;

/** Lighter shape for the orders history list. */
export const OrderListItemSchema = z.object({
  id: IdSchema,
  orderNumber: z.string(),
  status: OrderStatusSchema,
  total: MoneySchema,
  itemCount: z.number().int().nonnegative(),
  firstItemImage: z.string(),
  createdAt: z.string(),
});
export type OrderListItem = z.infer<typeof OrderListItemSchema>;

export const OrderPageSchema = paginated(OrderListItemSchema);
export type OrderPage = z.infer<typeof OrderPageSchema>;

// ── Checkout request/response ──────────────────────────────────────────────

/** POST /checkout/order — creates a pending order + a Razorpay order id. */
export const CreateOrderRequestSchema = z.object({
  addressId: IdSchema,
  notes: z.string().optional(),
});
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;

/** PayU hosted-checkout handoff: the URL + hidden form fields to POST to PayU. */
export const PayuHandoffSchema = z.object({
  paymentUrl: z.string().url(),
  params: z.record(z.string(), z.string()),
});
export type PayuHandoff = z.infer<typeof PayuHandoffSchema>;

export const CreateOrderResponseSchema = z.object({
  orderNumber: z.string(),
  provider: z.enum(["razorpay", "payu"]).default("razorpay"),
  // Razorpay handoff (present when provider === "razorpay").
  razorpayOrderId: z.string().optional(),
  razorpayKeyId: z.string().optional(),
  // PayU handoff (present when provider === "payu").
  payu: PayuHandoffSchema.optional(),
  amount: MoneySchema, // total in rupees (the modal/converter handles paise)
});
export type CreateOrderResponse = z.infer<typeof CreateOrderResponseSchema>;

/** POST /checkout/verify — confirms the Razorpay signature server-side. */
export const VerifyOrderRequestSchema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});
export type VerifyOrderRequest = z.infer<typeof VerifyOrderRequestSchema>;

export const VerifyOrderResponseSchema = z.object({
  order: OrderSchema,
});
export type VerifyOrderResponse = z.infer<typeof VerifyOrderResponseSchema>;

/** One step in an order's tracking timeline. */
export const OrderEventSchema = z.object({
  status: OrderStatusSchema,
  at: z.string(), // ISO timestamp
  note: z.string().optional(),
});
export type OrderEvent = z.infer<typeof OrderEventSchema>;

export const OrderEventsSchema = z.array(OrderEventSchema);

