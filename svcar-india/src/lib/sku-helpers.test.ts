import { describe, it, expect } from "vitest";
import {
  getMinPrice,
  getMaxBasePrice,
  getBestDiscount,
  getSKUBySelections,
  getAvailableValues,
} from "./sku-helpers";
import type { Product } from "@svcar/contracts";

// Minimal product with a 2×2 SKU matrix (Size × Finish).
const product = {
  id: 1,
  name: "Test Sink",
  slug: "test-sink",
  description: "",
  categoryId: 10,
  isBestseller: false,
  isNew: false,
  isFeatured: false,
  status: "active",
  tags: [],
  images: [],
  dimensions: [],
  skus: [
    { id: 1, skuCode: "A", price: 1000, salePrice: 800, dimensionValues: { Size: "S", Finish: "Matte" } },
    { id: 2, skuCode: "B", price: 1200, salePrice: null, dimensionValues: { Size: "S", Finish: "Gloss" } },
    { id: 3, skuCode: "C", price: 1500, salePrice: 1200, dimensionValues: { Size: "L", Finish: "Matte" } },
    { id: 4, skuCode: "D", price: 1800, salePrice: null, dimensionValues: { Size: "L", Finish: "Gloss" } },
  ],
} as unknown as Product;

describe("pricing helpers", () => {
  it("min price uses sale prices where present", () => {
    expect(getMinPrice(product)).toBe(800);
  });
  it("max base price is the highest list price", () => {
    expect(getMaxBasePrice(product)).toBe(1800);
  });
  it("best discount is the largest percentage across SKUs", () => {
    // 800/1000 = 20%, 1200/1500 = 20% → 20
    expect(getBestDiscount(product)).toBe(20);
  });
  it("returns 0 discount when nothing is on sale", () => {
    const noSale = { ...product, skus: product.skus.map((s) => ({ ...s, salePrice: null })) } as Product;
    expect(getBestDiscount(noSale)).toBe(0);
  });
});

describe("SKU selection", () => {
  it("resolves the SKU matching a full selection", () => {
    const sku = getSKUBySelections(product, { Size: "L", Finish: "Matte" });
    expect(sku?.skuCode).toBe("C");
  });
  it("returns undefined for an impossible combination", () => {
    expect(getSKUBySelections(product, { Size: "XL", Finish: "Matte" })).toBeUndefined();
  });
  it("lists available values for a dimension given the others", () => {
    const finishes = getAvailableValues(product, "Finish", { Size: "S" });
    expect(finishes.sort()).toEqual(["Gloss", "Matte"]);
  });
});
