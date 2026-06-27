/**
 * Seeds the database from the one-time copy of the FE catalog data (seed-data.ts).
 *
 * Idempotent: categories/products upsert on their unique slug; each product's
 * child rows (images, dimensions, dimension values, skus) are deleted and
 * re-inserted on every run. Source IDs are NOT preserved — Postgres assigns
 * serials and we remap foreign keys through lookup maps.
 *
 * Run with: pnpm db:seed   (which loads .env via --env-file)
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, inArray } from "drizzle-orm";
import { loadEnv } from "../src/lib/env.js";
import {
  categories as categoriesTable,
  products as productsTable,
  productImages,
  dimensions as dimensionsTable,
  dimensionValues as dimensionValuesTable,
  skus as skusTable,
  productFitments,
  vehicleMakes,
  vehicleModels,
  homeConfig,
  settings,
  type HomeSection,
  type StoreAddress,
} from "../src/db/schema.js";
import { categoriesData, productsData, vehicleMakesData } from "./seed-data.js";

// ─── Safety guard (per agent council) ────────────────────────
// Refuse to run unless the target looks like a dev database.
const dbUrl = process.env.DATABASE_URL ?? "";
if (!dbUrl.includes("-dev") && process.env.I_AM_SURE_NOT_PROD !== "true") {
  console.error(
    "✗ Refusing to seed: DATABASE_URL does not contain '-dev' and I_AM_SURE_NOT_PROD !== 'true'.\n" +
      "  Set I_AM_SURE_NOT_PROD=true in apps/api/.env if this is your dev database.",
  );
  process.exit(1);
}

async function main() {
  const env = loadEnv();
  const sql = postgres(env.DATABASE_URL, { prepare: false });
  const db = drizzle(sql, {
    schema: {
      categories: categoriesTable,
      products: productsTable,
      productImages,
      dimensions: dimensionsTable,
      dimensionValues: dimensionValuesTable,
      skus: skusTable,
      productFitments,
      vehicleMakes,
      vehicleModels,
    },
  });

  let categoryCount = 0;
  let productCount = 0;
  let skuCount = 0;
  let imageCount = 0;
  let dimensionCount = 0;
  let fitmentCount = 0;
  let makeCount = 0;
  let modelCount = 0;

  try {
    await db.transaction(async (tx) => {
      // 1. Categories — root-first so children can reference their (new) parent id.
      const catIdMap = new Map<number, number>(); // sourceId -> dbId
      const roots = categoriesData.filter((c) => c.parentId === null);
      const children = categoriesData.filter((c) => c.parentId !== null);

      for (const c of [...roots, ...children]) {
        const parentDbId =
          c.parentId === null ? null : catIdMap.get(c.parentId);
        if (c.parentId !== null && parentDbId === undefined) {
          throw new Error(
            `Category '${c.slug}' references unknown parent id ${c.parentId} (parents must seed first)`,
          );
        }
        const values = {
          name: c.name,
          slug: c.slug,
          parentId: parentDbId ?? null,
          description: c.description,
          imageUrl: c.image ?? null,
          sortOrder: c.sortOrder,
        };
        const [row] = await tx
          .insert(categoriesTable)
          .values(values)
          .onConflictDoUpdate({
            target: categoriesTable.slug,
            set: {
              name: values.name,
              parentId: values.parentId,
              description: values.description,
              imageUrl: values.imageUrl,
              sortOrder: values.sortOrder,
              updatedAt: new Date(),
            },
          })
          .returning({ id: categoriesTable.id });
        catIdMap.set(c.id, row!.id);
        categoryCount++;
      }

      // 1b. Vehicle makes + models (reference data for the fitment picker).
      //     Seeded before product fitments so the picker's options exist first.
      //     Makes upsert on their unique slug; each make's models are wiped and
      //     re-inserted so re-seeding stays idempotent.
      for (const make of vehicleMakesData) {
        const [makeRow] = await tx
          .insert(vehicleMakes)
          .values({ name: make.name, slug: make.slug, sortOrder: make.sortOrder })
          .onConflictDoUpdate({
            target: vehicleMakes.slug,
            set: { name: make.name, sortOrder: make.sortOrder },
          })
          .returning({ id: vehicleMakes.id });
        const makeDbId = makeRow!.id;
        makeCount++;

        await tx.delete(vehicleModels).where(eq(vehicleModels.makeId, makeDbId));
        if (make.models.length) {
          await tx.insert(vehicleModels).values(
            make.models.map((m) => ({
              makeId: makeDbId,
              name: m.name,
              slug: m.slug,
              yearStart: m.yearStart ?? null,
              yearEnd: m.yearEnd ?? null,
              sortOrder: m.sortOrder,
            })),
          );
          modelCount += make.models.length;
        }
      }

      // 2. Products + their child rows.
      for (const p of productsData) {
        const categoryDbId = catIdMap.get(p.categoryId);
        if (categoryDbId === undefined) {
          throw new Error(
            `Product '${p.slug}' references unknown category id ${p.categoryId}`,
          );
        }

        const [prow] = await tx
          .insert(productsTable)
          .values({
            categoryId: categoryDbId,
            name: p.name,
            slug: p.slug,
            description: p.description,
            status: p.status,
            isBestseller: p.isBestseller,
            isNew: p.isNew,
            tags: p.tags,
            specifications: p.specifications ?? null,
            includedAccessories: p.includedAccessories ?? null,
            fitsAllVehicles: p.fitsAllVehicles ?? true,
          })
          .onConflictDoUpdate({
            target: productsTable.slug,
            set: {
              categoryId: categoryDbId,
              name: p.name,
              description: p.description,
              status: p.status,
              isBestseller: p.isBestseller,
              isNew: p.isNew,
              tags: p.tags,
              specifications: p.specifications ?? null,
              includedAccessories: p.includedAccessories ?? null,
              fitsAllVehicles: p.fitsAllVehicles ?? true,
              updatedAt: new Date(),
            },
          })
          .returning({ id: productsTable.id });
        const productDbId = prow!.id;
        productCount++;

        // Idempotency: wipe this product's existing child rows (FK-safe order).
        const existingDims = await tx
          .select({ id: dimensionsTable.id })
          .from(dimensionsTable)
          .where(eq(dimensionsTable.productId, productDbId));
        const existingDimIds = existingDims.map((d) => d.id);
        if (existingDimIds.length) {
          await tx
            .delete(dimensionValuesTable)
            .where(inArray(dimensionValuesTable.dimensionId, existingDimIds));
        }
        await tx
          .delete(dimensionsTable)
          .where(eq(dimensionsTable.productId, productDbId));
        await tx
          .delete(productImages)
          .where(eq(productImages.productId, productDbId));
        await tx.delete(skusTable).where(eq(skusTable.productId, productDbId));
        await tx
          .delete(productFitments)
          .where(eq(productFitments.productId, productDbId));

        // Images
        if (p.images?.length) {
          await tx.insert(productImages).values(
            p.images.map((url, i) => ({
              productId: productDbId,
              url,
              alt: null,
              sortOrder: i,
            })),
          );
          imageCount += p.images.length;
        }

        // Dimensions + their values
        for (const d of p.dimensions ?? []) {
          const [drow] = await tx
            .insert(dimensionsTable)
            .values({ productId: productDbId, name: d.name, sortOrder: d.sortOrder })
            .returning({ id: dimensionsTable.id });
          dimensionCount++;
          if (d.values?.length) {
            await tx.insert(dimensionValuesTable).values(
              d.values.map((v) => ({
                dimensionId: drow!.id,
                value: v.value,
                label: v.label ?? null,
                sortOrder: v.sortOrder,
              })),
            );
          }
        }

        // SKUs — numeric columns take strings in postgres-js.
        if (p.skus?.length) {
          await tx.insert(skusTable).values(
            p.skus.map((s) => ({
              productId: productDbId,
              skuCode: s.skuCode,
              price: String(s.price),
              salePrice:
                s.salePrice === null || s.salePrice === undefined
                  ? null
                  : String(s.salePrice),
              dimensionValues: s.dimensionValues,
              attributes: s.attributes ?? null,
              stock: s.stock ?? null,
            })),
          );
          skuCount += p.skus.length;
        }

        // Fitments — only for non-universal products. Universal accessories rely
        // on fits_all_vehicles=true and carry no product_fitments rows.
        if (p.fitsAllVehicles === false && p.fitments?.length) {
          await tx.insert(productFitments).values(
            p.fitments.map((f) => ({
              productId: productDbId,
              make: f.make,
              model: f.model,
              yearStart: f.yearStart ?? null,
              yearEnd: f.yearEnd ?? null,
            })),
          );
          fitmentCount += p.fitments.length;
        }
      }

      // 3. Singletons: home-page config + store settings (insert only if absent,
      //    so re-seeding never clobbers admin edits).
      const rootDbIds = roots
        .map((c) => catIdMap.get(c.id))
        .filter((id): id is number => id !== undefined);

      const defaultSections: HomeSection[] = [
        {
          key: "hero",
          enabled: true,
          order: 0,
          config: {
            imageUrl: "/uploads/products/sink-hero-1.png",
            title: "Premium Sanitaryware for Indian Kitchens",
            subtitle: "Quartz & stainless steel sinks, faucets, and fittings",
            ctaText: "Shop Kitchen Sinks",
            ctaHref: "/category/kitchen-sinks",
          },
        },
        { key: "bestsellers", enabled: true, order: 1, config: {} },
        { key: "categories", enabled: true, order: 2, config: { categoryIds: rootDbIds } },
        { key: "new", enabled: true, order: 3, config: {} },
        { key: "featured", enabled: true, order: 4, config: { productIds: [] } },
        {
          key: "promo",
          enabled: true,
          order: 5,
          config: {
            imageUrl: "/uploads/products/accessory-set-1.png",
            headline: "Complete Your Bathroom",
            ctaText: "Explore Accessories",
            ctaHref: "/category/bathroom-accessories",
          },
        },
      ];
      await tx
        .insert(homeConfig)
        .values({ id: 1, sections: defaultSections })
        .onConflictDoNothing();

      const defaultStoreAddress: StoreAddress = {
        line1: "Svcar Sanitary Goods",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110001",
      };
      await tx
        .insert(settings)
        .values({ id: 1, storeAddress: defaultStoreAddress })
        .onConflictDoNothing();
    });

    console.log(
      `✓ Seeded ${categoryCount} categories, ${productCount} products, ${dimensionCount} dimensions, ${skuCount} SKUs, ${imageCount} images, ${makeCount} vehicle makes, ${modelCount} vehicle models, ${fitmentCount} product fitments, + home_config & settings singletons`,
    );
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("✗ Seed failed:", err);
  process.exit(1);
});
