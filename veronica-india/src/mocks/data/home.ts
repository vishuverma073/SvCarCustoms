import type { HomeConfig } from "@veronica/contracts";

/** Default home configuration — all 6 sections enabled in canonical order. */
export const home: HomeConfig = {
  sections: [
    { key: "hero", enabled: true },
    { key: "categories", enabled: true },
    { key: "bestsellers", enabled: true },
    { key: "new", enabled: true },
    { key: "featured", enabled: true },
    { key: "promo", enabled: true },
  ],
  hero: {
    image: "https://placehold.co/1200x600/0A0A0A/E8822A/png?text=Veronica+India",
    title: "Premium Sanitaryware, Trusted Since 2004",
    subtitle: "Kitchen sinks, health faucets & bath solutions built to last.",
    ctaText: "Shop Kitchen Sinks",
    ctaLink: "/category/kitchen-sinks",
    showFrom: null,
    showTo: null,
  },
  promo: {
    image: "https://placehold.co/1200x300/0A0A0A/E8822A/png?text=Monsoon+Sale",
    title: "Monsoon Sale — Up to 40% Off",
    subtitle: "Limited time on selected faucets & accessories.",
    ctaText: "View Offers",
    ctaLink: "/category/health-faucet-sets",
    showFrom: null,
    showTo: null,
  },
  featured: { productIds: [3, 7, 12] },
  categories: { categoryIds: [1, 2, 3, 4] },
};
