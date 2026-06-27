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
  `https://placehold.co/800x800/0A0A0A/E11D2A/png?text=${encodeURIComponent(text + (n > 1 ? ` ${n}` : ""))}`;

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
  // ── Body Kits ──
  { name: "Apex Full Body Kit", categoryId: 10, tags: ["BodyKit", "ABS", "BoltOn"], basePrice: 48000, sale: 0.85, dims: [FINISH], isBestseller: true, isFeatured: true, material: "ABS Plastic", warranty: "6 Months", fitsAll: false, fitments: [...F("Hyundai", "Creta"), ...F("Kia", "Seltos")] },
  { name: "Street Aero Body Kit", categoryId: 10, tags: ["BodyKit", "Aero"], basePrice: 36000, sale: 0.9, dims: [FINISH], material: "Polyurethane", warranty: "6 Months", fitsAll: false, fitments: [...F("Maruti Suzuki", "Swift", "Baleno")] },
  { name: "Carbon Front Splitter", categoryId: 11, tags: ["Splitter", "CarbonFibre", "Aero"], basePrice: 7500, sale: 0.8, dims: [FINISH], isNew: true, material: "Carbon Fibre", warranty: "6 Months", fitsAll: false, fitments: [...F("Hyundai", "i20", "Verna"), ...F("Tata", "Nexon")] },
  { name: "Motorsport Rear Diffuser", categoryId: 12, tags: ["Diffuser", "Aero", "BoltOn"], basePrice: 6200, sale: 0.85, dims: [FINISH], isBestseller: true, material: "ABS Plastic", warranty: "6 Months", fitsAll: false, fitments: [...F("Volkswagen", "Virtus", "Polo"), ...F("Skoda", "Slavia")] },

  // ── Spoilers ──
  { name: "OEM-Style Lip Spoiler", categoryId: 20, tags: ["Spoiler", "BoltOn", "OEMFit"], basePrice: 3200, sale: 0.8, dims: [FINISH], isBestseller: true, material: "ABS Plastic", warranty: "6 Months", fitsAll: false, fitments: [...F("Honda", "City", "Amaze")] },
  { name: "GT Wing Pro", categoryId: 21, tags: ["GTWing", "CarbonFibre", "Adjustable"], basePrice: 9800, sale: 0.85, dims: [{ name: "Width", values: ['48"', '52"'] }, FINISH], isNew: true, isFeatured: true, material: "Carbon Fibre", warranty: "6 Months", fitsAll: false, fitments: [...F("Maruti Suzuki", "Swift"), ...F("Volkswagen", "Polo")] },

  // ── Lighting ── (mostly universal)
  { name: "RGB Ambient Light Kit", categoryId: 30, tags: ["AmbientLight", "RGB", "AppControl", "Universal"], basePrice: 2400, sale: 0.7, dims: [{ name: "Lights", values: ["4-Piece", "6-Piece"] }], isBestseller: true, isFeatured: true, material: "Fibre Optic", warranty: "1 Year", fitsAll: true },
  { name: "Footwell Ambient Glow", categoryId: 30, tags: ["AmbientLight", "Footwell", "Universal"], basePrice: 1600, sale: 0.75, dims: [{ name: "Colour", values: ["Ice Blue", "Red", "Multicolour"] }], isNew: true, material: "LED", warranty: "1 Year", fitsAll: true },
  { name: "Projector LED Headlights", categoryId: 31, tags: ["Headlight", "LED", "Projector"], basePrice: 14500, sale: 0.88, material: "Polycarbonate", warranty: "1 Year", fitsAll: false, fitments: [...F("Maruti Suzuki", "Swift"), ...F("Hyundai", "i20")] },
  { name: "LED Smoked Tail Lights", categoryId: 32, tags: ["TailLight", "LED", "Smoked"], basePrice: 11800, sale: 0.9, isNew: true, material: "Polycarbonate", warranty: "1 Year", fitsAll: false, fitments: [...F("Tata", "Nexon", "Altroz")] },

  // ── Exhausts & Tips ──
  { name: "Cat-Back Sport Exhaust", categoryId: 40, tags: ["Exhaust", "CatBack", "StainlessSteel"], basePrice: 22000, sale: 0.9, dims: [{ name: "Tip", values: ["Single", "Dual"] }], isBestseller: true, isFeatured: true, material: "SS304 Stainless Steel", warranty: "1 Year", fitsAll: false, fitments: [...F("Volkswagen", "Polo", "Virtus"), ...F("Skoda", "Kushaq")] },
  { name: "Burnt Tip Exhaust Set", categoryId: 41, tags: ["ExhaustTip", "StainlessSteel", "BoltOn", "Universal"], basePrice: 1800, sale: 0.7, dims: [{ name: "Inlet", values: ['2.0"', '2.5"'] }, { name: "Style", values: ["Burnt Blue", "Carbon"] }], isBestseller: true, material: "SS304 Stainless Steel", warranty: "6 Months", fitsAll: true },

  // ── Interior ──
  { name: "Aluminium Paddle Shifters", categoryId: 50, tags: ["PaddleShifter", "Aluminium", "Universal"], basePrice: 2200, sale: 0.75, dims: [{ name: "Finish", values: ["Silver", "Red", "Black"] }], isBestseller: true, material: "CNC Aluminium", warranty: "1 Year", fitsAll: true },
  { name: "Carbon Interior Trim Set", categoryId: 52, tags: ["InteriorTrim", "CarbonFibre", "Universal"], basePrice: 3400, sale: 0.8, isNew: true, material: "Carbon Fibre Vinyl", warranty: "6 Months", fitsAll: true },

  // ── Audio ── (universal)
  { name: "Component Speaker Upgrade", categoryId: 70, tags: ["Speakers", "Component", "Audio"], basePrice: 6500, sale: 0.85, dims: [{ name: "Size", values: ['5.25"', '6.5"'] }], isFeatured: true, material: "Silk Dome / Polypropylene", warranty: "1 Year", fitsAll: true },
  { name: "Under-Seat Active Subwoofer", categoryId: 71, tags: ["Subwoofer", "UnderSeat", "Amplified"], basePrice: 9200, sale: 0.9, isNew: true, material: "Composite Enclosure", warranty: "1 Year", fitsAll: true },
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
