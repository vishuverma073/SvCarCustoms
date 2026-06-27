import { describe, expect, it } from "vitest";
import {
  computeSubtotal,
  shippingFeeFor,
  gstIncludedIn,
  computeTotals,
  amountToFreeShipping,
  FREE_SHIPPING_THRESHOLD,
  FLAT_SHIPPING_FEE,
} from "@/lib/checkout";

describe("checkout money rules (GST-inclusive)", () => {
  it("sums line totals", () => {
    expect(computeSubtotal([{ price: 1200, qty: 2 }, { price: 500, qty: 1 }])).toBe(2900);
  });

  it("charges flat shipping below the threshold, free at/above", () => {
    expect(shippingFeeFor(FREE_SHIPPING_THRESHOLD - 1)).toBe(FLAT_SHIPPING_FEE);
    expect(shippingFeeFor(FREE_SHIPPING_THRESHOLD)).toBe(0);
    expect(shippingFeeFor(8000)).toBe(0);
  });

  it("treats an empty cart as free shipping", () => {
    expect(shippingFeeFor(0)).toBe(0);
  });

  it("extracts the GST already inside an inclusive price", () => {
    // 18% inclusive: tax portion of ₹1180 is ₹180.
    expect(gstIncludedIn(1180)).toBe(180);
  });

  it("does NOT add GST on top — total = subtotal + shipping", () => {
    const totals = computeTotals([{ price: 1180, qty: 1 }]);
    expect(totals.subtotal).toBe(1180);
    expect(totals.shippingFee).toBe(FLAT_SHIPPING_FEE);
    expect(totals.gstIncluded).toBe(180);
    expect(totals.total).toBe(1180 + FLAT_SHIPPING_FEE);
  });

  it("free shipping above threshold yields total = subtotal", () => {
    const totals = computeTotals([{ price: 6000, qty: 1 }]);
    expect(totals.shippingFee).toBe(0);
    expect(totals.total).toBe(6000);
  });

  it("reports the gap to free shipping", () => {
    expect(amountToFreeShipping(4000)).toBe(FREE_SHIPPING_THRESHOLD - 4000);
    expect(amountToFreeShipping(5000)).toBe(0);
  });
});
