import type { OrderTotals } from "@svcar/contracts";

/**
 * Order-money rules — the single source of truth shared by the cart page, the
 * checkout summary, and the mock checkout handler so the number the customer
 * sees can never drift from what the "server" charges.
 *
 * Catalog prices are GST-INCLUSIVE (the storefront states "inclusive of all
 * taxes"). So GST is the tax already baked into the subtotal — surfaced for the
 * invoice breakdown, never added on top. `total = subtotal + shippingFee`.
 */
export const FREE_SHIPPING_THRESHOLD = 5000; // ₹ — fallback free-delivery threshold
export const FLAT_SHIPPING_FEE = 99; // ₹ — fallback flat fee below the threshold
export const GST_RATE = 0.18; // 18% GST, already inside the price (fallback)

/**
 * Live pricing knobs from the admin Settings (via the public /settings API).
 * `gstRate` here is a PERCENTAGE (e.g. 18), matching the settings field. All
 * functions fall back to the constants above when settings aren't loaded yet.
 */
export interface PricingSettings {
  shippingFreeAbove: number;
  shippingFlatFee: number;
  gstRate: number; // percentage
}

function freeAbove(s?: PricingSettings) {
  return s?.shippingFreeAbove ?? FREE_SHIPPING_THRESHOLD;
}
function flatFee(s?: PricingSettings) {
  return s?.shippingFlatFee ?? FLAT_SHIPPING_FEE;
}
function gstFraction(s?: PricingSettings) {
  return s?.gstRate != null ? s.gstRate / 100 : GST_RATE;
}

export interface PricedLine {
  price: number;
  qty: number;
}

export function computeSubtotal(lines: PricedLine[]): number {
  return lines.reduce((sum, l) => sum + l.price * l.qty, 0);
}

export function shippingFeeFor(subtotal: number, s?: PricingSettings): number {
  return subtotal >= freeAbove(s) || subtotal === 0 ? 0 : flatFee(s);
}

/** Tax portion already contained in a GST-inclusive amount. */
export function gstIncludedIn(amount: number, s?: PricingSettings): number {
  const rate = gstFraction(s);
  return Math.round(amount - amount / (1 + rate));
}

/** Full GST-inclusive breakdown for a set of priced lines. */
export function computeTotals(lines: PricedLine[], s?: PricingSettings): OrderTotals {
  const subtotal = computeSubtotal(lines);
  const shippingFee = shippingFeeFor(subtotal, s);
  return {
    subtotal,
    shippingFee,
    gstIncluded: gstIncludedIn(subtotal, s),
    total: subtotal + shippingFee,
  };
}

/** Amount short of free shipping, or 0 once the threshold is met. */
export function amountToFreeShipping(subtotal: number, s?: PricingSettings): number {
  return subtotal >= freeAbove(s) ? 0 : freeAbove(s) - subtotal;
}
