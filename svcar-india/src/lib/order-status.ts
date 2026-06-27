import type { OrderStatus } from "@svcar/contracts";

/** Human label for an order status. */
export function statusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    created: "Pending payment",
    paid: "Arriving", // payment completed — order is on its way
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    failed: "Payment failed",
  };
  return labels[status];
}

/** Tailwind classes for the status badge (bg + text). */
export function statusBadgeClass(status: OrderStatus): string {
  const styles: Record<OrderStatus, string> = {
    created: "bg-amber-100 text-amber-700",
    paid: "bg-blue-100 text-blue-700",
    shipped: "bg-blue-100 text-blue-700",
    delivered: "bg-success/10 text-success",
    cancelled: "bg-red-100 text-red-600",
    failed: "bg-red-100 text-red-600",
  };
  return styles[status];
}
