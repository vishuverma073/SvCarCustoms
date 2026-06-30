import type { Category } from "@svcar/contracts";

/** On-brand dark placeholder image for a category tile. */
const img = (text: string) =>
  `https://placehold.co/600x600/0C0C0D/C8A24B/png?text=${encodeURIComponent(text)}`;

/**
 * Mock category tree for SV Car Customs — 9 roots + children. The roots mirror
 * the Shop mega-menu taxonomy (VAG parts, exterior/interior mods, lighting,
 * performance, audio/electronics, universal mods, 4×4, merchandise). IDs/slugs
 * match the production seed so handlers and product mocks can reference them.
 *
 * Root id scheme: 1–9. Child id scheme: rootId*100 + n.
 */
export const categories: Category[] = [
  // ── Roots ──
  { id: 1, parentId: null, name: "Volkswagen Audi Group Parts", slug: "vag-parts", description: "OEM-style and upgrade parts for VW, Audi, Škoda & SEAT", image: img("VAG Parts"), sortOrder: 0, showInHeader: true, status: "active" },
  { id: 2, parentId: null, name: "Exterior Mods", slug: "exterior-mods", description: "Body kits, spoilers, splitters and diffusers for an aggressive stance", image: img("Exterior Mods"), sortOrder: 1, showInHeader: true, status: "active" },
  { id: 3, parentId: null, name: "Interior Mods", slug: "interior-mods", description: "Paddle shifters, steering wheels, trims and cabin upgrades", image: img("Interior Mods"), sortOrder: 2, showInHeader: true, status: "active" },
  { id: 4, parentId: null, name: "Car Lighting", slug: "car-lighting", description: "Headlights, tail lights, DRLs and ambient lighting", image: img("Car Lighting"), sortOrder: 3, showInHeader: true, status: "active" },
  { id: 5, parentId: null, name: "Performance Parts", slug: "performance-parts", description: "Exhausts, intakes, suspension and brakes engineered for performance", image: img("Performance Parts"), sortOrder: 4, showInHeader: true, status: "active" },
  { id: 6, parentId: null, name: "Car Audio, Electronics & Utility", slug: "car-audio-electronics", description: "Speakers, subwoofers, stereos, dash cams and in-car tech", image: img("Audio & Electronics"), sortOrder: 5, showInHeader: true, status: "active" },
  { id: 7, parentId: null, name: "Universal Exterior Mods", slug: "universal-exterior-mods", description: "Wraps, badges, mirror covers and bolt-on styling for any car", image: img("Universal Mods"), sortOrder: 6, showInHeader: true, status: "active" },
  { id: 8, parentId: null, name: "4×4 Accessories", slug: "4x4-accessories", description: "Roof racks, bull bars, off-road lights and recovery gear", image: img("4x4 Accessories"), sortOrder: 7, showInHeader: true, status: "active" },
  { id: 9, parentId: null, name: "Merchandise", slug: "merchandise", description: "SV Car Customs apparel, caps, keychains and stickers", image: img("Merchandise"), sortOrder: 8, showInHeader: true, status: "active" },

  // ── Volkswagen Audi Group Parts → children ──
  { id: 101, parentId: 1, name: "VW Parts", slug: "vw-parts", description: "Volkswagen-specific parts and upgrades", image: img("VW Parts"), sortOrder: 0, showInHeader: true, status: "active" },
  { id: 102, parentId: 1, name: "Audi Parts", slug: "audi-parts", description: "Audi-specific parts and upgrades", image: img("Audi Parts"), sortOrder: 1, showInHeader: true, status: "active" },
  { id: 103, parentId: 1, name: "Škoda Parts", slug: "skoda-parts", description: "Škoda-specific parts and upgrades", image: img("Skoda Parts"), sortOrder: 2, showInHeader: true, status: "active" },
  { id: 104, parentId: 1, name: "Front Grilles", slug: "vag-grilles", description: "OEM-style and RS/R-line grilles", image: img("Grilles"), sortOrder: 3, showInHeader: true, status: "active" },
  { id: 105, parentId: 1, name: "OEM-Style Upgrades", slug: "vag-oem-upgrades", description: "Factory-look upgrade parts", image: img("OEM Upgrades"), sortOrder: 4, showInHeader: true, status: "active" },

  // ── Exterior Mods → children ──
  { id: 201, parentId: 2, name: "Body Kits", slug: "body-kits", description: "Complete bumper-to-bumper styling kits", image: img("Body Kits"), sortOrder: 0, showInHeader: true, status: "active" },
  { id: 202, parentId: 2, name: "Spoilers & Wings", slug: "spoilers-wings", description: "Lip spoilers and GT wings", image: img("Spoilers & Wings"), sortOrder: 1, showInHeader: true, status: "active" },
  { id: 203, parentId: 2, name: "Splitters & Diffusers", slug: "splitters-diffusers", description: "Front splitters and rear diffusers", image: img("Splitters & Diffusers"), sortOrder: 2, showInHeader: true, status: "active" },
  { id: 204, parentId: 2, name: "Side Skirts", slug: "side-skirts", description: "Side skirt extensions", image: img("Side Skirts"), sortOrder: 3, showInHeader: true, status: "active" },
  { id: 205, parentId: 2, name: "Bonnets & Hoods", slug: "bonnets-hoods", description: "Vented and carbon bonnets", image: img("Bonnets"), sortOrder: 4, showInHeader: true, status: "active" },

  // ── Interior Mods → children ──
  { id: 301, parentId: 3, name: "Paddle Shifters", slug: "paddle-shifters", description: "Aluminium paddle shifter extensions", image: img("Paddle Shifters"), sortOrder: 0, showInHeader: true, status: "active" },
  { id: 302, parentId: 3, name: "Steering Wheels", slug: "steering-wheels", description: "Flat-bottom and sport steering wheels", image: img("Steering Wheels"), sortOrder: 1, showInHeader: true, status: "active" },
  { id: 303, parentId: 3, name: "Pedals & Footrests", slug: "pedals-footrests", description: "Aluminium pedal covers and footrests", image: img("Pedals"), sortOrder: 2, showInHeader: true, status: "active" },
  { id: 304, parentId: 3, name: "Gear Knobs", slug: "gear-knobs", description: "Custom gear knobs and boots", image: img("Gear Knobs"), sortOrder: 3, showInHeader: true, status: "active" },
  { id: 305, parentId: 3, name: "Interior Trims", slug: "interior-trims", description: "Carbon and piano-black trim accents", image: img("Interior Trims"), sortOrder: 4, showInHeader: true, status: "active" },
  { id: 306, parentId: 3, name: "Floor Mats", slug: "floor-mats", description: "Custom-fit and 7D floor mats", image: img("Floor Mats"), sortOrder: 5, showInHeader: true, status: "active" },

  // ── Car Lighting → children ──
  { id: 401, parentId: 4, name: "Headlights", slug: "headlights", description: "Projector and LED headlights", image: img("Headlights"), sortOrder: 0, showInHeader: true, status: "active" },
  { id: 402, parentId: 4, name: "Tail Lights", slug: "tail-lights", description: "LED and smoked tail lights", image: img("Tail Lights"), sortOrder: 1, showInHeader: true, status: "active" },
  { id: 403, parentId: 4, name: "DRLs", slug: "drls", description: "Daytime running lights and indicators", image: img("DRLs"), sortOrder: 2, showInHeader: true, status: "active" },
  { id: 404, parentId: 4, name: "Ambient Lighting", slug: "ambient-lighting", description: "Interior ambient lighting kits", image: img("Ambient Lighting"), sortOrder: 3, showInHeader: true, status: "active" },
  { id: 405, parentId: 4, name: "Fog Lights", slug: "fog-lights", description: "Fog lamps and auxiliary lights", image: img("Fog Lights"), sortOrder: 4, showInHeader: true, status: "active" },

  // ── Performance Parts → children ──
  { id: 501, parentId: 5, name: "Exhausts & Tips", slug: "exhausts-tips", description: "Cat-back systems and stainless exhaust tips", image: img("Exhausts & Tips"), sortOrder: 0, showInHeader: true, status: "active" },
  { id: 502, parentId: 5, name: "Air Intakes", slug: "air-intakes", description: "Cold-air and performance intakes", image: img("Air Intakes"), sortOrder: 1, showInHeader: true, status: "active" },
  { id: 503, parentId: 5, name: "Suspension", slug: "suspension", description: "Lowering springs and coilovers", image: img("Suspension"), sortOrder: 2, showInHeader: true, status: "active" },
  { id: 504, parentId: 5, name: "Blow-off Valves", slug: "blow-off-valves", description: "BOVs and diverter valves", image: img("Blow-off Valves"), sortOrder: 3, showInHeader: true, status: "active" },
  { id: 505, parentId: 5, name: "Brakes", slug: "brakes", description: "Performance pads, discs and calipers", image: img("Brakes"), sortOrder: 4, showInHeader: true, status: "active" },

  // ── Car Audio, Electronics & Utility → children ──
  { id: 601, parentId: 6, name: "Speakers", slug: "speakers", description: "Component and coaxial speaker upgrades", image: img("Speakers"), sortOrder: 0, showInHeader: true, status: "active" },
  { id: 602, parentId: 6, name: "Subwoofers", slug: "subwoofers", description: "Subwoofers and bass enclosures", image: img("Subwoofers"), sortOrder: 1, showInHeader: true, status: "active" },
  { id: 603, parentId: 6, name: "Amplifiers", slug: "amplifiers", description: "Mono and multi-channel amplifiers", image: img("Amplifiers"), sortOrder: 2, showInHeader: true, status: "active" },
  { id: 604, parentId: 6, name: "Android Stereos", slug: "android-stereos", description: "Android infotainment head units", image: img("Android Stereos"), sortOrder: 3, showInHeader: true, status: "active" },
  { id: 605, parentId: 6, name: "Dash Cams", slug: "dash-cams", description: "Front and rear dash cameras", image: img("Dash Cams"), sortOrder: 4, showInHeader: true, status: "active" },

  // ── Universal Exterior Mods → children ──
  { id: 701, parentId: 7, name: "Wraps & Films", slug: "wraps-films", description: "Vinyl wraps and PPF films", image: img("Wraps & Films"), sortOrder: 0, showInHeader: true, status: "active" },
  { id: 702, parentId: 7, name: "Badges & Emblems", slug: "badges-emblems", description: "Custom badges and emblems", image: img("Badges"), sortOrder: 1, showInHeader: true, status: "active" },
  { id: 703, parentId: 7, name: "Mirror Covers", slug: "mirror-covers", description: "Carbon and gloss mirror caps", image: img("Mirror Covers"), sortOrder: 2, showInHeader: true, status: "active" },
  { id: 704, parentId: 7, name: "Spoiler Lips", slug: "spoiler-lips", description: "Universal flexible spoiler lips", image: img("Spoiler Lips"), sortOrder: 3, showInHeader: true, status: "active" },
  { id: 705, parentId: 7, name: "Number Plates", slug: "number-plates", description: "Custom and IND number plates", image: img("Number Plates"), sortOrder: 4, showInHeader: true, status: "active" },

  // ── 4×4 Accessories → children ──
  { id: 801, parentId: 8, name: "Roof Racks", slug: "roof-racks", description: "Roof racks and cross bars", image: img("Roof Racks"), sortOrder: 0, showInHeader: true, status: "active" },
  { id: 802, parentId: 8, name: "Bull Bars", slug: "bull-bars", description: "Front bull bars and nudge guards", image: img("Bull Bars"), sortOrder: 1, showInHeader: true, status: "active" },
  { id: 803, parentId: 8, name: "Off-road Lights", slug: "off-road-lights", description: "Light bars and spot lights", image: img("Off-road Lights"), sortOrder: 2, showInHeader: true, status: "active" },
  { id: 804, parentId: 8, name: "Recovery Gear", slug: "recovery-gear", description: "Snatch straps, shackles and recovery kits", image: img("Recovery Gear"), sortOrder: 3, showInHeader: true, status: "active" },
  { id: 805, parentId: 8, name: "Snorkels", slug: "snorkels", description: "Raised air intake snorkels", image: img("Snorkels"), sortOrder: 4, showInHeader: true, status: "active" },

  // ── Merchandise → children ──
  { id: 901, parentId: 9, name: "Apparel", slug: "apparel", description: "T-shirts and hoodies", image: img("Apparel"), sortOrder: 0, showInHeader: true, status: "active" },
  { id: 902, parentId: 9, name: "Caps", slug: "caps", description: "Caps and beanies", image: img("Caps"), sortOrder: 1, showInHeader: true, status: "active" },
  { id: 903, parentId: 9, name: "Keychains", slug: "keychains", description: "Metal and leather keychains", image: img("Keychains"), sortOrder: 2, showInHeader: true, status: "active" },
  { id: 904, parentId: 9, name: "Stickers", slug: "stickers", description: "Decals and sticker packs", image: img("Stickers"), sortOrder: 3, showInHeader: true, status: "active" },
];

/** Root categories (parentId === null), sorted — the storefront's primary nav. */
export const rootCategories = categories
  .filter((c) => c.parentId === null && c.status !== "archived")
  .sort((a, b) => a.sortOrder - b.sortOrder);
