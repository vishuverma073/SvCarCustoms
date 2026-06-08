/**
 * Default home configuration in the REAL backend's wire shape: an ordered list
 * of sections, each `{ key, enabled, order, config }`. The admin client
 * (`admin-api.ts`) and the storefront client (`backend.getHome`) both translate
 * this discriminated-union layout into their own view models — so the mock must
 * speak the same wire format the deployed API does, or the two drift.
 */
export interface HomeWireSection {
  key: "hero" | "categories" | "bestsellers" | "new" | "featured" | "promo";
  enabled: boolean;
  order: number;
  config: Record<string, unknown>;
}

export interface HomeWire {
  sections: HomeWireSection[];
}

export const home: HomeWire = {
  sections: [
    {
      key: "hero",
      enabled: true,
      order: 0,
      config: {
        imageUrl: "/uploads/categories/hero-1.webp",
        title: "Premium Sanitaryware, Trusted Since 2004",
        subtitle: "Kitchen sinks, health faucets & bath solutions built to last.",
        ctaText: "Shop Kitchen Sinks",
        ctaHref: "/category/kitchen-sinks",
      },
    },
    { key: "categories", enabled: true, order: 1, config: { categoryIds: [1, 2, 3, 4] } },
    { key: "bestsellers", enabled: true, order: 2, config: {} },
    { key: "new", enabled: true, order: 3, config: {} },
    { key: "featured", enabled: true, order: 4, config: { productIds: [3, 7, 12] } },
    {
      key: "promo",
      enabled: true,
      order: 5,
      config: {
        imageUrl: "/uploads/categories/hero-2.webp",
        headline: "Monsoon Sale — Up to 40% Off",
        ctaText: "View Offers",
        ctaHref: "/category/health-faucet-sets",
      },
    },
  ],
};
