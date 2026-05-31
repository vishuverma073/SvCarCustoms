import { ShoppingCart } from "lucide-react";

/** Orders management lands in a later phase — endpoint is stubbed in MSW. */
export default function OrdersPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-text-primary mb-5">Orders</h1>
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-surface-dim flex items-center justify-center">
          <ShoppingCart className="text-text-muted" />
        </div>
        <p className="text-text-secondary font-medium">Orders are coming in a later phase</p>
        <p className="text-sm text-text-muted max-w-xs">
          The storefront is read-only for now. Checkout routes through WhatsApp, so there are no
          on-platform orders to manage yet.
        </p>
      </div>
    </div>
  );
}
