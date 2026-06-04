/**
 * Canonical site origin for SEO surfaces (sitemap, robots, canonical URLs, OG
 * images, JSON-LD). Defaults to the production domain; override per-environment
 * with NEXT_PUBLIC_SITE_URL (e.g. a preview/staging URL).
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://veronicaindia.com"
).replace(/\/$/, "");

/** Absolute URL for a path under the site origin. */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
