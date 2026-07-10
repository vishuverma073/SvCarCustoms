import { faker } from "@faker-js/faker";
import type {
  Product,
  ProductListItem,
  VariantDimension,
  ProductSKU,
  Fitment,
} from "@svcar/contracts";
import { extractProductSizes } from "@/lib/product-sizes";
import { slugify } from "@/lib/utils";

// Deterministic mock data → no hydration drift between SSR and client.
faker.seed(20040);

let idSeq = 100;
const nextId = () => ++idSeq;

/** On-brand dark placeholder image for a product photo. */
const img = (text: string, n = 1) =>
  `https://placehold.co/800x800/0C0C0D/E11D2A/png?text=${encodeURIComponent(text + (n > 1 ? ` ${n}` : ""))}`;

interface DimSpec {
  name: string;
  values: string[];
}

/**
 * Build a product's variant dimensions + the cartesian-product SKU list.
 * Prices step up per combination so the UI shows a realistic range.
 */
function buildVariants(
  codePrefix: string,
  dims: DimSpec[],
  basePrice: number,
  saleFraction: number | null,
): { dimensions: VariantDimension[]; skus: ProductSKU[] } {
  const dimensions: VariantDimension[] = dims.map((d, di) => ({
    id: nextId(),
    name: d.name,
    sortOrder: di,
    values: d.values.map((v, vi) => ({ id: nextId(), value: v, sortOrder: vi })),
  }));

  // Cartesian product of dimension values.
  let combos: Record<string, string>[] = [{}];
  for (const d of dims) {
    const next: Record<string, string>[] = [];
    for (const combo of combos) {
      for (const v of d.values) next.push({ ...combo, [d.name]: v });
    }
    combos = next;
  }

  const skus: ProductSKU[] = combos.map((dimensionValues, i) => {
    const price = basePrice + i * Math.round(basePrice * 0.18);
    const suffix = Object.values(dimensionValues)
      .map((v) => v.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase())
      .join("-");
    return {
      id: nextId(),
      skuCode: suffix ? `${codePrefix}-${suffix}` : codePrefix,
      price,
      salePrice: saleFraction ? Math.round(price * saleFraction) : null,
      dimensionValues,
    };
  });

  return { dimensions, skus };
}

interface Seed {
  name: string;
  categoryId: number;
  /** Extra categories to cross-list under (besides the primary categoryId). */
  categoryIds?: number[];
  tags: string[];
  basePrice: number;
  sale?: number; // fraction of price, e.g. 0.7
  dims?: DimSpec[];
  isBestseller?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  status?: Product["status"];
  material?: string;
  warranty?: string;
  /** Vehicle fitment. Default is universal; set fitments for vehicle-specific parts. */
  fitsAll?: boolean;
  fitments?: Fitment[];
}

const F = (make: string, ...models: string[]): Fitment[] =>
  models.map((model) => ({ make, model }));

const FINISH = { name: "Finish", values: ["Gloss Black", "Carbon Fibre", "Matte Black"] };

const seeds: Seed[] = [
  // ── Exterior Mods → Body Kits (201) ──
  { name: "Apex Full Body Kit", categoryId: 201, tags: ["BodyKit", "ABS", "BoltOn"], basePrice: 48000, sale: 0.85, dims: [FINISH], isBestseller: true, isFeatured: true, material: "ABS Plastic", warranty: "6 Months", fitsAll: false, fitments: [...F("Hyundai", "Creta"), ...F("Kia", "Seltos")] },
  { name: "Street Aero Body Kit", categoryId: 201, tags: ["BodyKit", "Aero"], basePrice: 36000, sale: 0.9, dims: [FINISH], material: "Polyurethane", warranty: "6 Months", fitsAll: false, fitments: [...F("Maruti Suzuki", "Swift", "Baleno")] },

  // ── Exterior Mods → Spoilers & Wings (202) ──
  { name: "OEM-Style Lip Spoiler", categoryId: 202, tags: ["Spoiler", "BoltOn", "OEMFit"], basePrice: 3200, sale: 0.8, dims: [FINISH], isBestseller: true, material: "ABS Plastic", warranty: "6 Months", fitsAll: false, fitments: [...F("Honda", "City", "Amaze")] },
  { name: "GT Wing Pro", categoryId: 202, tags: ["GTWing", "CarbonFibre", "Adjustable"], basePrice: 9800, sale: 0.85, dims: [{ name: "Width", values: ['48"', '52"'] }, FINISH], isNew: true, isFeatured: true, material: "Carbon Fibre", warranty: "6 Months", fitsAll: false, fitments: [...F("Maruti Suzuki", "Swift"), ...F("Volkswagen", "Polo")] },
  // Cross-listed: shows under Spoilers & Wings (202) AND VW Parts (101).
  { name: "Virtus Boot Lip Spoiler", categoryId: 202, categoryIds: [101], tags: ["Spoiler", "Virtus", "VW", "BoltOn"], basePrice: 4200, sale: 0.85, dims: [FINISH], isBestseller: true, material: "ABS Plastic", warranty: "6 Months", fitsAll: false, fitments: [...F("Volkswagen", "Virtus")] },

  // ── Exterior Mods → Splitters & Diffusers (203) ──
  { name: "Carbon Front Splitter", categoryId: 203, tags: ["Splitter", "CarbonFibre", "Aero"], basePrice: 7500, sale: 0.8, dims: [FINISH], isNew: true, material: "Carbon Fibre", warranty: "6 Months", fitsAll: false, fitments: [...F("Hyundai", "i20", "Verna"), ...F("Tata", "Nexon")] },
  { name: "Motorsport Rear Diffuser", categoryId: 203, tags: ["Diffuser", "Aero", "BoltOn"], basePrice: 6200, sale: 0.85, dims: [FINISH], isBestseller: true, material: "ABS Plastic", warranty: "6 Months", fitsAll: false, fitments: [...F("Volkswagen", "Virtus", "Polo"), ...F("Skoda", "Slavia")] },

  // ── Exterior Mods → Side Skirts (204) ──
  { name: "Side Skirt Extensions", categoryId: 204, tags: ["SideSkirt", "Aero", "BoltOn"], basePrice: 5400, sale: 0.85, dims: [FINISH], material: "ABS Plastic", warranty: "6 Months", fitsAll: false, fitments: [...F("Volkswagen", "Polo"), ...F("Skoda", "Rapid")] },

  // ── VAG Parts (101–105) ──
  { name: "VW Polo R-Line Front Grille", categoryId: 104, tags: ["Grille", "VAG", "RLine"], basePrice: 4800, sale: 0.85, isNew: true, material: "ABS Plastic", warranty: "6 Months", fitsAll: false, fitments: [...F("Volkswagen", "Polo", "Vento")] },
  { name: "Audi Honeycomb Grille", categoryId: 102, tags: ["Grille", "Audi", "Honeycomb"], basePrice: 9200, sale: 0.9, material: "ABS Plastic", warranty: "6 Months", fitsAll: false, fitments: [...F("Audi", "A4", "A6")] },
  { name: "Škoda Slavia Lower Lip", categoryId: 103, tags: ["Lip", "Skoda", "BoltOn"], basePrice: 3600, sale: 0.8, dims: [FINISH], material: "ABS Plastic", warranty: "6 Months", fitsAll: false, fitments: [...F("Skoda", "Slavia")] },

  // ── Interior Mods (301–306) ──
  { name: "Aluminium Paddle Shifters", categoryId: 301, tags: ["PaddleShifter", "Aluminium", "Universal"], basePrice: 2200, sale: 0.75, dims: [{ name: "Finish", values: ["Silver", "Red", "Black"] }], isBestseller: true, material: "CNC Aluminium", warranty: "1 Year", fitsAll: true },
  { name: "Flat-Bottom Sport Steering Wheel", categoryId: 302, tags: ["SteeringWheel", "FlatBottom"], basePrice: 12500, sale: 0.9, material: "Leather / Carbon", warranty: "1 Year", fitsAll: false, fitments: [...F("Volkswagen", "Polo", "Vento")] },
  { name: "Carbon Interior Trim Set", categoryId: 305, tags: ["InteriorTrim", "CarbonFibre", "Universal"], basePrice: 3400, sale: 0.8, isNew: true, material: "Carbon Fibre Vinyl", warranty: "6 Months", fitsAll: true },
  { name: "7D Custom Floor Mats", categoryId: 306, tags: ["FloorMats", "7D", "Custom"], basePrice: 2800, sale: 0.75, dims: [{ name: "Colour", values: ["Black", "Black/Red", "Black/Tan"] }], isBestseller: true, material: "TPE / Leather", warranty: "6 Months", fitsAll: false, fitments: [...F("Hyundai", "Creta"), ...F("Kia", "Seltos")] },

  // ── Car Lighting (401–405) ──
  { name: "Projector LED Headlights", categoryId: 401, tags: ["Headlight", "LED", "Projector"], basePrice: 14500, sale: 0.88, material: "Polycarbonate", warranty: "1 Year", fitsAll: false, fitments: [...F("Maruti Suzuki", "Swift"), ...F("Hyundai", "i20")] },
  { name: "LED Smoked Tail Lights", categoryId: 402, tags: ["TailLight", "LED", "Smoked"], basePrice: 11800, sale: 0.9, isNew: true, material: "Polycarbonate", warranty: "1 Year", fitsAll: false, fitments: [...F("Tata", "Nexon", "Altroz")] },
  { name: "Sequential DRL Kit", categoryId: 403, tags: ["DRL", "Sequential", "Universal"], basePrice: 2600, sale: 0.75, dims: [{ name: "Colour", values: ["White", "Ice Blue"] }], material: "LED", warranty: "1 Year", fitsAll: true },
  { name: "RGB Ambient Light Kit", categoryId: 404, tags: ["AmbientLight", "RGB", "AppControl", "Universal"], basePrice: 2400, sale: 0.7, dims: [{ name: "Lights", values: ["4-Piece", "6-Piece"] }], isBestseller: true, isFeatured: true, material: "Fibre Optic", warranty: "1 Year", fitsAll: true },
  { name: "Footwell Ambient Glow", categoryId: 404, tags: ["AmbientLight", "Footwell", "Universal"], basePrice: 1600, sale: 0.75, dims: [{ name: "Colour", values: ["Ice Blue", "Red", "Multicolour"] }], isNew: true, material: "LED", warranty: "1 Year", fitsAll: true },

  // ── Performance Parts (501–505) ──
  { name: "Cat-Back Sport Exhaust", categoryId: 501, tags: ["Exhaust", "CatBack", "StainlessSteel"], basePrice: 22000, sale: 0.9, dims: [{ name: "Tip", values: ["Single", "Dual"] }], isBestseller: true, isFeatured: true, material: "SS304 Stainless Steel", warranty: "1 Year", fitsAll: false, fitments: [...F("Volkswagen", "Polo", "Virtus"), ...F("Skoda", "Kushaq")] },
  { name: "Burnt Tip Exhaust Set", categoryId: 501, tags: ["ExhaustTip", "StainlessSteel", "BoltOn", "Universal"], basePrice: 1800, sale: 0.7, dims: [{ name: "Inlet", values: ['2.0"', '2.5"'] }, { name: "Style", values: ["Burnt Blue", "Carbon"] }], isBestseller: true, material: "SS304 Stainless Steel", warranty: "6 Months", fitsAll: true },
  { name: "Cold Air Intake Kit", categoryId: 502, tags: ["AirIntake", "Performance"], basePrice: 7800, sale: 0.85, isNew: true, material: "Aluminium / Cotton Filter", warranty: "1 Year", fitsAll: false, fitments: [...F("Volkswagen", "Polo"), ...F("Skoda", "Rapid")] },
  { name: "Lowering Spring Set", categoryId: 503, tags: ["Suspension", "LoweringSprings"], basePrice: 13500, sale: 0.9, material: "Spring Steel", warranty: "1 Year", fitsAll: false, fitments: [...F("Volkswagen", "Polo", "Vento")] },

  // ── Car Audio, Electronics & Utility (601–605) ──
  { name: "Component Speaker Upgrade", categoryId: 601, tags: ["Speakers", "Component", "Audio"], basePrice: 6500, sale: 0.85, dims: [{ name: "Size", values: ['5.25"', '6.5"'] }], isFeatured: true, material: "Silk Dome / Polypropylene", warranty: "1 Year", fitsAll: true },
  { name: "Under-Seat Active Subwoofer", categoryId: 602, tags: ["Subwoofer", "UnderSeat", "Amplified"], basePrice: 9200, sale: 0.9, isNew: true, material: "Composite Enclosure", warranty: "1 Year", fitsAll: true },
  { name: 'Android 10" Touchscreen Stereo', categoryId: 604, tags: ["Stereo", "Android", "CarPlay"], basePrice: 15500, sale: 0.88, dims: [{ name: "RAM", values: ["2+32GB", "4+64GB"] }], isBestseller: true, material: "IPS Touchscreen", warranty: "1 Year", fitsAll: true },
  { name: "Dual-Channel Dash Cam", categoryId: 605, tags: ["DashCam", "FrontRear", "FHD"], basePrice: 5400, sale: 0.8, isNew: true, material: "Polycarbonate", warranty: "1 Year", fitsAll: true },

  // ── Universal Exterior Mods (701–705) ──
  { name: "Gloss Vinyl Wrap Roll", categoryId: 701, tags: ["Wrap", "Vinyl", "Universal"], basePrice: 4200, sale: 0.8, dims: [{ name: "Colour", values: ["Gloss Black", "Nardo Grey", "Racing Red"] }], material: "Cast Vinyl", warranty: "—", fitsAll: true },
  { name: "Carbon Mirror Caps", categoryId: 703, tags: ["MirrorCover", "CarbonFibre"], basePrice: 3200, sale: 0.85, isBestseller: true, material: "Carbon Fibre", warranty: "6 Months", fitsAll: false, fitments: [...F("Volkswagen", "Polo", "Vento")] },
  { name: "Custom IND Number Plate", categoryId: 705, tags: ["NumberPlate", "Custom", "IND"], basePrice: 1500, sale: 0.7, dims: [{ name: "Style", values: ["Embossed", "Carbon", "Gel"] }], isNew: true, material: "Acrylic / Aluminium", warranty: "—", fitsAll: true },

  // ── 4×4 Accessories (801–805) ──
  { name: "Aluminium Roof Rack", categoryId: 801, tags: ["RoofRack", "4x4", "Aluminium"], basePrice: 11500, sale: 0.9, material: "Aluminium", warranty: "1 Year", fitsAll: false, fitments: [...F("Mahindra", "Thar"), ...F("Maruti Suzuki", "Jimny")] },
  { name: "Off-road LED Light Bar", categoryId: 803, tags: ["LightBar", "OffRoad", "LED"], basePrice: 6800, sale: 0.85, dims: [{ name: "Size", values: ['22"', '32"'] }], isNew: true, material: "Aluminium Housing", warranty: "1 Year", fitsAll: true },

  // ── Merchandise (901–904) ──
  { name: "SV Car Customs Tee", categoryId: 901, tags: ["Apparel", "Tshirt", "Merch"], basePrice: 899, sale: 0.8, dims: [{ name: "Size", values: ["S", "M", "L", "XL"] }], material: "Cotton", warranty: "—", fitsAll: true },
  { name: "SV Embroidered Cap", categoryId: 902, tags: ["Cap", "Merch"], basePrice: 699, sale: 0.75, isBestseller: true, material: "Cotton Twill", warranty: "—", fitsAll: true },
];

function buildProduct(seed: Seed, index: number): Product {
  const codePrefix = seed.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .replace(/[^A-Za-z]/g, "")
    .slice(0, 4)
    .toUpperCase();
  const { dimensions, skus } = buildVariants(
    codePrefix,
    seed.dims ?? [],
    seed.basePrice,
    seed.sale ?? null,
  );

  return {
    id: index + 1,
    name: seed.name,
    slug: slugify(seed.name),
    description: faker.commerce.productDescription(),
    categoryId: seed.categoryId,
    categoryIds: seed.categoryIds,
    isBestseller: seed.isBestseller ?? false,
    isNew: seed.isNew ?? false,
    isFeatured: seed.isFeatured ?? false,
    status: seed.status ?? "active",
    tags: seed.tags,
    images: [img(seed.name), img(seed.name, 2)],
    dimensions,
    skus,
    specifications: [
      { name: "Material", value: seed.material ?? "ABS Plastic" },
      { name: "Fitment", value: seed.fitsAll ? "Universal — fits most cars" : "Vehicle-specific (bolt-on)" },
      { name: "Warranty", value: seed.warranty ?? "6 Months" },
    ],
    includedAccessories: ["Mounting hardware", "Fitment guide"],
    fitsAllVehicles: seed.fitsAll ?? true,
    fitments: seed.fitments ?? [],
  };
}

/** Mutable in-memory product store (handlers mutate this for POST/PATCH/DELETE). */
export const products: Product[] = seeds.map(buildProduct);

// ── Derivations for list/search endpoints ──

export function getMinPrice(p: Product): number {
  if (p.skus.length === 0) return 0;
  return Math.min(...p.skus.map((s) => s.salePrice ?? s.price));
}

export function getMaxBasePrice(p: Product): number {
  if (p.skus.length === 0) return 0;
  return Math.max(...p.skus.map((s) => s.price));
}

export function getBestDiscount(p: Product): number {
  const discounts = p.skus
    .filter((s) => s.salePrice !== null && s.salePrice < s.price)
    .map((s) => Math.round(((s.price - s.salePrice!) / s.price) * 100));
  return discounts.length > 0 ? Math.max(...discounts) : 0;
}

/** Project a full Product down to the lightweight list/grid shape. */
export function toListItem(p: Product): ProductListItem {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    categoryId: p.categoryId,
    categoryIds: p.categoryIds,
    image: p.images[0] ?? "",
    minPrice: getMinPrice(p),
    maxBasePrice: getMaxBasePrice(p),
    bestDiscount: getBestDiscount(p),
    isBestseller: p.isBestseller,
    isNew: p.isNew,
    isFeatured: p.isFeatured,
    status: p.status,
    skuCount: p.skus.length,
    tags: p.tags,
    sizes: extractProductSizes(p.skus, p.dimensions),
    fitsAllVehicles: p.fitsAllVehicles,
    fitments: p.fitments,
  };
}
