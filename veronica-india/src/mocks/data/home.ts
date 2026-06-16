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
        // hero-1.webp shipped as a broken ~196B placeholder; use a real image and
        // mirror the production default hero copy so local matches the live site.
        imageUrl: "/uploads/categories/kitchen-sinks.webp",
        title: "Crafted with Modern Technology",
        subtitle: "Premium Quartz Sinks, Faucets & Sanitary Solutions. Designed for Modern Indian Homes.",
        ctaText: "Shop Sanitary Goods",
        ctaHref: "/search",
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
        // hero-2.webp shipped as a broken ~234B placeholder; use a real image.
        imageUrl: "/uploads/categories/plumbing-fittings.webp",
        headline: "Monsoon Sale — Up to 40% Off",
        ctaText: "View Offers",
        ctaHref: "/category/health-faucet-sets",
      },
    },
  ],
};
