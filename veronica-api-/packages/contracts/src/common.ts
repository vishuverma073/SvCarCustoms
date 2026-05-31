import { z } from "zod";

/** Positive integer primary key (Postgres serial). */
export const IdSchema = z.number().int().positive();
export type Id = z.infer<typeof IdSchema>;

/** URL-safe slug: lowercase alphanumerics and dashes. */
export const SlugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9-]+$/, "must be lowercase alphanumerics and dashes");
export type Slug = z.infer<typeof SlugSchema>;

/** Either a site-relative path ("/uploads/x.png") or an absolute http(s) URL. */
export const UrlSchema = z
  .string()
  .refine((v) => v.startsWith("/") || /^https?:\/\//.test(v), {
    message: "must be a relative path starting with '/' or an http(s) URL",
  });
export type Url = z.infer<typeof UrlSchema>;

/** Monetary amount; non-negative. */
export const PriceSchema = z.number().nonnegative();
export type Price = z.infer<typeof PriceSchema>;

/** ISO-8601 datetime string. */
export const TimestampSchema = z.string().datetime();
export type Timestamp = z.infer<typeof TimestampSchema>;
