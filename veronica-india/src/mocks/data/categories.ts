import type { Category } from "@veronica/contracts";

/**
 * Mock category tree, mirroring the production seed: 4 roots + 4 children.
 * IDs are stable so handlers and product mocks can reference them.
 * Images use placehold.co (serves real PNGs) so the storefront renders cleanly.
 */
export const categories: Category[] = [
  // ── Roots ── (shown in the header nav)
  { id: 1, parentId: null, name: "Kitchen Sinks", slug: "kitchen-sinks", description: "Premium quartz and stainless steel kitchen sinks", image: "/uploads/categories/kitchen-sinks.webp", sortOrder: 0, showInHeader: true },
  { id: 2, parentId: null, name: "Health Faucet Sets", slug: "health-faucet-sets", description: "ABS and brass health faucet sets", image: "/uploads/categories/health-faucets.webp", sortOrder: 1, showInHeader: true },
  { id: 3, parentId: null, name: "Bathroom Accessories", slug: "bathroom-accessories", description: "Floor drains, gratings, and bathroom essentials", image: "/uploads/categories/bathroom-accessories.webp", sortOrder: 2, showInHeader: true },
  { id: 4, parentId: null, name: "Plumbing & Fittings", slug: "plumbing-fittings", description: "Shower tubes, connection pipes, waste couplings", image: "/uploads/categories/plumbing-fittings.webp", sortOrder: 3, showInHeader: true },

  // ── Kitchen Sinks → children ── (shown in the Kitchen Sinks dropdown)
  { id: 10, parentId: 1, name: "Single Bowl", slug: "single-bowl", description: "Single bowl kitchen sinks in quartz and stainless steel", image: "/uploads/categories/kitchen-sinks.webp", sortOrder: 0, showInHeader: true },
  { id: 11, parentId: 1, name: "Double Bowl", slug: "double-bowl", description: "Double bowl kitchen sinks for maximum workspace", image: "/uploads/categories/cat-1.webp", sortOrder: 1, showInHeader: true },

  // ── Health Faucet Sets → children ── (shown in the Health Faucet Sets dropdown)
  { id: 20, parentId: 2, name: "ABS Faucets", slug: "abs-faucets", description: "Lightweight ABS body health faucets", image: "/uploads/categories/health-faucets.webp", sortOrder: 0, showInHeader: true },
  { id: 21, parentId: 2, name: "Brass Faucets", slug: "brass-faucets", description: "Heavy-duty solid brass health faucets", image: "/uploads/categories/cat-2.webp", sortOrder: 1, showInHeader: true },
];

/** Root categories (parentId === null), sorted — the storefront's primary nav. */
export const rootCategories = categories
  .filter((c) => c.parentId === null)
  .sort((a, b) => a.sortOrder - b.sortOrder);
