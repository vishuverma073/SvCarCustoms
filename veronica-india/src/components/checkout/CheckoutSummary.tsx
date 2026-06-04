"use client";

import { formatPrice } from "@/lib/utils";
import { amountToFreeShipping, type PricingSettings } from "@/lib/checkout";
import type { OrderTotals } from "@veronica/contracts";

/** Read-only GST-inclusive money breakdown (subtotal · shipping · GST note · total). */
export default function CheckoutSummary({
  totals,
  settings,
}: {
  totals: OrderTotals;
  settings?: PricingSettings;
}) {
  const toFree = amountToFreeShipping(totals.subtotal, settings);
  const gstPct = settings?.gstRate ?? 18;

  return (
    <div className="space-y-2.5 text-sm">
      <div className="flex justify-between">
        <span className="text-text-secondary">Subtotal</span>
        <span className="font-semibold">{formatPrice(totals.subtotal)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-text-secondary">Delivery</span>
        <span className={`font-semibold ${totals.shippingFee === 0 ? "text-success" : ""}`}>
          {totals.shippingFee === 0 ? "Free" : formatPrice(totals.shippingFee)}
        </span>
      </div>
      <div className="flex justify-between text-[12px] text-text-muted">
        <span>Incl. GST ({gstPct}%)</span>
        <span>{formatPrice(totals.gstIncluded)}</span>
      </div>
      <div className="border-t border-border-light pt-2.5 mt-2.5 flex justify-between items-baseline">
        <span className="font-bold text-base">Total</span>
        <span className="font-extrabold text-lg text-text-primary">{formatPrice(totals.total)}</span>
      </div>

      {toFree > 0 && (
        <p className="text-xs text-text-muted mt-1 bg-brand-orange-light px-3 py-2 rounded-lg">
          💡 Add {formatPrice(toFree)} more for{" "}
          <span className="font-semibold text-brand-orange">free delivery</span>!
        </p>
      )}
    </div>
  );
}
