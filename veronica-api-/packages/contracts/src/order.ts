import { z } from "zod";

/**
 * Order lifecycle states. Detailed order request/response schemas
 * (line items, totals, addresses) are added in Phase 4 (Razorpay checkout).
 */
export const OrderStatusSchema = z.enum([
  "pending",
  "paid",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;
