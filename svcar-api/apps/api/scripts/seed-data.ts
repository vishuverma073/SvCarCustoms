// ─── Interfaces ──────────────────────────────────────────────

export interface Category {
    id: number;
    name: string;
    slug: string;
    parentId: number | null; // self-referencing for subcategories
    description: string;
    image?: string; // optional — some intermediate nodes may not need images
    sortOrder: number;
}

export interface VariantDimension {
    id: number;
    name: string; // e.g. "Size", "Gauge", "Type"
    sortOrder: number;
    values: DimensionValue[];
}

export interface DimensionValue {
    id: number;
    value: string; // e.g. "24×18×9", "Heavy"
    label?: string; // optional display label
    sortOrder: number;
}

export interface ProductSKU {
    id: number;
    skuCode: string;
    price: number;
    salePrice: number | null;
    dimensionValues: Record<string, string>; // { "Size": "24×18×9", "Gauge": "Heavy" }
    attributes?: Record<string, string>; // e.g. { "Material": "Carbon Fibre", "Pieces": "4" }
    stock?: number | null; // future use
}

export interface Fitment {
    make: string;
    model: string;
    yearStart?: number | null;
    yearEnd?: number | null;
}

export interface Product {
    id: number;
    name: string;
    slug: string;
    description: string;
    categoryId: number; // references category.id (leaf category)
    isBestseller: boolean;
    isNew: boolean;
    status: "active" | "draft";
    tags: string[];
    images: string[];
    dimensions: VariantDimension[];
    skus: ProductSKU[];
    specifications?: { name: string; value: string }[];
    includedAccessories?: string[];
    // Vehicle fitment. Universal accessories set fitsAllVehicles true and omit
    // fitments; vehicle-specific parts set it false and list compatible cars.
    fitsAllVehicles?: boolean;
    fitments?: Fitment[];
}

export interface VehicleModel {
    name: string;
    slug: string;
    yearStart?: number | null;
    yearEnd?: number | null;
    sortOrder: number;
}

export interface VehicleMake {
    name: string;
    slug: string;
    sortOrder: number;
    models: VehicleModel[];
}

// ─── Sample Data: Categories (self-referencing tree) ─────────

export const categories: Category[] = [
    // ─── Root Categories ───
    {
        id: 1,
        name: "Body Kits",
        slug: "body-kits",
        parentId: null,
        description: "Full body kits, front splitters and rear diffusers",
        image: "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Body+Kits",
        sortOrder: 0,
    },
    {
        id: 2,
        name: "Spoilers",
        slug: "spoilers",
        parentId: null,
        description: "Lip spoilers and GT wings for added downforce and style",
        image: "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Spoilers",
        sortOrder: 1,
    },
    {
        id: 3,
        name: "Lighting",
        slug: "lighting",
        parentId: null,
        description: "Ambient lights, headlights, DRLs and tail lights",
        image: "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Lighting",
        sortOrder: 2,
    },
    {
        id: 4,
        name: "Exhausts & Tips",
        slug: "exhausts",
        parentId: null,
        description: "Performance exhaust systems and stainless exhaust tips",
        image: "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Exhausts+%26+Tips",
        sortOrder: 3,
    },
    {
        id: 5,
        name: "Interior",
        slug: "interior",
        parentId: null,
        description: "Paddle shifters, custom interiors and interior trims",
        image: "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Interior",
        sortOrder: 4,
    },
    {
        id: 6,
        name: "Exterior",
        slug: "exterior",
        parentId: null,
        description: "Custom exteriors and complete styling kits",
        image: "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Exterior",
        sortOrder: 5,
    },
    {
        id: 7,
        name: "Audio",
        slug: "audio",
        parentId: null,
        description: "Component speakers and subwoofers for car audio upgrades",
        image: "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Audio",
        sortOrder: 6,
    },

    // ─── Body Kits → Children ───
    {
        id: 10,
        name: "Full Body Kits",
        slug: "full-body-kits",
        parentId: 1,
        description: "Complete bumper, side skirt and diffuser body kits",
        image: "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Full+Body+Kits",
        sortOrder: 0,
    },
    {
        id: 11,
        name: "Front Splitters",
        slug: "front-splitters",
        parentId: 1,
        description: "Front bumper splitters and lips for an aggressive stance",
        image: "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Front+Splitters",
        sortOrder: 1,
    },
    {
        id: 12,
        name: "Rear Diffusers",
        slug: "rear-diffusers",
        parentId: 1,
        description: "Rear bumper diffusers for a sporty aero look",
        image: "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Rear+Diffusers",
        sortOrder: 2,
    },

    // ─── Spoilers → Children ───
    {
        id: 20,
        name: "Lip Spoilers",
        slug: "lip-spoilers",
        parentId: 2,
        description: "Subtle boot-lip spoilers for clean styling",
        image: "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Lip+Spoilers",
        sortOrder: 0,
    },
    {
        id: 21,
        name: "GT Wings",
        slug: "gt-wings",
        parentId: 2,
        description: "High-mount GT wings for serious downforce and presence",
        image: "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=GT+Wings",
        sortOrder: 1,
    },

    // ─── Lighting → Children ───
    {
        id: 30,
        name: "Ambient Lights",
        slug: "ambient-lights",
        parentId: 3,
        description: "RGB ambient interior lighting kits",
        image: "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Ambient+Lights",
        sortOrder: 0,
    },
    {
        id: 31,
        name: "Headlights & DRLs",
        slug: "headlights-drls",
        parentId: 3,
        description: "Projector headlights and sequential DRL upgrades",
        image: "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Headlights+%26+DRLs",
        sortOrder: 1,
    },
    {
        id: 32,
        name: "Tail Lights",
        slug: "tail-lights",
        parentId: 3,
        description: "LED smoked and sequential tail lights",
        image: "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Tail+Lights",
        sortOrder: 2,
    },

    // ─── Exhausts & Tips → Children ───
    {
        id: 40,
        name: "Exhaust Systems",
        slug: "exhaust-systems",
        parentId: 4,
        description: "Cat-back and axle-back performance exhaust systems",
        image: "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Exhaust+Systems",
        sortOrder: 0,
    },
    {
        id: 41,
        name: "Exhaust Tips",
        slug: "exhaust-tips",
        parentId: 4,
        description: "Stainless steel and carbon fibre exhaust tips",
        image: "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Exhaust+Tips",
        sortOrder: 1,
    },

    // ─── Interior → Children ───
    {
        id: 50,
        name: "Paddle Shifters",
        slug: "paddle-shifters",
        parentId: 5,
        description: "Bolt-on paddle shifter extensions and kits",
        image: "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Paddle+Shifters",
        sortOrder: 0,
    },
    {
        id: 51,
        name: "Custom Interiors",
        slug: "custom-interiors",
        parentId: 5,
        description: "Custom upholstery and full interior makeovers",
        image: "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Custom+Interiors",
        sortOrder: 1,
    },
    {
        id: 52,
        name: "Interior Trims",
        slug: "interior-trims",
        parentId: 5,
        description: "Carbon fibre and gloss interior trim panels",
        image: "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Interior+Trims",
        sortOrder: 2,
    },

    // ─── Exterior → Children ───
    {
        id: 60,
        name: "Custom Exteriors",
        slug: "custom-exteriors",
        parentId: 6,
        description: "Custom exterior styling and accent parts",
        image: "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Custom+Exteriors",
        sortOrder: 0,
    },
    {
        id: 61,
        name: "Custom Kits",
        slug: "custom-kits",
        parentId: 6,
        description: "Complete custom styling kits for popular models",
        image: "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Custom+Kits",
        sortOrder: 1,
    },

    // ─── Audio → Children ───
    {
        id: 70,
        name: "Speakers",
        slug: "speakers",
        parentId: 7,
        description: "Component and coaxial car speakers",
        image: "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Speakers",
        sortOrder: 0,
    },
    {
        id: 71,
        name: "Subwoofers",
        slug: "subwoofers",
        parentId: 7,
        description: "Powered and passive subwoofers for deep bass",
        image: "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Subwoofers",
        sortOrder: 1,
    },
];

// ─── Sample Data: Products ───────────────────────────────────

export const products: Product[] = [
    // ── Body Kits → Full Body Kits (category 10) ──
    {
        id: 1,
        name: "Apex Aero Full Body Kit",
        slug: "apex-aero-full-body-kit",
        description:
            "Complete aero body kit with front bumper, side skirts and rear diffuser. Aggressive styling that bolts on for an OEM-plus fit.",
        categoryId: 10,
        isBestseller: true,
        isNew: false,
        status: "active",
        tags: ["BoltOn", "OEMFit", "AeroKit"],
        images: [
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Apex+Aero+Full+Body+Kit",
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Apex+Aero+Front+Bumper",
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Apex+Aero+Side+Skirt",
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Apex+Aero+Rear+Diffuser",
        ],
        dimensions: [
            {
                id: 1,
                name: "Finish",
                sortOrder: 0,
                values: [
                    { id: 1, value: "Gloss Black", sortOrder: 0 },
                    { id: 2, value: "Matte Black", sortOrder: 1 },
                    { id: 3, value: "Carbon Fibre", sortOrder: 2 },
                ],
            },
        ],
        skus: [
            { id: 1, skuCode: "APX-FBK-GB", price: 42000, salePrice: 35999, dimensionValues: { "Finish": "Gloss Black" }, attributes: { "Material": "ABS Plastic", "Pieces": "4" } },
            { id: 2, skuCode: "APX-FBK-MB", price: 42000, salePrice: null, dimensionValues: { "Finish": "Matte Black" }, attributes: { "Material": "ABS Plastic", "Pieces": "4" } },
            { id: 3, skuCode: "APX-FBK-CF", price: 58000, salePrice: null, dimensionValues: { "Finish": "Carbon Fibre" }, attributes: { "Material": "Carbon Fibre", "Pieces": "4" } },
        ],
        specifications: [
            { name: "Material", value: "ABS Plastic / Carbon Fibre" },
            { name: "Fitment", value: "Bolt-on, no cutting" },
            { name: "Warranty", value: "6 Months" },
        ],
        includedAccessories: ["Front Bumper", "Side Skirts", "Rear Diffuser", "Mounting Hardware"],
        fitsAllVehicles: false,
        fitments: [
            { make: "Hyundai", model: "Creta", yearStart: 2020, yearEnd: null },
            { make: "Kia", model: "Seltos", yearStart: 2019, yearEnd: null },
            { make: "Tata", model: "Harrier", yearStart: 2019, yearEnd: null },
        ],
    },

    {
        id: 2,
        name: "Street Stance Wide Body Kit",
        slug: "street-stance-wide-body-kit",
        description:
            "Wide-arch body kit for an aggressive stance. Includes fender flares, bumpers and side skirts. Designed for a flush bolt-on installation.",
        categoryId: 10,
        isBestseller: false,
        isNew: false,
        status: "active",
        tags: ["WideBody", "BoltOn", "OEMFit"],
        images: [
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Street+Stance+Wide+Body+Kit",
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Street+Stance+Fender+Flare",
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Street+Stance+Installed",
        ],
        dimensions: [
            {
                id: 3,
                name: "Finish",
                sortOrder: 0,
                values: [
                    { id: 7, value: "Gloss Black", sortOrder: 0 },
                    { id: 8, value: "Matte Black", sortOrder: 1 },
                ],
            },
            {
                id: 4,
                name: "Fitment",
                sortOrder: 1,
                values: [
                    { id: 10, value: "Universal", sortOrder: 0 },
                    { id: 11, value: "Vehicle-Specific", sortOrder: 1 },
                ],
            },
        ],
        skus: [
            { id: 9, skuCode: "SSW-GB-UNI", price: 38000, salePrice: null, dimensionValues: { "Finish": "Gloss Black", "Fitment": "Universal" }, attributes: { "Material": "ABS Plastic", "Pieces": "6" } },
            { id: 10, skuCode: "SSW-GB-VS", price: 46000, salePrice: null, dimensionValues: { "Finish": "Gloss Black", "Fitment": "Vehicle-Specific" }, attributes: { "Material": "ABS Plastic", "Pieces": "6" } },
            { id: 11, skuCode: "SSW-MB-UNI", price: 38000, salePrice: null, dimensionValues: { "Finish": "Matte Black", "Fitment": "Universal" }, attributes: { "Material": "ABS Plastic", "Pieces": "6" } },
            { id: 12, skuCode: "SSW-MB-VS", price: 46000, salePrice: null, dimensionValues: { "Finish": "Matte Black", "Fitment": "Vehicle-Specific" }, attributes: { "Material": "ABS Plastic", "Pieces": "6" } },
        ],
        specifications: [
            { name: "Material", value: "ABS Plastic" },
            { name: "Fitment", value: "Bolt-on, minor trimming" },
            { name: "Warranty", value: "6 Months" },
        ],
        includedAccessories: ["Fender Flares", "Front Bumper", "Rear Bumper", "Side Skirts"],
        fitsAllVehicles: false,
        fitments: [
            { make: "Maruti Suzuki", model: "Swift", yearStart: 2018, yearEnd: null },
            { make: "Maruti Suzuki", model: "Baleno", yearStart: 2022, yearEnd: null },
            { make: "Hyundai", model: "i20", yearStart: 2020, yearEnd: null },
        ],
    },

    // ── Body Kits → Front Splitters (category 11) ──
    {
        id: 3,
        name: "Carbon Fibre Front Splitter",
        slug: "carbon-fibre-front-splitter",
        description:
            "Universal-fit front splitter that adds front-end aggression and downforce. Available in carbon fibre and gloss black finishes.",
        categoryId: 11,
        isBestseller: false,
        isNew: true,
        status: "active",
        tags: ["CarbonFibre", "Universal", "BoltOn"],
        images: [
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Carbon+Fibre+Front+Splitter",
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Front+Splitter+Detail",
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Front+Splitter+Installed",
        ],
        dimensions: [
            {
                id: 5,
                name: "Finish",
                sortOrder: 0,
                values: [
                    { id: 12, value: "Carbon Fibre", sortOrder: 0 },
                    { id: 13, value: "Gloss Black", sortOrder: 1 },
                ],
            },
        ],
        skus: [
            { id: 14, skuCode: "CFS-CF", price: 9500, salePrice: 7499, dimensionValues: { Finish: "Carbon Fibre" } },
            { id: 15, skuCode: "CFS-GB", price: 6500, salePrice: 4999, dimensionValues: { Finish: "Gloss Black" } },
        ],
        specifications: [
            { name: "Material", value: "Carbon Fibre / ABS Plastic" },
            { name: "Fitment", value: "Universal, bolt-on" },
            { name: "Warranty", value: "6 Months" },
        ],
        fitsAllVehicles: false,
        fitments: [
            { make: "Honda", model: "City", yearStart: 2020, yearEnd: null },
            { make: "Volkswagen", model: "Virtus", yearStart: 2022, yearEnd: null },
            { make: "Skoda", model: "Slavia", yearStart: 2022, yearEnd: null },
        ],
    },

    // ── Spoilers → Lip Spoilers (category 20) ──
    {
        id: 4,
        name: "Ducktail Boot Lip Spoiler",
        slug: "ducktail-boot-lip-spoiler",
        description:
            "Subtle ducktail boot-lip spoiler for clean OEM-style styling. 3M adhesive backed for a no-drill installation.",
        categoryId: 20,
        isBestseller: true,
        isNew: false,
        status: "active",
        tags: ["BoltOn", "OEMFit", "Universal"],
        images: [
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Ducktail+Boot+Lip+Spoiler",
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Lip+Spoiler+Profile",
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Lip+Spoiler+Installed",
        ],
        dimensions: [
            {
                id: 5,
                name: "Finish",
                sortOrder: 0,
                values: [
                    { id: 14, value: "Gloss Black", sortOrder: 0 },
                    { id: 15, value: "Carbon Fibre", sortOrder: 1 },
                ],
            },
        ],
        skus: [
            { id: 16, skuCode: "DBL-GB", price: 4500, salePrice: 3299, dimensionValues: { Finish: "Gloss Black" }, attributes: { "Mounting": "3M Adhesive" } },
            { id: 17, skuCode: "DBL-CF", price: 6500, salePrice: 4999, dimensionValues: { Finish: "Carbon Fibre" }, attributes: { "Mounting": "3M Adhesive" } },
        ],
        specifications: [
            { name: "Material", value: "ABS Plastic / Carbon Fibre" },
            { name: "Fitment", value: "Bolt-on, no cutting" },
            { name: "Warranty", value: "6 Months" },
        ],
        includedAccessories: ["Lip Spoiler", "3M Adhesive Strip", "Cleaning Wipe"],
        fitsAllVehicles: false,
        fitments: [
            { make: "Maruti Suzuki", model: "Dzire", yearStart: 2017, yearEnd: null },
            { make: "Hyundai", model: "Verna", yearStart: 2020, yearEnd: null },
            { make: "Honda", model: "City", yearStart: 2020, yearEnd: null },
            { make: "Skoda", model: "Slavia", yearStart: 2022, yearEnd: null },
        ],
    },

    // ── Spoilers → GT Wings (category 21) ──
    {
        id: 5,
        name: "Pro GT Wing Spoiler",
        slug: "pro-gt-wing-spoiler",
        description:
            "High-mount GT wing for serious downforce and a motorsport look. Aluminium stands with an adjustable blade angle.",
        categoryId: 21,
        isBestseller: false,
        isNew: true,
        status: "active",
        tags: ["CarbonFibre", "BoltOn", "Adjustable"],
        images: [
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Pro+GT+Wing+Spoiler",
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=GT+Wing+Stand",
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=GT+Wing+Installed",
        ],
        dimensions: [
            {
                id: 6,
                name: "Finish",
                sortOrder: 0,
                values: [
                    { id: 16, value: "Gloss Black", sortOrder: 0 },
                    { id: 17, value: "Carbon Fibre", sortOrder: 1 },
                ],
            },
        ],
        skus: [
            { id: 18, skuCode: "PGW-GB", price: 8500, salePrice: 6499, dimensionValues: { Finish: "Gloss Black" }, attributes: { "Blade Width": "1380mm" } },
            { id: 19, skuCode: "PGW-CF", price: 11500, salePrice: 9499, dimensionValues: { Finish: "Carbon Fibre" }, attributes: { "Blade Width": "1380mm" } },
        ],
        specifications: [
            { name: "Material", value: "Carbon Fibre Blade, Aluminium Stands" },
            { name: "Fitment", value: "Bolt-on, drilling required" },
            { name: "Warranty", value: "6 Months" },
        ],
        includedAccessories: ["GT Wing Blade", "Aluminium Stands", "Mounting Hardware"],
        fitsAllVehicles: false,
        fitments: [
            { make: "Maruti Suzuki", model: "Swift", yearStart: 2018, yearEnd: null },
            { make: "Hyundai", model: "i20", yearStart: 2020, yearEnd: null },
            { make: "Tata", model: "Altroz", yearStart: 2020, yearEnd: null },
        ],
    },

    // ── Lighting → Ambient Lights (category 30) ──
    {
        id: 6,
        name: "RGB Ambient Interior Light Kit",
        slug: "rgb-ambient-interior-light-kit",
        description:
            "App-controlled RGB ambient lighting kit with fibre-optic strips. Sound-reactive modes and millions of colours for a custom cabin glow.",
        categoryId: 30,
        isBestseller: true,
        isNew: false,
        status: "active",
        tags: ["RGB", "AppControl", "Universal"],
        images: [
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=RGB+Ambient+Interior+Light+Kit",
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Ambient+Light+Strip",
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Ambient+Light+Installed",
        ],
        dimensions: [
            {
                id: 7,
                name: "Fitment",
                sortOrder: 0,
                values: [
                    { id: 18, value: "4 Strip Kit", sortOrder: 0 },
                    { id: 19, value: "6 Strip Kit", sortOrder: 1 },
                ],
            },
        ],
        skus: [
            { id: 20, skuCode: "RGB-4", price: 2800, salePrice: 1999, dimensionValues: { Fitment: "4 Strip Kit" }, attributes: { "Strip Length": "4 x 1.2m" } },
            { id: 21, skuCode: "RGB-6", price: 4200, salePrice: 3299, dimensionValues: { Fitment: "6 Strip Kit" }, attributes: { "Strip Length": "6 x 1.2m" } },
        ],
        specifications: [
            { name: "Material", value: "Fibre-Optic Strips" },
            { name: "Control", value: "App & Remote" },
            { name: "Fitment", value: "Universal, plug-and-play" },
            { name: "Warranty", value: "6 Months" },
        ],
        includedAccessories: ["Fibre-Optic Strips", "Control Box", "Remote", "USB Power Lead"],
        fitsAllVehicles: true,
    },

    // ── Lighting → Headlights & DRLs (category 31) ──
    {
        id: 7,
        name: "Sequential LED DRL Projector Headlights",
        slug: "sequential-led-drl-projector-headlights",
        description:
            "Projector headlight assembly with sequential LED DRLs and indicators. Plug-and-play upgrade for a modern front-end look.",
        categoryId: 31,
        isBestseller: false,
        isNew: true,
        status: "active",
        tags: ["LED", "Sequential", "OEMFit"],
        images: [
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Sequential+LED+DRL+Projector+Headlights",
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=LED+DRL+Detail",
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Headlights+Installed",
        ],
        dimensions: [
            {
                id: 8,
                name: "Fitment",
                sortOrder: 0,
                values: [
                    { id: 20, value: "Vehicle-Specific", sortOrder: 0 },
                ],
            },
        ],
        skus: [
            { id: 22, skuCode: "SEQ-HL-VS", price: 18500, salePrice: 14999, dimensionValues: { Fitment: "Vehicle-Specific" }, attributes: { "Pair": "LH + RH" } },
        ],
        specifications: [
            { name: "Material", value: "Polycarbonate Lens" },
            { name: "Fitment", value: "Vehicle-specific, plug-and-play" },
            { name: "Warranty", value: "12 Months" },
        ],
        includedAccessories: ["Left Headlight", "Right Headlight", "Wiring Adapters"],
        fitsAllVehicles: false,
        fitments: [
            { make: "Mahindra", model: "Thar", yearStart: 2020, yearEnd: null },
            { make: "Mahindra", model: "Scorpio-N", yearStart: 2022, yearEnd: null },
            { make: "Toyota", model: "Fortuner", yearStart: 2016, yearEnd: null },
        ],
    },

    // ── Lighting → Tail Lights (category 32) ──
    {
        id: 8,
        name: "Smoked LED Sequential Tail Lights",
        slug: "smoked-led-sequential-tail-lights",
        description:
            "Smoked LED tail light set with flowing sequential indicators. Direct OEM-replacement fit for a clean custom rear look.",
        categoryId: 32,
        isBestseller: true,
        isNew: false,
        status: "active",
        tags: ["LED", "Sequential", "OEMFit"],
        images: [
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Smoked+LED+Sequential+Tail+Lights",
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Tail+Light+Detail",
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Tail+Lights+Installed",
        ],
        dimensions: [
            {
                id: 9,
                name: "Finish",
                sortOrder: 0,
                values: [
                    { id: 21, value: "Smoked", sortOrder: 0 },
                    { id: 22, value: "Clear", sortOrder: 1 },
                ],
            },
        ],
        skus: [
            { id: 23, skuCode: "TL-SMK", price: 12500, salePrice: 9999, dimensionValues: { Finish: "Smoked" }, attributes: { "Pair": "LH + RH" } },
            { id: 24, skuCode: "TL-CLR", price: 12500, salePrice: 9999, dimensionValues: { Finish: "Clear" }, attributes: { "Pair": "LH + RH" } },
        ],
        specifications: [
            { name: "Material", value: "Polycarbonate Lens" },
            { name: "Fitment", value: "OEM-replacement, plug-and-play" },
            { name: "Warranty", value: "12 Months" },
        ],
        includedAccessories: ["Left Tail Light", "Right Tail Light"],
        fitsAllVehicles: false,
        fitments: [
            { make: "Tata", model: "Nexon", yearStart: 2020, yearEnd: null },
            { make: "Tata", model: "Punch", yearStart: 2021, yearEnd: null },
            { make: "Hyundai", model: "Venue", yearStart: 2019, yearEnd: null },
            { make: "Kia", model: "Sonet", yearStart: 2020, yearEnd: null },
        ],
    },

    // ── Exhausts & Tips → Exhaust Systems (category 40) ──
    {
        id: 9,
        name: "Cat-Back Performance Exhaust System",
        slug: "cat-back-performance-exhaust-system",
        description:
            "Full stainless steel cat-back exhaust system with a deep sporty tone. Mandrel-bent piping for improved flow and a bolt-on fit.",
        categoryId: 40,
        isBestseller: true,
        isNew: false,
        status: "active",
        tags: ["StainlessSteel", "BoltOn", "CatBack"],
        images: [
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Cat-Back+Performance+Exhaust+System",
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Exhaust+Muffler+Detail",
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Exhaust+System+Installed",
        ],
        dimensions: [
            {
                id: 10,
                name: "Tip Finish",
                sortOrder: 0,
                values: [
                    { id: 23, value: "Polished Steel", sortOrder: 0 },
                    { id: 24, value: "Carbon Fibre", sortOrder: 1 },
                ],
            },
        ],
        skus: [
            { id: 25, skuCode: "CB-EXH-PS", price: 28000, salePrice: 22999, dimensionValues: { "Tip Finish": "Polished Steel" }, attributes: { "Pipe Diameter": "63mm" } },
            { id: 26, skuCode: "CB-EXH-CF", price: 32000, salePrice: 26999, dimensionValues: { "Tip Finish": "Carbon Fibre" }, attributes: { "Pipe Diameter": "63mm" } },
        ],
        specifications: [
            { name: "Material", value: "T304 Stainless Steel" },
            { name: "Fitment", value: "Bolt-on, no cutting" },
            { name: "Warranty", value: "12 Months" },
        ],
        includedAccessories: ["Mid Pipe", "Muffler", "Exhaust Tip", "Mounting Hardware"],
        fitsAllVehicles: true,
    },

    // ── Exhausts & Tips → Exhaust Tips (category 41) ──
    {
        id: 10,
        name: "Carbon Fibre Slant-Cut Exhaust Tip",
        slug: "carbon-fibre-slant-cut-exhaust-tip",
        description:
            "Universal slant-cut exhaust tip with a real carbon fibre sleeve and stainless inner. Clamp-on fit for most tailpipes.",
        categoryId: 41,
        isBestseller: false,
        isNew: true,
        status: "active",
        tags: ["CarbonFibre", "Universal", "BoltOn"],
        images: [
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Carbon+Fibre+Slant-Cut+Exhaust+Tip",
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Exhaust+Tip+Detail",
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Exhaust+Tip+Installed",
        ],
        dimensions: [
            {
                id: 11,
                name: "Length",
                sortOrder: 0,
                values: [
                    { id: 25, value: "120mm", sortOrder: 0 },
                    { id: 26, value: "150mm", sortOrder: 1 },
                ],
            },
        ],
        skus: [
            { id: 27, skuCode: "CF-TIP-120", price: 1800, salePrice: 1299, dimensionValues: { Length: "120mm" }, attributes: { "Inlet": "54-63mm", "Outlet": "89mm" } },
            { id: 28, skuCode: "CF-TIP-150", price: 2400, salePrice: 1899, dimensionValues: { Length: "150mm" }, attributes: { "Inlet": "54-63mm", "Outlet": "101mm" } },
        ],
        specifications: [
            { name: "Material", value: "Carbon Fibre + Stainless Steel" },
            { name: "Fitment", value: "Universal, clamp-on" },
            { name: "Warranty", value: "6 Months" },
        ],
        fitsAllVehicles: true,
    },

    // ── Interior → Paddle Shifters (category 50) ──
    {
        id: 11,
        name: "Aluminium Paddle Shifter Extensions",
        slug: "aluminium-paddle-shifter-extensions",
        description:
            "CNC-machined aluminium paddle shifter extensions for a premium feel and easier reach. Vehicle-specific clip-on fit with no wiring.",
        categoryId: 50,
        isBestseller: true,
        isNew: false,
        status: "active",
        tags: ["Aluminium", "BoltOn", "OEMFit"],
        images: [
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Aluminium+Paddle+Shifter+Extensions",
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Paddle+Shifter+Detail",
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Paddle+Shifter+Installed",
        ],
        dimensions: [
            {
                id: 12,
                name: "Finish",
                sortOrder: 0,
                values: [
                    { id: 27, value: "Red", sortOrder: 0 },
                    { id: 28, value: "Silver", sortOrder: 1 },
                    { id: 29, value: "Black", sortOrder: 2 },
                ],
            },
        ],
        skus: [
            { id: 29, skuCode: "PAD-RED", price: 2500, salePrice: 1899, dimensionValues: { Finish: "Red" }, attributes: { "Set": "Pair" } },
            { id: 30, skuCode: "PAD-SLV", price: 2500, salePrice: 1899, dimensionValues: { Finish: "Silver" }, attributes: { "Set": "Pair" } },
            { id: 31, skuCode: "PAD-BLK", price: 2500, salePrice: 1899, dimensionValues: { Finish: "Black" }, attributes: { "Set": "Pair" } },
        ],
        specifications: [
            { name: "Material", value: "CNC Aluminium" },
            { name: "Fitment", value: "Vehicle-specific, clip-on" },
            { name: "Warranty", value: "6 Months" },
        ],
        includedAccessories: ["Left Paddle", "Right Paddle", "Adhesive Pads"],
        fitsAllVehicles: true,
    },

    // ── Interior → Interior Trims (category 52) ──
    {
        id: 12,
        name: "Carbon Fibre Interior Trim Kit",
        slug: "carbon-fibre-interior-trim-kit",
        description:
            "Self-adhesive carbon fibre interior trim overlay kit for dashboard, centre console and door panels. Custom-cut for a tailored fit.",
        categoryId: 52,
        isBestseller: false,
        isNew: true,
        status: "active",
        tags: ["CarbonFibre", "BoltOn", "OEMFit"],
        images: [
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Carbon+Fibre+Interior+Trim+Kit",
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Interior+Trim+Detail",
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Interior+Trim+Installed",
        ],
        dimensions: [
            {
                id: 13,
                name: "Fitment",
                sortOrder: 0,
                values: [
                    { id: 30, value: "Vehicle-Specific", sortOrder: 0 },
                ],
            },
        ],
        skus: [
            { id: 32, skuCode: "CF-TRIM-VS", price: 6500, salePrice: 4999, dimensionValues: { Fitment: "Vehicle-Specific" }, attributes: { "Pieces": "12" } },
        ],
        specifications: [
            { name: "Material", value: "Carbon Fibre Vinyl Overlay" },
            { name: "Fitment", value: "Vehicle-specific, self-adhesive" },
            { name: "Warranty", value: "6 Months" },
        ],
        fitsAllVehicles: true,
    },

    // ── Exterior → Custom Kits (category 61) ──
    {
        id: 13,
        name: "Murdered-Out Blackout Styling Kit",
        slug: "murdered-out-blackout-styling-kit",
        description:
            "Complete blackout styling kit with grille surround, badge overlays and chrome-delete trims. Transform exterior chrome into gloss black.",
        categoryId: 61,
        isBestseller: true,
        isNew: false,
        status: "active",
        tags: ["BoltOn", "Universal", "BlackoutKit"],
        images: [
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Murdered-Out+Blackout+Styling+Kit",
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Blackout+Grille+Detail",
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Blackout+Kit+Installed",
        ],
        dimensions: [
            {
                id: 14,
                name: "Fitment",
                sortOrder: 0,
                values: [
                    { id: 31, value: "Universal", sortOrder: 0 },
                    { id: 32, value: "Vehicle-Specific", sortOrder: 1 },
                ],
            },
        ],
        skus: [
            { id: 33, skuCode: "BLK-UNI", price: 16000, salePrice: 12999, dimensionValues: { Fitment: "Universal" } },
            { id: 34, skuCode: "BLK-VS", price: 22000, salePrice: 18999, dimensionValues: { Fitment: "Vehicle-Specific" } },
        ],
        specifications: [
            { name: "Material", value: "ABS Plastic / Gloss Black Vinyl" },
            { name: "Fitment", value: "Bolt-on / self-adhesive" },
            { name: "Warranty", value: "6 Months" },
        ],
        includedAccessories: ["Grille Surround", "Badge Overlays", "Chrome-Delete Trims"],
        fitsAllVehicles: true,
    },

    // ── Audio → Speakers (category 70) ──
    {
        id: 14,
        name: "Pro Component Speaker System",
        slug: "pro-component-speaker-system",
        description:
            "6.5 inch 2-way component speaker system with silk-dome tweeters and crossovers. Crisp highs and punchy mids for a serious audio upgrade.",
        categoryId: 70,
        isBestseller: true,
        isNew: false,
        status: "active",
        tags: ["BoltOn", "OEMFit", "Universal"],
        images: [
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Pro+Component+Speaker+System",
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Component+Tweeter+Detail",
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Speaker+Installed",
        ],
        dimensions: [
            {
                id: 15,
                name: "Size",
                sortOrder: 0,
                values: [
                    { id: 33, value: "6.5 inch", sortOrder: 0 },
                    { id: 34, value: "6x9 inch", sortOrder: 1 },
                ],
            },
        ],
        skus: [
            { id: 35, skuCode: "SPK-65", price: 7500, salePrice: 5999, dimensionValues: { Size: "6.5 inch" }, attributes: { "Power": "180W Peak", "Set": "Pair" } },
            { id: 36, skuCode: "SPK-69", price: 9500, salePrice: 7999, dimensionValues: { Size: "6x9 inch" }, attributes: { "Power": "240W Peak", "Set": "Pair" } },
        ],
        specifications: [
            { name: "Material", value: "Polypropylene Cone, Silk Dome Tweeter" },
            { name: "Fitment", value: "Universal, bolt-on" },
            { name: "Warranty", value: "12 Months" },
        ],
        includedAccessories: ["Woofers", "Tweeters", "Crossovers", "Mounting Brackets"],
        fitsAllVehicles: true,
    },

    // ── Audio → Subwoofers (category 71) ──
    {
        id: 15,
        name: "Active Underseat Subwoofer",
        slug: "active-underseat-subwoofer",
        description:
            "Slim active underseat subwoofer with a built-in amplifier. Deep, controlled bass that fits discreetly under the seat.",
        categoryId: 71,
        isBestseller: false,
        isNew: true,
        status: "active",
        tags: ["Active", "Universal", "Slim"],
        images: [
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Active+Underseat+Subwoofer",
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Subwoofer+Detail",
            "https://placehold.co/800x800/0A0A0A/E11D2A/png?text=Subwoofer+Installed",
        ],
        dimensions: [
            {
                id: 16,
                name: "Size",
                sortOrder: 0,
                values: [
                    { id: 35, value: "8 inch", sortOrder: 0 },
                    { id: 36, value: "10 inch", sortOrder: 1 },
                ],
            },
        ],
        skus: [
            { id: 37, skuCode: "SUB-8", price: 9500, salePrice: 7499, dimensionValues: { Size: "8 inch" }, attributes: { "Power": "150W RMS" } },
            { id: 38, skuCode: "SUB-10", price: 14000, salePrice: 11499, dimensionValues: { Size: "10 inch" }, attributes: { "Power": "220W RMS" } },
        ],
        specifications: [
            { name: "Material", value: "Steel Enclosure, Built-in Amplifier" },
            { name: "Fitment", value: "Universal, underseat mount" },
            { name: "Warranty", value: "12 Months" },
        ],
        includedAccessories: ["Subwoofer Unit", "Wiring Kit", "Remote Bass Knob"],
        fitsAllVehicles: true,
    },
];

// ─── Sample Data: Vehicle makes & models (Indian market) ─────
// Reference data for the storefront's Make → Model → Year fitment picker. The
// `make`/`model` names here MUST match the strings used in product `fitments`
// above so the join in GET /products?make=&model= lines up.

export const vehicleMakes: VehicleMake[] = [
    {
        name: "Maruti Suzuki",
        slug: "maruti-suzuki",
        sortOrder: 0,
        models: [
            { name: "Swift", slug: "swift", yearStart: 2018, yearEnd: null, sortOrder: 0 },
            { name: "Baleno", slug: "baleno", yearStart: 2015, yearEnd: null, sortOrder: 1 },
            { name: "Brezza", slug: "brezza", yearStart: 2016, yearEnd: null, sortOrder: 2 },
            { name: "Dzire", slug: "dzire", yearStart: 2017, yearEnd: null, sortOrder: 3 },
            { name: "Grand Vitara", slug: "grand-vitara", yearStart: 2022, yearEnd: null, sortOrder: 4 },
        ],
    },
    {
        name: "Hyundai",
        slug: "hyundai",
        sortOrder: 1,
        models: [
            { name: "i20", slug: "i20", yearStart: 2020, yearEnd: null, sortOrder: 0 },
            { name: "Creta", slug: "creta", yearStart: 2015, yearEnd: null, sortOrder: 1 },
            { name: "Venue", slug: "venue", yearStart: 2019, yearEnd: null, sortOrder: 2 },
            { name: "Verna", slug: "verna", yearStart: 2017, yearEnd: null, sortOrder: 3 },
        ],
    },
    {
        name: "Tata",
        slug: "tata",
        sortOrder: 2,
        models: [
            { name: "Nexon", slug: "nexon", yearStart: 2017, yearEnd: null, sortOrder: 0 },
            { name: "Harrier", slug: "harrier", yearStart: 2019, yearEnd: null, sortOrder: 1 },
            { name: "Punch", slug: "punch", yearStart: 2021, yearEnd: null, sortOrder: 2 },
            { name: "Altroz", slug: "altroz", yearStart: 2020, yearEnd: null, sortOrder: 3 },
        ],
    },
    {
        name: "Mahindra",
        slug: "mahindra",
        sortOrder: 3,
        models: [
            { name: "Thar", slug: "thar", yearStart: 2020, yearEnd: null, sortOrder: 0 },
            { name: "XUV700", slug: "xuv700", yearStart: 2021, yearEnd: null, sortOrder: 1 },
            { name: "Scorpio-N", slug: "scorpio-n", yearStart: 2022, yearEnd: null, sortOrder: 2 },
            { name: "Bolero", slug: "bolero", yearStart: 2011, yearEnd: null, sortOrder: 3 },
        ],
    },
    {
        name: "Kia",
        slug: "kia",
        sortOrder: 4,
        models: [
            { name: "Seltos", slug: "seltos", yearStart: 2019, yearEnd: null, sortOrder: 0 },
            { name: "Sonet", slug: "sonet", yearStart: 2020, yearEnd: null, sortOrder: 1 },
            { name: "Carens", slug: "carens", yearStart: 2022, yearEnd: null, sortOrder: 2 },
        ],
    },
    {
        name: "Toyota",
        slug: "toyota",
        sortOrder: 5,
        models: [
            { name: "Fortuner", slug: "fortuner", yearStart: 2016, yearEnd: null, sortOrder: 0 },
            { name: "Innova Crysta", slug: "innova-crysta", yearStart: 2016, yearEnd: null, sortOrder: 1 },
            { name: "Glanza", slug: "glanza", yearStart: 2019, yearEnd: null, sortOrder: 2 },
        ],
    },
    {
        name: "Honda",
        slug: "honda",
        sortOrder: 6,
        models: [
            { name: "City", slug: "city", yearStart: 2014, yearEnd: null, sortOrder: 0 },
            { name: "Amaze", slug: "amaze", yearStart: 2018, yearEnd: null, sortOrder: 1 },
            { name: "Elevate", slug: "elevate", yearStart: 2023, yearEnd: null, sortOrder: 2 },
        ],
    },
    {
        name: "Volkswagen",
        slug: "volkswagen",
        sortOrder: 7,
        models: [
            { name: "Virtus", slug: "virtus", yearStart: 2022, yearEnd: null, sortOrder: 0 },
            { name: "Taigun", slug: "taigun", yearStart: 2021, yearEnd: null, sortOrder: 1 },
            { name: "Polo", slug: "polo", yearStart: 2010, yearEnd: 2022, sortOrder: 2 },
        ],
    },
    {
        name: "Skoda",
        slug: "skoda",
        sortOrder: 8,
        models: [
            { name: "Slavia", slug: "slavia", yearStart: 2022, yearEnd: null, sortOrder: 0 },
            { name: "Kushaq", slug: "kushaq", yearStart: 2021, yearEnd: null, sortOrder: 1 },
        ],
    },
    {
        name: "MG",
        slug: "mg",
        sortOrder: 9,
        models: [
            { name: "Hector", slug: "hector", yearStart: 2019, yearEnd: null, sortOrder: 0 },
            { name: "Astor", slug: "astor", yearStart: 2021, yearEnd: null, sortOrder: 1 },
        ],
    },
    {
        name: "BMW",
        slug: "bmw",
        sortOrder: 10,
        models: [
            { name: "3 Series", slug: "3-series", yearStart: 2019, yearEnd: null, sortOrder: 0 },
            { name: "5 Series", slug: "5-series", yearStart: 2017, yearEnd: null, sortOrder: 1 },
            { name: "X1", slug: "x1", yearStart: 2016, yearEnd: null, sortOrder: 2 },
        ],
    },
    {
        name: "Mercedes-Benz",
        slug: "mercedes-benz",
        sortOrder: 11,
        models: [
            { name: "C-Class", slug: "c-class", yearStart: 2014, yearEnd: null, sortOrder: 0 },
            { name: "E-Class", slug: "e-class", yearStart: 2017, yearEnd: null, sortOrder: 1 },
            { name: "GLA", slug: "gla", yearStart: 2021, yearEnd: null, sortOrder: 2 },
        ],
    },
];

// ─── Exports consumed by the seeder (one-time copy of FE data.ts) ───
export const categoriesData = categories;
export const productsData = products;
export const vehicleMakesData = vehicleMakes;
