import { z } from "zod";

export const HeroConfigSchema = z.object({
  imageUrl: z.string(),
  title: z.string(),
  subtitle: z.string(),
  ctaText: z.string(),
  ctaHref: z.string(),
  showFrom: z.string().optional(),
  showTo: z.string().optional(),
});
export type HeroConfig = z.infer<typeof HeroConfigSchema>;

export const PromoConfigSchema = z.object({
  imageUrl: z.string(),
  headline: z.string(),
  ctaText: z.string(),
  ctaHref: z.string(),
});
export type PromoConfig = z.infer<typeof PromoConfigSchema>;

const baseSection = { enabled: z.boolean(), order: z.number().int() };

/** One storefront home-page section, discriminated on `key`. */
export const HomeSectionSchema = z.discriminatedUnion("key", [
  z.object({ key: z.literal("hero"), ...baseSection, config: HeroConfigSchema }),
  z.object({ key: z.literal("bestsellers"), ...baseSection, config: z.object({}) }),
  z.object({ key: z.literal("categories"), ...baseSection, config: z.object({ categoryIds: z.array(z.number().int()) }) }),
  z.object({ key: z.literal("new"), ...baseSection, config: z.object({}) }),
  z.object({ key: z.literal("featured"), ...baseSection, config: z.object({ productIds: z.array(z.number().int()) }) }),
  z.object({ key: z.literal("promo"), ...baseSection, config: PromoConfigSchema }),
]);
export type HomeSection = z.infer<typeof HomeSectionSchema>;

export const HomeConfigSchema = z.object({
  sections: z.array(HomeSectionSchema),
});
export type HomeConfig = z.infer<typeof HomeConfigSchema>;
