import { Hono } from "hono";
import { asc, isNull } from "drizzle-orm";
import { CategoryListSchema, type Category } from "@veronica/contracts";
import type { DbClient } from "../db/client.js";
import { categories } from "../db/schema.js";
import type { AppEnv } from "../lib/types.js";

export function makeCategoriesRouter(db: DbClient) {
  const router = new Hono<AppEnv>();

  // GET /categories — root categories (parent_id IS NULL), ordered by sort_order.
  router.get("/", async (c) => {
    const rows = await db
      .select()
      .from(categories)
      .where(isNull(categories.parentId))
      .orderBy(asc(categories.sortOrder));

    const payload: Category[] = rows.map((row) => ({
      id: row.id,
      parentId: row.parentId,
      name: row.name,
      slug: row.slug,
      description: row.description ?? "",
      image: row.imageUrl ?? undefined,
      sortOrder: row.sortOrder,
    }));

    return c.json(CategoryListSchema.parse(payload));
  });

  return router;
}
