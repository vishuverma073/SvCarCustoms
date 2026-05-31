import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "veronica.db");

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
const categoryData = [
    {
        name: "Kitchen Sinks",
        slug: "kitchen-sinks",
        description: "Premium quartz and stainless steel kitchen sinks",
        image: "/uploads/categories/cat-1.webp",
        sortOrder: 1,
    },
    {
        name: "Health Faucets",
        slug: "health-faucets",
        description: "ABS and brass health faucet sets",
        image: "/uploads/categories/cat-2.webp",
        sortOrder: 2,
    },
    {
        name: "Bathroom Accessories",
        slug: "bathroom-accessories",
        description: "Floor drains, gratings, and bathroom essentials",
        image: "/uploads/categories/hero-1.webp",
        sortOrder: 3,
    },
    {
        name: "Plumbing & Fittings",
        slug: "plumbing-fittings",
        description: "Shower tubes, connection pipes, waste couplings",
        image: "/uploads/categories/hero-2.webp",
        sortOrder: 4,
    },
];

for (const cat of categoryData) {
    db.insert(schema.categories).values(cat).run();
}

console.log("✅ Seeded 4 categories");

// ─── Seed Products ───────────────────────────────────────────
const productData = [
    // Kitchen Sinks
    {
        name: "Orchid Square Single Bowl Quartz Sink",
        slug: "orchid-square-single-bowl-quartz-sink",
        description:
            "Premium quartz kitchen sink with deep single bowl design. Built to last with superior acid resistance and UV protection.",
        categoryId: 1,
        basePrice: 18500,
        salePrice: 8499,
        discount: 54,
        isBestseller: true,
        isNew: false,
        tags: '["RustProof","AcidResistant","ScratchProof","UV-Resistant"]',
        images: [
            { url: "/uploads/products/sink-1.webp", alt: "Orchid Square Sink top view" },
            { url: "/uploads/products/sink-2.jpeg", alt: "Orchid Square Sink angle view" },
        ],
        variants: [
            { name: "Size", value: "24×18", priceAdjustment: 0 },
            { name: "Size", value: "24×20", priceAdjustment: 500 },
            { name: "Size", value: "32×20", priceAdjustment: 1500 },
        ],
    },
    {
        name: "Crystal Double Bowl Quartz Sink",
        slug: "crystal-double-bowl-quartz-sink",
        description:
            "Elegant double bowl quartz sink with divider. Perfect for modern kitchens that demand both style and functionality.",
        categoryId: 1,
        basePrice: 24000,
        salePrice: 12999,
        discount: 46,
        isBestseller: true,
        isNew: false,
        tags: '["RustProof","AcidResistant","DoubleGelCoat","ScratchProof"]',
        images: [
            { url: "/uploads/products/sink-3.webp", alt: "Crystal Double Bowl top view" },
        ],
        variants: [
            { name: "Size", value: "32×20", priceAdjustment: 0 },
            { name: "Size", value: "36×20", priceAdjustment: 2000 },
        ],
    },
    {
        name: "Nova Stainless Steel Single Bowl Sink",
        slug: "nova-stainless-steel-single-bowl-sink",
        description:
            "Heavy-gauge stainless steel sink with satin finish. Comes with complete drain assembly and waste coupling.",
        categoryId: 1,
        basePrice: 15750,
        salePrice: 7299,
        discount: 54,
        isBestseller: false,
        isNew: true,
        tags: '["StainlessSteel","SatinFinish","HeavyGauge","AntiNoise"]',
        images: [
            { url: "/uploads/products/sink-4.webp", alt: "Nova SS Sink front view" },
            { url: "/uploads/products/sink-5.webp", alt: "Nova SS Sink detail" },
        ],
        variants: [
            { name: "Size", value: "24×18", priceAdjustment: 0 },
            { name: "Size", value: "24×20", priceAdjustment: 400 },
        ],
    },
    {
        name: "Veronica Drain Board Quartz Sink",
        slug: "veronica-drain-board-quartz-sink",
        description:
            "Spacious quartz sink with integrated drain board. Designed for Indian kitchens with maximum workspace.",
        categoryId: 1,
        basePrice: 28000,
        salePrice: 14499,
        discount: 48,
        isBestseller: false,
        isNew: true,
        tags: '["DrainBoard","QuartzStone","UV-Resistant","AcidResistant"]',
        images: [
            { url: "/uploads/products/sink-1.webp", alt: "Drain Board Sink" },
        ],
        variants: [
            { name: "Size", value: "36×20", priceAdjustment: 0 },
            { name: "Size", value: "40×20", priceAdjustment: 3000 },
        ],
    },
    // Health Faucets
    {
        name: "Veronica Premium ABS Health Faucet Set",
        slug: "veronica-premium-abs-health-faucet-set",
        description:
            "Complete health faucet set with ABS gun, stainless steel tube, and wall hook. Chrome-plated for lasting shine.",
        categoryId: 2,
        basePrice: 1200,
        salePrice: 549,
        discount: 54,
        isBestseller: true,
        isNew: false,
        tags: '["ChromePlated","ABSBody","Complete Set","EasyInstall"]',
        images: [
            { url: "/uploads/products/faucet-1.webp", alt: "ABS Health Faucet Set" },
        ],
        variants: [
            { name: "Type", value: "ABS Standard", priceAdjustment: 0 },
            { name: "Type", value: "ABS Premium", priceAdjustment: 200 },
        ],
    },
    {
        name: "Veronica Brass Health Faucet Set",
        slug: "veronica-brass-health-faucet-set",
        description:
            "Heavy-duty brass health faucet with braided tube and angle valve. Built for durability in high-use bathrooms.",
        categoryId: 2,
        basePrice: 2800,
        salePrice: 1399,
        discount: 50,
        isBestseller: false,
        isNew: true,
        tags: '["SolidBrass","BraidedTube","AngleValve","HeavyDuty"]',
        images: [
            { url: "/uploads/products/faucet-2.webp", alt: "Brass Health Faucet" },
        ],
        variants: [],
    },
    // Bathroom Accessories
    {
        name: "Veronica Square Floor Drain (Cockroach Trap)",
        slug: "veronica-square-floor-drain-cockroach-trap",
        description:
            "Anti-cockroach floor drain with removable trap. Keeps pests out while ensuring smooth water flow.",
        categoryId: 3,
        basePrice: 850,
        salePrice: 399,
        discount: 53,
        isBestseller: true,
        isNew: false,
        tags: '["AntiCockroach","StainlessSteel","RemovableTrap","EasyClean"]',
        images: [
            { url: "/uploads/products/accessory-1.webp", alt: "Square Floor Drain" },
            { url: "/uploads/products/accessory-2.webp", alt: "Floor Drain detail" },
        ],
        variants: [
            { name: "Size", value: "5 inch", priceAdjustment: 0 },
            { name: "Size", value: "6 inch", priceAdjustment: 100 },
        ],
    },
    {
        name: "Veronica Stainless Steel Grating",
        slug: "veronica-stainless-steel-grating",
        description:
            "Heavy-duty bathroom floor grating in premium stainless steel. Anti-slip surface with precision holes.",
        categoryId: 3,
        basePrice: 650,
        salePrice: 299,
        discount: 54,
        isBestseller: false,
        isNew: false,
        tags: '["StainlessSteel","AntiSlip","HeavyDuty","PrecisionCut"]',
        images: [
            { url: "/uploads/products/accessory-3.webp", alt: "SS Grating" },
        ],
        variants: [
            { name: "Size", value: "5 inch", priceAdjustment: 0 },
            { name: "Size", value: "6 inch", priceAdjustment: 80 },
        ],
    },
    {
        name: "Veronica Bathroom Accessories Set (6-Piece)",
        slug: "veronica-bathroom-accessories-set-6-piece",
        description:
            "Complete bathroom accessories set including towel rod, soap dish, tumbler holder, robe hook, toilet paper holder, and shelf.",
        categoryId: 3,
        basePrice: 3500,
        salePrice: 1799,
        discount: 49,
        isBestseller: false,
        isNew: true,
        tags: '["CompletSet","ChromeFinish","WallMount","Modern"]',
        images: [
            { url: "/uploads/products/drain-1.webp", alt: "Bathroom Accessories Set" },
        ],
        variants: [
            { name: "Finish", value: "Chrome", priceAdjustment: 0 },
            { name: "Finish", value: "Matte Black", priceAdjustment: 400 },
        ],
    },
    // Plumbing & Fittings
    {
        name: "Veronica Flexible Shower Tube (1.5m)",
        slug: "veronica-flexible-shower-tube-1-5m",
        description:
            "Premium stainless steel flexible shower tube with brass connectors. Kink-resistant and durable.",
        categoryId: 4,
        basePrice: 750,
        salePrice: 349,
        discount: 53,
        isBestseller: false,
        isNew: false,
        tags: '["StainlessSteel","BrassConnectors","KinkResistant","1.5m"]',
        images: [
            { url: "/uploads/products/shower-1.webp", alt: "Shower Tube" },
        ],
        variants: [
            { name: "Length", value: "1m", priceAdjustment: -50 },
            { name: "Length", value: "1.5m", priceAdjustment: 0 },
            { name: "Length", value: "2m", priceAdjustment: 100 },
        ],
    },
    {
        name: "Veronica Overhead Rain Shower (8 inch)",
        slug: "veronica-overhead-rain-shower-8-inch",
        description:
            "Ultra-slim overhead rain shower with silicone nozzles for easy cleaning. Mirror-finish chrome plate.",
        categoryId: 4,
        basePrice: 2200,
        salePrice: 999,
        discount: 55,
        isBestseller: true,
        isNew: false,
        tags: '["RainShower","UltraSlim","SiliconeNozzles","MirrorFinish"]',
        images: [
            { url: "/uploads/products/shower-2.webp", alt: "Rain Shower" },
        ],
        variants: [
            { name: "Size", value: "6 inch", priceAdjustment: -200 },
            { name: "Size", value: "8 inch", priceAdjustment: 0 },
            { name: "Size", value: "10 inch", priceAdjustment: 300 },
        ],
    },
    {
        name: "Veronica Waste Coupling Set",
        slug: "veronica-waste-coupling-set",
        description:
            "Complete waste coupling set for kitchen sinks. Includes coupling, rubber gaskets, and lock nut.",
        categoryId: 4,
        basePrice: 450,
        salePrice: 199,
        discount: 56,
        isBestseller: false,
        isNew: true,
        tags: '["CompleteSet","UniversalFit","BrassLockNut","RubberGaskets"]',
        images: [
            { url: "/uploads/products/plumbing-1.webp", alt: "Waste Coupling" },
        ],
        variants: [],
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
            { name: "Orchid Square Single Bowl Quartz Sink", qty: 1, price: 8499, variant: "24×18" },
            { name: "Veronica Waste Coupling Set", qty: 1, price: 199 },
        ]),
        totalAmount: 8698,
        status: "delivered" as const,
    },
    {
        orderNumber: "VE20240502B",
        customerName: "Priya Singh",
        customerPhone: "9123456780",
        items: JSON.stringify([
            { name: "Veronica Premium ABS Health Faucet Set", qty: 2, price: 549, variant: "ABS Standard" },
        ]),
        totalAmount: 1098,
        status: "confirmed" as const,
    },
    {
        orderNumber: "VE20240503C",
        customerName: "Rahul Gupta",
        customerPhone: "9988776655",
        items: JSON.stringify([
            { name: "Veronica Overhead Rain Shower (8 inch)", qty: 1, price: 999, variant: "8 inch" },
            { name: "Veronica Flexible Shower Tube (1.5m)", qty: 1, price: 349, variant: "1.5m" },
            { name: "Veronica Square Floor Drain (Cockroach Trap)", qty: 3, price: 399, variant: "6 inch" },
        ]),
        totalAmount: 2545,
        status: "pending" as const,
    },
];

for (const order of orderData) {
    db.insert(schema.orders).values(order).run();
}

console.log("✅ Seeded 3 sample orders");
console.log("\n🎉 Database seeded successfully!");

sqlite.close();
