import { z } from "zod";
import { API_BASE, USE_MOCKS } from "@/lib/api-config";
import { mocksReady } from "@/lib/mocks-ready";
import {
  CategoryListSchema,
  CategoryWithBreadcrumbSchema,
  ProductSchema,
  ProductListItemSchema,
  paginated,
  type Category,
  type CategoryWithBreadcrumb,
  type Product,
  type ProductListItem,
} from "@veronica/contracts";

const ProductPageSchema = paginated(ProductListItemSchema);
export type ProductPage = z.infer<typeof ProductPageSchema>;

export interface ListProductsParams {
  category?: string;
  bestseller?: boolean;
  new?: boolean;
  featured?: boolean;
  q?: string;
  limit?: number;
  cursor?: number;
}

/**
 * Typed client for the Veronica API.
 *
 * Every method fetches `${API_BASE}/<path>` and validates the response against
 * a contracts schema before returning, so a shape mismatch fails loudly here
 * rather than surfacing as a confusing render bug downstream.
 *
 * In dev with NEXT_PUBLIC_USE_MOCKS=true these requests are intercepted by MSW
 * (browser worker for client components, node server for Server Components).
 * In prod they hit NEXT_PUBLIC_API_URL for real.
 *
 * Phase 0 ships only `getCategories()`; Phase 2 extends this with the rest of
 * the storefront read paths and Phase 1 adds the admin methods.
 */

interface FetchOptions {
  /** Next.js fetch cache controls (Server Components only). */
  next?: { revalidate?: number; tags?: string[] };
  /** Validates the parsed JSON body. */
  schema: z.ZodType<unknown>;
}

async function apiFetch<T>(path: string, opts: FetchOptions): Promise<T> {
  // On the client, hold until the MSW worker is intercepting (resolves
  // instantly on the server, where the node MSW server is already listening,
  // and when mocks are off). Prevents on-mount client fetches from escaping.
  if (USE_MOCKS) await mocksReady;

  const url = `${API_BASE}${path}`;
  const res = await fetch(url, opts.next ? { next: opts.next } : undefined);

  if (!res.ok) {
    throw new Error(
      `Backend request failed: GET ${url} → ${res.status} ${res.statusText}`,
    );
  }

  const body = await res.json();
  return opts.schema.parse(body) as T;
}

function buildProductQuery(params: ListProductsParams): string {
  const sp = new URLSearchParams();
  if (params.category) sp.set("category", params.category);
  if (params.bestseller) sp.set("bestseller", "1");
  if (params.new) sp.set("new", "1");
  if (params.featured) sp.set("featured", "1");
  if (params.q) sp.set("q", params.q);
  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.cursor != null) sp.set("cursor", String(params.cursor));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export const backend = {
  /** Root categories for the storefront nav. */
  getCategories(): Promise<Category[]> {
    return apiFetch<Category[]>("/categories", {
      schema: CategoryListSchema,
      next: { revalidate: 3600, tags: ["categories"] },
    });
  },

  /** A category enriched with its direct children + breadcrumb trail. */
  getCategoryBySlug(slug: string): Promise<CategoryWithBreadcrumb> {
    return apiFetch<CategoryWithBreadcrumb>(`/categories/${slug}`, {
      schema: CategoryWithBreadcrumbSchema,
      next: { revalidate: 3600, tags: ["categories", `category:${slug}`] },
    });
  },

  /**
   * Category by numeric id (PDP needs the category of a product it only knows by
   * id). Coordination item: prefer slug-based lookups once the real API lands.
   */
  getCategoryById(id: number): Promise<CategoryWithBreadcrumb> {
    return apiFetch<CategoryWithBreadcrumb>(`/categories/by-id/${id}`, {
      schema: CategoryWithBreadcrumbSchema,
      next: { revalidate: 3600, tags: ["categories", `category-id:${id}`] },
    });
  },

  /** Cursor-paginated light product list (grids/carousels/search). */
  listProducts(params: ListProductsParams = {}): Promise<ProductPage> {
    return apiFetch<ProductPage>(`/products${buildProductQuery(params)}`, {
      schema: ProductPageSchema,
      next: { revalidate: 3600, tags: ["products"] },
    });
  },

  /** Products within a category subtree (convenience over listProducts). */
  getProductsByCategory(slug: string, limit = 24): Promise<ProductListItem[]> {
    return this.listProducts({ category: slug, limit }).then((r) => r.items);
  },

  /** Full product detail for the PDP. */
  getProductBySlug(slug: string): Promise<Product> {
    return apiFetch<Product>(`/products/${slug}`, {
      schema: ProductSchema,
      next: { revalidate: 3600, tags: [`product:${slug}`] },
    });
  },

  /** Free-text product search. */
  searchProducts(q: string, limit = 24): Promise<ProductListItem[]> {
    return this.listProducts({ q, limit }).then((r) => r.items);
  },
};
