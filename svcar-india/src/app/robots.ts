import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Allow public pages; keep account/checkout/admin/API surfaces out of the index. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account", "/orders", "/cart", "/checkout", "/login", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
