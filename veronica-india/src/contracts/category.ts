import { z } from "zod";
import { IdSchema } from "./common";

/** A catalog category node in the self-referencing tree. */
export const CategorySchema = z.object({
  id: IdSchema,
  parentId: IdSchema.nullable(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().default(""),
  // API returns null for categories without an image; coerce to undefined.
  image: z.string().nullish().transform((v) => v ?? undefined),
  sortOrder: z.number().int().default(0),
  // Admin-curated: which categories appear in the customer header nav. The footer
  // shows every category; the header shows only the ones flagged here.
  showInHeader: z.boolean().default(false),
  // Admin list includes these read-only counts; public list + create payloads omit them.
  childCount: z.number().int().optional(),
  productCount: z.number().int().optional(),
});
export type Category = z.infer<typeof CategorySchema>;

export const CategoryListSchema = z.array(CategorySchema);
export type CategoryList = z.infer<typeof CategoryListSchema>;

/**
 * A category enriched with its direct children and full breadcrumb trail
 * (root → ... → self). Served by `GET /categories/:slug` so the storefront
 * doesn't have to walk the tree client-side.
 */
export const CategoryWithBreadcrumbSchema = CategorySchema.extend({
  children: z.array(CategorySchema),
  breadcrumb: z.array(CategorySchema),
});
export type CategoryWithBreadcrumb = z.infer<typeof CategoryWithBreadcrumbSchema>;

/** Admin create/update payloads. */
export const AdminCategoryCreateSchema = CategorySchema.omit({ id: true }).partial({
  description: true,
  sortOrder: true,
});
export type AdminCategoryCreate = z.infer<typeof AdminCategoryCreateSchema>;

export const AdminCategoryUpdateSchema = AdminCategoryCreateSchema.partial();
export type AdminCategoryUpdate = z.infer<typeof AdminCategoryUpdateSchema>;
