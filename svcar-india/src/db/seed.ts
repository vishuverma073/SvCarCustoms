import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "svcar.db");

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

// Delete existing DB for fresh seed
if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
}

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite, { schema });

// ─── Create tables manually (no migrations needed for seed) ──
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    category_id INTEGER REFERENCES categories(id),
    base_price REAL NOT NULL,
    sale_price REAL,
    discount INTEGER,
    is_bestseller INTEGER DEFAULT 0,
    is_new INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    tags TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS product_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt TEXT,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS product_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    value TEXT NOT NULL,
    price_adjustment REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    items TEXT NOT NULL,
    total_amount REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// ─── Seed Categories ─────────────────────────────────────────
// Root categories — autoincrement ids 1-7 match the canonical taxonomy
// root ids (Body Kits=1 … Audio=7). Products reference these root ids.
const categoryData = [
    {
        name: "Body Kits",
        slug: "body-kits",
        description: "Full body kits, front splitters and rear diffusers",
        image: "https://placehold.co/800x800/0C0C0D/C8A24B/png?text=Body+Kits",
        sortOrder: 1,
    },
    {
        name: "Spoilers",
        slug: "spoilers",
        description: "Lip spoilers and GT wings for added downforce and style",
        image: "https://placehold.co/800x800/0C0C0D/C8A24B/png?text=Spoilers",
        sortOrder: 2,
    },
    {
        name: "Lighting",
        slug: "lighting",
        description: "Ambient lights, headlights, DRLs and tail lights",
        image: "https://placehold.co/800x800/0C0C0D/C8A24B/png?text=Lighting",
        sortOrder: 3,
    },
    {
        name: "Exhausts & Tips",
        slug: "exhausts",
        description: "Performance exhaust systems and stainless exhaust tips",
        image: "https://placehold.co/800x800/0C0C0D/C8A24B/png?text=Exhausts+%26+Tips",
        sortOrder: 4,
    },
    {
        name: "Interior",
        slug: "interior",
        description: "Paddle shifters, custom interiors and interior trims",
        image: "https://placehold.co/800x800/0C0C0D/C8A24B/png?text=Interior",
        sortOrder: 5,
    },
    {
        name: "Exterior",
        slug: "exterior",
        description: "Custom exteriors and complete styling kits",
        image: "https://placehold.co/800x800/0C0C0D/C8A24B/png?text=Exterior",
        sortOrder: 6,
    },
    {
        name: "Audio",
        slug: "audio",
        description: "Component speakers and subwoofers for car audio upgrades",
        image: "https://placehold.co/800x800/0C0C0D/C8A24B/png?text=Audio",
        sortOrder: 7,
    },
];

for (const cat of categoryData) {
    db.insert(schema.categories).values(cat).run();
}

console.log(`✅ Seeded ${categoryData.length} categories`);

// ─── Seed Products ───────────────────────────────────────────
const productData = [
    // Body Kits (category 1) — Full Body Kits / Front Splitters
    {
        name: "Apex Aero Full Body Kit",
        slug: "apex-aero-full-body-kit",
        description:
            "Complete aero body kit with front bumper, side skirts and rear diffuser. Aggressive styling that bolts on for an OEM-plus fit.",
        categoryId: 1,
        basePrice: 42000,
        salePrice: 35999,
        discount: 14,
        isBestseller: true,
        isNew: false,
        tags: '["BoltOn","OEMFit","AeroKit","ABSPlastic"]',
        images: [
            { url: "https://placehold.co/800x800/0C0C0D/C8A24B/png?text=Apex+Aero+Full+Body+Kit", alt: "Apex Aero Full Body Kit" },
            { url: "https://placehold.co/800x800/0C0C0D/C8A24B/png?text=Apex+Aero+Front+Bumper", alt: "Apex Aero front bumper" },
        ],
        variants: [
            { name: "Finish", value: "Gloss Black", priceAdjustment: 0 },
            { name: "Finish", value: "Matte Black", priceAdjustment: 0 },
            { name: "Finish", value: "Carbon Fibre", priceAdjustment: 16000 },
        ],
    },
    {
        name: "Street Stance Wide Body Kit",
        slug: "street-stance-wide-body-kit",
        description:
            "Wide-arch body kit for an aggressive stance. Includes fender flares, bumpers and side skirts for a flush bolt-on fit.",
        categoryId: 1,
        basePrice: 38000,
        salePrice: 32999,
        discount: 13,
        isBestseller: true,
        isNew: false,
        tags: '["WideBody","BoltOn","OEMFit","ABSPlastic"]',
        images: [
            { url: "https://placehold.co/800x800/0C0C0D/C8A24B/png?text=Street+Stance+Wide+Body+Kit", alt: "Street Stance Wide Body Kit" },
        ],
        variants: [
            { name: "Fitment", value: "Universal", priceAdjustment: 0 },
            { name: "Fitment", value: "Vehicle-Specific", priceAdjustment: 8000 },
        ],
    },
    {
        name: "Carbon Fibre Front Splitter",
        slug: "carbon-fibre-front-splitter",
        description:
            "Universal-fit front splitter that adds front-end aggression and downforce. Available in carbon fibre and gloss black finishes.",
        categoryId: 1,
        basePrice: 9500,
        salePrice: 7499,
        discount: 21,
        isBestseller: false,
        isNew: true,
        tags: '["CarbonFibre","Universal","BoltOn","Aero"]',
        images: [
            { url: "https://placehold.co/800x800/0C0C0D/C8A24B/png?text=Carbon+Fibre+Front+Splitter", alt: "Carbon Fibre Front Splitter" },
            { url: "https://placehold.co/800x800/0C0C0D/C8A24B/png?text=Front+Splitter+Detail", alt: "Front Splitter detail" },
        ],
        variants: [
            { name: "Finish", value: "Carbon Fibre", priceAdjustment: 0 },
            { name: "Finish", value: "Gloss Black", priceAdjustment: -3000 },
        ],
    },
    // Spoilers (category 2) — Lip Spoilers / GT Wings
    {
        name: "Ducktail Boot Lip Spoiler",
        slug: "ducktail-boot-lip-spoiler",
        description:
            "Subtle ducktail boot-lip spoiler for clean OEM-style styling. 3M adhesive backed for a no-drill installation.",
        categoryId: 2,
        basePrice: 4500,
        salePrice: 3299,
        discount: 27,
        isBestseller: true,
        isNew: false,
        tags: '["BoltOn","OEMFit","Universal","Adhesive"]',
        images: [
            { url: "https://placehold.co/800x800/0C0C0D/C8A24B/png?text=Ducktail+Boot+Lip+Spoiler", alt: "Ducktail Boot Lip Spoiler" },
        ],
        variants: [
            { name: "Finish", value: "Gloss Black", priceAdjustment: 0 },
            { name: "Finish", value: "Carbon Fibre", priceAdjustment: 2000 },
        ],
    },
    {
        name: "Pro GT Wing Spoiler",
        slug: "pro-gt-wing-spoiler",
        description:
            "High-mount GT wing for serious downforce and a motorsport look. Aluminium stands with an adjustable blade angle.",
        categoryId: 2,
        basePrice: 8500,
        salePrice: 6499,
        discount: 24,
        isBestseller: false,
        isNew: true,
        tags: '["CarbonFibre","BoltOn","Adjustable","Aero"]',
        images: [
            { url: "https://placehold.co/800x800/0C0C0D/C8A24B/png?text=Pro+GT+Wing+Spoiler", alt: "Pro GT Wing Spoiler" },
        ],
        variants: [
            { name: "Finish", value: "Gloss Black", priceAdjustment: 0 },
            { name: "Finish", value: "Carbon Fibre", priceAdjustment: 3000 },
        ],
    },
    // Lighting (category 3) — Ambient Lights / Tail Lights
    {
        name: "RGB Ambient Interior Light Kit",
        slug: "rgb-ambient-interior-light-kit",
        description:
            "App-controlled RGB ambient lighting kit with fibre-optic strips. Sound-reactive modes and millions of colours for a custom cabin glow.",
        categoryId: 3,
        basePrice: 2800,
        salePrice: 1999,
        discount: 29,
        isBestseller: true,
        isNew: false,
        tags: '["RGB","AppControl","Universal","PlugAndPlay"]',
        images: [
            { url: "https://placehold.co/800x800/0C0C0D/C8A24B/png?text=RGB+Ambient+Interior+Light+Kit", alt: "RGB Ambient Interior Light Kit" },
        ],
        variants: [
            { name: "Fitment", value: "4 Strip Kit", priceAdjustment: 0 },
            { name: "Fitment", value: "6 Strip Kit", priceAdjustment: 1400 },
        ],
    },
    {
        name: "Smoked LED Sequential Tail Lights",
        slug: "smoked-led-sequential-tail-lights",
        description:
            "Smoked LED tail light set with flowing sequential indicators. Direct OEM-replacement fit for a clean custom rear look.",
        categoryId: 3,
        basePrice: 12500,
        salePrice: 9999,
        discount: 20,
        isBestseller: false,
        isNew: true,
        tags: '["LED","Sequential","OEMFit","PlugAndPlay"]',
        images: [
            { url: "https://placehold.co/800x800/0C0C0D/C8A24B/png?text=Smoked+LED+Sequential+Tail+Lights", alt: "Smoked LED Sequential Tail Lights" },
        ],
        variants: [
            { name: "Finish", value: "Smoked", priceAdjustment: 0 },
            { name: "Finish", value: "Clear", priceAdjustment: 0 },
        ],
    },
    // Exhausts & Tips (category 4) — Exhaust Systems / Exhaust Tips
    {
        name: "Cat-Back Performance Exhaust System",
        slug: "cat-back-performance-exhaust-system",
        description:
            "Full stainless steel cat-back exhaust system with a deep sporty tone. Mandrel-bent piping for improved flow and a bolt-on fit.",
        categoryId: 4,
        basePrice: 28000,
        salePrice: 22999,
        discount: 18,
        isBestseller: true,
        isNew: false,
        tags: '["StainlessSteel","BoltOn","CatBack","Performance"]',
        images: [
            { url: "https://placehold.co/800x800/0C0C0D/C8A24B/png?text=Cat-Back+Performance+Exhaust+System", alt: "Cat-Back Performance Exhaust System" },
        ],
        variants: [
            { name: "Tip Finish", value: "Polished Steel", priceAdjustment: 0 },
            { name: "Tip Finish", value: "Carbon Fibre", priceAdjustment: 4000 },
        ],
    },
    {
        name: "Carbon Fibre Slant-Cut Exhaust Tip",
        slug: "carbon-fibre-slant-cut-exhaust-tip",
        description:
            "Universal slant-cut exhaust tip with a real carbon fibre sleeve and stainless inner. Clamp-on fit for most tailpipes.",
        categoryId: 4,
        basePrice: 1800,
        salePrice: 1299,
        discount: 28,
        isBestseller: false,
        isNew: false,
        tags: '["CarbonFibre","Universal","BoltOn","ClampOn"]',
        images: [
            { url: "https://placehold.co/800x800/0C0C0D/C8A24B/png?text=Carbon+Fibre+Slant-Cut+Exhaust+Tip", alt: "Carbon Fibre Slant-Cut Exhaust Tip" },
        ],
        variants: [
            { name: "Length", value: "120mm", priceAdjustment: 0 },
            { name: "Length", value: "150mm", priceAdjustment: 600 },
        ],
    },
    // Interior (category 5) — Paddle Shifters / Interior Trims
    {
        name: "Aluminium Paddle Shifter Extensions",
        slug: "aluminium-paddle-shifter-extensions",
        description:
            "CNC-machined aluminium paddle shifter extensions for a premium feel and easier reach. Vehicle-specific clip-on fit with no wiring.",
        categoryId: 5,
        basePrice: 2500,
        salePrice: 1899,
        discount: 24,
        isBestseller: true,
        isNew: false,
        tags: '["Aluminium","BoltOn","OEMFit","ClipOn"]',
        images: [
            { url: "https://placehold.co/800x800/0C0C0D/C8A24B/png?text=Aluminium+Paddle+Shifter+Extensions", alt: "Aluminium Paddle Shifter Extensions" },
        ],
        variants: [
            { name: "Finish", value: "Red", priceAdjustment: 0 },
            { name: "Finish", value: "Silver", priceAdjustment: 0 },
            { name: "Finish", value: "Black", priceAdjustment: 0 },
        ],
    },
    {
        name: "Carbon Fibre Interior Trim Kit",
        slug: "carbon-fibre-interior-trim-kit",
        description:
            "Self-adhesive carbon fibre interior trim overlay kit for dashboard, centre console and door panels. Custom-cut for a tailored fit.",
        categoryId: 5,
        basePrice: 6500,
        salePrice: 4999,
        discount: 23,
        isBestseller: false,
        isNew: true,
        tags: '["CarbonFibre","BoltOn","OEMFit","Adhesive"]',
        images: [
            { url: "https://placehold.co/800x800/0C0C0D/C8A24B/png?text=Carbon+Fibre+Interior+Trim+Kit", alt: "Carbon Fibre Interior Trim Kit" },
        ],
        variants: [
            { name: "Fitment", value: "Vehicle-Specific", priceAdjustment: 0 },
        ],
    },
    // Exterior (category 6) — Custom Kits
    {
        name: "Murdered-Out Blackout Styling Kit",
        slug: "murdered-out-blackout-styling-kit",
        description:
            "Complete blackout styling kit with grille surround, badge overlays and chrome-delete trims. Transform exterior chrome into gloss black.",
        categoryId: 6,
        basePrice: 16000,
        salePrice: 12999,
        discount: 19,
        isBestseller: true,
        isNew: false,
        tags: '["BoltOn","Universal","BlackoutKit","ChromeDelete"]',
        images: [
            { url: "https://placehold.co/800x800/0C0C0D/C8A24B/png?text=Murdered-Out+Blackout+Styling+Kit", alt: "Murdered-Out Blackout Styling Kit" },
        ],
        variants: [
            { name: "Fitment", value: "Universal", priceAdjustment: 0 },
            { name: "Fitment", value: "Vehicle-Specific", priceAdjustment: 6000 },
        ],
    },
    // Audio (category 7) — Speakers / Subwoofers
    {
        name: "Pro Component Speaker System",
        slug: "pro-component-speaker-system",
        description:
            "6.5 inch 2-way component speaker system with silk-dome tweeters and crossovers. Crisp highs and punchy mids for a serious audio upgrade.",
        categoryId: 7,
        basePrice: 7500,
        salePrice: 5999,
        discount: 20,
        isBestseller: true,
        isNew: false,
        tags: '["BoltOn","OEMFit","Universal","Audio"]',
        images: [
            { url: "https://placehold.co/800x800/0C0C0D/C8A24B/png?text=Pro+Component+Speaker+System", alt: "Pro Component Speaker System" },
        ],
        variants: [
            { name: "Size", value: "6.5 inch", priceAdjustment: 0 },
            { name: "Size", value: "6x9 inch", priceAdjustment: 2000 },
        ],
    },
    {
        name: "Active Underseat Subwoofer",
        slug: "active-underseat-subwoofer",
        description:
            "Slim active underseat subwoofer with a built-in amplifier. Deep, controlled bass that fits discreetly under the seat.",
        categoryId: 7,
        basePrice: 9500,
        salePrice: 7499,
        discount: 21,
        isBestseller: false,
        isNew: true,
        tags: '["Active","Universal","Slim","Audio"]',
        images: [
            { url: "https://placehold.co/800x800/0C0C0D/C8A24B/png?text=Active+Underseat+Subwoofer", alt: "Active Underseat Subwoofer" },
        ],
        variants: [
            { name: "Size", value: "8 inch", priceAdjustment: 0 },
            { name: "Size", value: "10 inch", priceAdjustment: 4500 },
        ],
    },
];

for (const product of productData) {
    const { images, variants, ...productFields } = product;

    // Insert product
    const result = db
        .insert(schema.products)
        .values(productFields as typeof schema.products.$inferInsert)
        .run();

    const productId = Number(result.lastInsertRowid);

    // Insert images
    for (let i = 0; i < images.length; i++) {
        db.insert(schema.productImages)
            .values({
                productId,
                url: images[i].url,
                alt: images[i].alt,
                sortOrder: i,
            })
            .run();
    }

    // Insert variants
    for (const variant of variants) {
        db.insert(schema.productVariants)
            .values({
                productId,
                name: variant.name,
                value: variant.value,
                priceAdjustment: variant.priceAdjustment,
            })
            .run();
    }
}

console.log(`✅ Seeded ${productData.length} products with images and variants`);

// ─── Seed Sample Orders ──────────────────────────────────────
const orderData = [
    {
        orderNumber: "VE20240501A",
        customerName: "Aditya Sharma",
        customerPhone: "9876543210",
        items: JSON.stringify([
            { name: "Ducktail Boot Lip Spoiler", qty: 1, price: 3299, variant: "Gloss Black" },
            { name: "Carbon Fibre Slant-Cut Exhaust Tip", qty: 1, price: 1299, variant: "120mm" },
        ]),
        totalAmount: 4598,
        status: "delivered" as const,
    },
    {
        orderNumber: "VE20240502B",
        customerName: "Priya Singh",
        customerPhone: "9123456780",
        items: JSON.stringify([
            { name: "RGB Ambient Interior Light Kit", qty: 2, price: 1999, variant: "4 Strip Kit" },
        ]),
        totalAmount: 3998,
        status: "confirmed" as const,
    },
    {
        orderNumber: "VE20240503C",
        customerName: "Rahul Gupta",
        customerPhone: "9988776655",
        items: JSON.stringify([
            { name: "Cat-Back Performance Exhaust System", qty: 1, price: 22999, variant: "Polished Steel" },
            { name: "Aluminium Paddle Shifter Extensions", qty: 1, price: 1899, variant: "Red" },
            { name: "Pro Component Speaker System", qty: 1, price: 5999, variant: "6.5 inch" },
        ]),
        totalAmount: 30897,
        status: "pending" as const,
    },
];

for (const order of orderData) {
    db.insert(schema.orders).values(order).run();
}

console.log("✅ Seeded 3 sample orders");
console.log("\n🎉 Database seeded successfully!");

sqlite.close();
