import type { Product, ProductSKU } from "@svcar/contracts";

/**
 * Pure pricing / SKU-selection helpers that operate on a full {@link Product}.
 *
 * These were lifted verbatim out of the retired in-memory `lib/data.ts` so the
 * PDP (and any other client view) can compute display pricing and resolve the
 * selected SKU without recomputing from the backend. Pure functions — no I/O.
 */

/** Cheapest sale price (or price when no sale) across all SKUs. */
export function getMinPrice(product: Product): number {
  if (product.skus.length === 0) return 0;
  return Math.min(...product.skus.map((s) => s.salePrice ?? s.price));
}

/** Highest base price (used as the strikethrough "MRP"). */
export function getMaxBasePrice(product: Product): number {
  if (product.skus.length === 0) return 0;
  return Math.max(...product.skus.map((s) => s.price));
}

/** Min/max of the effective (sale-aware) prices. */
export function getPriceRange(product: Product): { min: number; max: number } {
  const prices = product.skus.map((s) => s.salePrice ?? s.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/** Best discount percentage across all SKUs (0 when nothing is on sale). */
export function getBestDiscount(product: Product): number {
  if (product.skus.length === 0) return 0;
  const discounts = product.skus
    .filter((s) => s.salePrice !== null && s.salePrice < s.price)
    .map((s) => Math.round(((s.price - s.salePrice!) / s.price) * 100));
  return discounts.length > 0 ? Math.max(...discounts) : 0;
}

/** Find the SKU matching a full set of dimension selections. */
export function getSKUBySelections(
  product: Product,
  selections: Record<string, string>,
): ProductSKU | undefined {
  return product.skus.find((sku) =>
    Object.entries(selections).every(
      ([dimName, dimValue]) => sku.dimensionValues[dimName] === dimValue,
    ),
  );
}

/**
 * Values still available for `dimensionName` given the selections on the other
 * dimensions — powers cascading variant selectors.
 */
export function getAvailableValues(
  product: Product,
  dimensionName: string,
  currentSelections: Record<string, string>,
): string[] {
  const otherSelections = Object.entries(currentSelections).filter(
    ([key]) => key !== dimensionName,
  );
  const matchingSKUs = product.skus.filter((sku) =>
    otherSelections.every(([dimName, dimValue]) => sku.dimensionValues[dimName] === dimValue),
  );
  const values = new Set(matchingSKUs.map((sku) => sku.dimensionValues[dimensionName]));
  return Array.from(values).filter(Boolean);
}
