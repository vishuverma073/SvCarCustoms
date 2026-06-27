import type { Category } from "@svcar/contracts";

/** On-brand dark placeholder image for a category tile. */
const img = (text: string) =>
  `https://placehold.co/600x600/0A0A0A/E11D2A/png?text=${encodeURIComponent(text)}`;

/**
 * Mock category tree for SV Car Customs — 7 roots + children. IDs/slugs match
 * the production seed so handlers and product mocks can reference them.
 */
export const categories: Category[] = [
  // ── Roots ── (shown in the header nav)
  { id: 1, parentId: null, name: "Body Kits", slug: "body-kits", description: "Full body kits, splitters and diffusers to transform your car's stance", image: img("Body Kits"), sortOrder: 0, showInHeader: true, status: "active" },
  { id: 2, parentId: null, name: "Spoilers", slug: "spoilers", description: "Lip spoilers and GT wings for a sportier rear", image: img("Spoilers"), sortOrder: 1, showInHeader: true, status: "active" },
  { id: 3, parentId: null, name: "Lighting", slug: "lighting", description: "Ambient lights, headlights, DRLs and tail lights", image: img("Lighting"), sortOrder: 2, showInHeader: true, status: "active" },
  { id: 4, parentId: null, name: "Exhausts & Tips", slug: "exhausts", description: "Cat-back systems and stainless exhaust tips", image: img("Exhausts"), sortOrder: 3, showInHeader: true, status: "active" },
  { id: 5, parentId: null, name: "Interior", slug: "interior", description: "Paddle shifters, custom interiors and trims", image: img("Interior"), sortOrder: 4, showInHeader: true, status: "active" },
  { id: 6, parentId: null, name: "Exterior", slug: "exterior", description: "Custom exteriors and complete styling kits", image: img("Exterior"), sortOrder: 5, showInHeader: true, status: "active" },
  { id: 7, parentId: null, name: "Audio", slug: "audio", description: "Speakers and subwoofers for premium in-car sound", image: img("Audio"), sortOrder: 6, showInHeader: true, status: "active" },

  // ── Body Kits → children ──
  { id: 10, parentId: 1, name: "Full Body Kits", slug: "full-body-kits", description: "Complete bumper-to-bumper styling kits", image: img("Full Body Kits"), sortOrder: 0, showInHeader: true, status: "active" },
  { id: 11, parentId: 1, name: "Front Splitters", slug: "front-splitters", description: "Front lip splitters for aggressive looks", image: img("Front Splitters"), sortOrder: 1, showInHeader: true, status: "active" },
  { id: 12, parentId: 1, name: "Rear Diffusers", slug: "rear-diffusers", description: "Rear diffusers with a motorsport edge", image: img("Rear Diffusers"), sortOrder: 2, showInHeader: true, status: "active" },

  // ── Spoilers → children ──
  { id: 20, parentId: 2, name: "Lip Spoilers", slug: "lip-spoilers", description: "Subtle boot-lip spoilers", image: img("Lip Spoilers"), sortOrder: 0, showInHeader: true, status: "active" },
  { id: 21, parentId: 2, name: "GT Wings", slug: "gt-wings", description: "Bold GT-style rear wings", image: img("GT Wings"), sortOrder: 1, showInHeader: true, status: "active" },

  // ── Lighting → children ──
  { id: 30, parentId: 3, name: "Ambient Lights", slug: "ambient-lights", description: "Interior ambient lighting kits", image: img("Ambient Lights"), sortOrder: 0, showInHeader: true, status: "active" },
  { id: 31, parentId: 3, name: "Headlights & DRLs", slug: "headlights-drls", description: "Projector headlights and DRLs", image: img("Headlights"), sortOrder: 1, showInHeader: true, status: "active" },
  { id: 32, parentId: 3, name: "Tail Lights", slug: "tail-lights", description: "LED tail light upgrades", image: img("Tail Lights"), sortOrder: 2, showInHeader: true, status: "active" },

  // ── Exhausts & Tips → children ──
  { id: 40, parentId: 4, name: "Exhaust Systems", slug: "exhaust-systems", description: "Cat-back and axle-back exhaust systems", image: img("Exhaust Systems"), sortOrder: 0, showInHeader: true, status: "active" },
  { id: 41, parentId: 4, name: "Exhaust Tips", slug: "exhaust-tips", description: "Bolt-on stainless exhaust tips", image: img("Exhaust Tips"), sortOrder: 1, showInHeader: true, status: "active" },

  // ── Interior → children ──
  { id: 50, parentId: 5, name: "Paddle Shifters", slug: "paddle-shifters", description: "Aluminium paddle shifter extensions", image: img("Paddle Shifters"), sortOrder: 0, showInHeader: true, status: "active" },
  { id: 51, parentId: 5, name: "Custom Interiors", slug: "custom-interiors", description: "Custom upholstery and interior makeovers", image: img("Custom Interiors"), sortOrder: 1, showInHeader: true, status: "active" },
  { id: 52, parentId: 5, name: "Interior Trims", slug: "interior-trims", description: "Carbon and piano-black trim accents", image: img("Interior Trims"), sortOrder: 2, showInHeader: true, status: "active" },

  // ── Exterior → children ──
  { id: 60, parentId: 6, name: "Custom Exteriors", slug: "custom-exteriors", description: "Wraps, badges and exterior styling", image: img("Custom Exteriors"), sortOrder: 0, showInHeader: true, status: "active" },
  { id: 61, parentId: 6, name: "Custom Kits", slug: "custom-kits", description: "Bespoke build-to-order styling kits", image: img("Custom Kits"), sortOrder: 1, showInHeader: true, status: "active" },

  // ── Audio → children ──
  { id: 70, parentId: 7, name: "Speakers", slug: "speakers", description: "Component and coaxial speaker upgrades", image: img("Speakers"), sortOrder: 0, showInHeader: true, status: "active" },
  { id: 71, parentId: 7, name: "Subwoofers", slug: "subwoofers", description: "Subwoofers and bass enclosures", image: img("Subwoofers"), sortOrder: 1, showInHeader: true, status: "active" },
];

/** Root categories (parentId === null), sorted — the storefront's primary nav. */
export const rootCategories = categories
  .filter((c) => c.parentId === null && c.status !== "archived")
  .sort((a, b) => a.sortOrder - b.sortOrder);
