import type { Category } from "@veronica/contracts";

/**
 * Mock category tree, mirroring the production seed: 4 roots + 4 children.
 * IDs are stable so handlers and product mocks can reference them.
 * Images use placehold.co (serves real PNGs) so the storefront renders cleanly.
 */
export const categories: Category[] = [
  // ── Roots ──
  { id: 1, parentId: null, name: "Kitchen Sinks", slug: "kitchen-sinks", description: "Premium quartz and stainless steel kitchen sinks", image: "https://placehold.co/400x400/F5F5F4/0A0A0A/png?text=Kitchen+Sinks", sortOrder: 0 },
  { id: 2, parentId: null, name: "Health Faucet Sets", slug: "health-faucet-sets", description: "ABS and brass health faucet sets", image: "https://placehold.co/400x400/F5F5F4/0A0A0A/png?text=Health+Faucets", sortOrder: 1 },
  { id: 3, parentId: null, name: "Bathroom Accessories", slug: "bathroom-accessories", description: "Floor drains, gratings, and bathroom essentials", image: "https://placehold.co/400x400/F5F5F4/0A0A0A/png?text=Bathroom", sortOrder: 2 },
  { id: 4, parentId: null, name: "Plumbing & Fittings", slug: "plumbing-fittings", description: "Shower tubes, connection pipes, waste couplings", image: "https://placehold.co/400x400/F5F5F4/0A0A0A/png?text=Plumbing", sortOrder: 3 },

  // ── Kitchen Sinks → children ──
  { id: 10, parentId: 1, name: "Single Bowl", slug: "single-bowl", description: "Single bowl kitchen sinks in quartz and stainless steel", image: "https://placehold.co/400x400/EEEEEE/57534E/png?text=Single+Bowl", sortOrder: 0 },
  { id: 11, parentId: 1, name: "Double Bowl", slug: "double-bowl", description: "Double bowl kitchen sinks for maximum workspace", image: "https://placehold.co/400x400/EEEEEE/57534E/png?text=Double+Bowl", sortOrder: 1 },

  // ── Health Faucet Sets → children ──
  { id: 20, parentId: 2, name: "ABS Faucets", slug: "abs-faucets", description: "Lightweight ABS body health faucets", image: "https://placehold.co/400x400/EEEEEE/57534E/png?text=ABS+Faucets", sortOrder: 0 },
  { id: 21, parentId: 2, name: "Brass Faucets", slug: "brass-faucets", description: "Heavy-duty solid brass health faucets", image: "https://placehold.co/400x400/EEEEEE/57534E/png?text=Brass+Faucets", sortOrder: 1 },
];

/** Root categories (parentId === null), sorted — the storefront's primary nav. */
export const rootCategories = categories
  .filter((c) => c.parentId === null)
  .sort((a, b) => a.sortOrder - b.sortOrder);
