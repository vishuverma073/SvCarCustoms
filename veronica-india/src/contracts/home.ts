import { z } from "zod";
import { IdSchema } from "./common";

/**
 * The six home-page section keys. Order is controlled separately (see
 * `HomeConfigSchema.sections`); these keys are the locked contract with the
 * backend — do not rename without a cross-repo version bump.
 */
export const HomeSectionKeySchema = z.enum([
  "hero",
  "categories",
  "bestsellers",
  "new",
  "featured",
  "promo",
]);
export type HomeSectionKey = z.infer<typeof HomeSectionKeySchema>;

/** One row in the composer's ordered section list (drag to reorder, toggle on/off). */
export const HomeSectionSchema = z.object({
  key: HomeSectionKeySchema,
  enabled: z.boolean(),
});
export type HomeSection = z.infer<typeof HomeSectionSchema>;

/** Hero / Promo banners share a shape (promo is just rendered smaller). */
export const BannerConfigSchema = z.object({
  image: z.string(),
  title: z.string(),
  subtitle: z.string().default(""),
  ctaText: z.string().default(""),
  ctaLink: z.string().default(""),
  /** Optional scheduling window (ISO date strings). */
  showFrom: z.string().nullable().default(null),
  showTo: z.string().nullable().default(null),
});
export type BannerConfig = z.infer<typeof BannerConfigSchema>;

export const FeaturedConfigSchema = z.object({
  productIds: z.array(IdSchema),
});
export type FeaturedConfig = z.infer<typeof FeaturedConfigSchema>;

export const CategoriesConfigSchema = z.object({
  categoryIds: z.array(IdSchema),
});
export type CategoriesConfig = z.infer<typeof CategoriesConfigSchema>;

/**
 * Full home configuration. `sections` holds order + enabled flags;
 * the per-section config objects hold the editable content.
 * Bestsellers/New have no config (auto-populated from product flags).
 */
export const HomeConfigSchema = z.object({
  sections: z.array(HomeSectionSchema),
  hero: BannerConfigSchema,
  promo: BannerConfigSchema,
  featured: FeaturedConfigSchema,
  categories: CategoriesConfigSchema,
});
export type HomeConfig = z.infer<typeof HomeConfigSchema>;
