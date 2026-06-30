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
        imageUrl: "https://placehold.co/1600x900/0C0C0D/C8A24B/png?text=SV+Car+Customs",
        title: "Build a Car That Turns Heads",
        subtitle: "Body kits, spoilers, ambient lighting, exhausts & more. Best car accessories delivered to your doorstep.",
        ctaText: "Shop Accessories",
        ctaHref: "/search",
      },
    },
    { key: "categories", enabled: true, order: 1, config: { categoryIds: [2, 3, 4, 5] } },
    { key: "bestsellers", enabled: true, order: 2, config: {} },
    { key: "new", enabled: true, order: 3, config: {} },
    { key: "featured", enabled: true, order: 4, config: { productIds: [1, 4, 19, 21] } },
    {
      key: "promo",
      enabled: true,
      order: 5,
      config: {
        imageUrl: "https://placehold.co/1600x600/0C0C0D/C8A24B/png?text=Up+to+40%25+Off",
        headline: "Festive Sale — Up to 40% Off",
        ctaText: "View Offers",
        ctaHref: "/category/exterior-mods",
      },
    },
  ],
};
