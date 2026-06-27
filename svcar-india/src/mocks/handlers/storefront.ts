import { http, HttpResponse } from "msw";
import { API_BASE } from "@/lib/api-config";
import type { Category, Product } from "@svcar/contracts";
import { productFitsVehicle } from "@svcar/contracts";
import { categories } from "../data/categories";
import { home } from "../data/home";
import { products, toListItem } from "../data/products";
import { makesWithModels } from "../data/vehicles";

/** Narrow a product list to those fitting the make/model/year query params (if any). */
function applyFitment(list: Product[], params: URLSearchParams): Product[] {
  const make = params.get("make");
  const model = params.get("model");
  if (!make || !model) return list;
  const yearRaw = params.get("year");
  const year = yearRaw ? Number(yearRaw) : null;
  const vehicle = { make, model, year: Number.isNaN(year) ? null : year };
  return list.filter((p) => productFitsVehicle(p.fitsAllVehicles, p.fitments, vehicle));
}

/**
 * Public storefront read endpoints (consumed by the `backend` client in Server
 * Components, and search on the client). They serve the SAME in-memory
 * `products`/`categories` arrays the admin handlers mutate — so an admin edit is
 * reflected on the storefront within the mock session.
 */

const byId = (id: number) => categories.find((c) => c.id === id);
const childrenOf = (id: number) =>
  categories
    .filter((c) => c.parentId === id && c.status !== "archived")
    .sort((a, b) => a.sortOrder - b.sortOrder);

/** Ancestors root→parent (exclusive of self). */
function ancestors(categoryId: number): Category[] {
  const out: Category[] = [];
  let current = byId(categoryId);
  while (current && current.parentId !== null) {
    const parent = byId(current.parentId);
    if (parent) out.unshift(parent);
    current = parent;
  }
  return out;
}

/** All category ids in the subtree rooted at categoryId (inclusive). */
function treeIds(categoryId: number): number[] {
  const cat = byId(categoryId);
  if (!cat || cat.status === "archived") return [];
  const ids = [categoryId];
  for (const child of childrenOf(categoryId)) ids.push(...treeIds(child.id));
  return ids;
}

/** Every category a product belongs to: primary `categoryId` + any cross-listed `categoryIds`. */
function productCategoryIds(p: { categoryId: number; categoryIds?: number[] }): number[] {
  return [p.categoryId, ...(p.categoryIds ?? [])];
}

/** True when any of the product's categories is within the requested category-tree ids. */
function inCategoryTree(
  p: { categoryId: number; categoryIds?: number[] },
  ids: number[],
): boolean {
  return productCategoryIds(p).some((id) => ids.includes(id));
}

export const storefrontHandlers = [
  http.get(`${API_BASE}/home`, () => HttpResponse.json(home)),

  // ── Vehicle catalog (garage selector + fitment filter) ──
  http.get(`${API_BASE}/vehicles/makes`, () => HttpResponse.json({ makes: makesWithModels })),

  // ── Category detail by id (PDP breadcrumb/related) ──
  // Registered before /categories/:slug so "by-id" isn't swallowed as a slug.
  http.get(`${API_BASE}/categories/by-id/:id`, ({ params }) => {
    const cat = byId(Number(params.id));
    if (!cat || cat.status === "archived") return HttpResponse.json({ error: "not_found" }, { status: 404 });
    return HttpResponse.json({
      ...cat,
      children: childrenOf(cat.id),
      breadcrumb: [...ancestors(cat.id), cat],
    });
  }),

  // ── Category detail (children + breadcrumb) ──
  http.get(`${API_BASE}/categories/:slug`, ({ params }) => {
    const cat = categories.find((c) => c.slug === params.slug);
    if (!cat || cat.status === "archived") return HttpResponse.json({ error: "not_found" }, { status: 404 });
    return HttpResponse.json({
      ...cat,
      children: childrenOf(cat.id),
      breadcrumb: [...ancestors(cat.id), cat],
    });
  }),

  // ── Product list (cursor-paginated, light items) ──
  http.get(`${API_BASE}/products/by-category/:slug`, ({ params, request }) => {
    const cat = categories.find((c) => c.slug === params.slug);
    if (!cat || cat.status === "archived") {
      return HttpResponse.json({ items: [], nextCursor: null, total: 0 });
    }
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 24), 50);
    const cursor = url.searchParams.get("cursor");
    const cursorId = cursor ? Number(cursor) : null;

    const ids = treeIds(cat.id);
    let list = applyFitment(
      products.filter((x) => x.status === "active" && inCategoryTree(x, ids)),
      url.searchParams,
    ).sort((a, b) => a.id - b.id);
    const total = list.length;
    if (cursorId != null && !Number.isNaN(cursorId)) {
      list = list.filter((x) => x.id > cursorId);
    }
    const page = list.slice(0, limit);
    const hasMore = list.length > limit;
    const nextCursor = hasMore && page.length ? page[page.length - 1]!.id : null;
    return HttpResponse.json({
      items: page.map(toListItem),
      nextCursor,
      total: cursorId == null ? total : undefined,
    });
  }),

  http.get(`${API_BASE}/products`, ({ request }) => {
    const url = new URL(request.url);
    const p = url.searchParams;

    let list = products.filter((x) => x.status === "active");

    const categorySlug = p.get("category");
    if (categorySlug) {
      const cat = categories.find((c) => c.slug === categorySlug);
      if (!cat || cat.status === "archived") {
        return HttpResponse.json({ items: [], nextCursor: null });
      }
      const ids = treeIds(cat.id);
      list = list.filter((x) => inCategoryTree(x, ids));
    }
    if (p.get("bestseller") === "1") list = list.filter((x) => x.isBestseller);
    if (p.get("new") === "1") list = list.filter((x) => x.isNew);
    if (p.get("featured") === "1") list = list.filter((x) => x.isFeatured);

    const q = (p.get("q") ?? "").toLowerCase().trim();
    if (q) {
      list = list.filter(
        (x) =>
          x.name.toLowerCase().includes(q) ||
          x.tags.some((t) => t.toLowerCase().includes(q)) ||
          x.description.toLowerCase().includes(q),
      );
    }

    list = applyFitment(list, p).sort((a, b) => a.id - b.id);

    const cursor = Number(p.get("cursor") ?? 0);
    if (cursor) list = list.filter((x) => x.id > cursor);

    const limit = Math.min(Number(p.get("limit") ?? 24) || 24, 100);
    const page = list.slice(0, limit);
    const nextCursor = list.length > limit ? page[page.length - 1].id : null;

    return HttpResponse.json({ items: page.map(toListItem), nextCursor });
  }),

  // ── Full-text search (q + optional fitment) ──
  http.get(`${API_BASE}/search`, ({ request }) => {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").toLowerCase().trim();
    if (!q) return HttpResponse.json({ items: [], nextCursor: null });
    let list = products.filter(
      (x) =>
        x.status === "active" &&
        (x.name.toLowerCase().includes(q) ||
          x.tags.some((t) => t.toLowerCase().includes(q)) ||
          x.description.toLowerCase().includes(q)),
    );
    list = applyFitment(list, url.searchParams).sort((a, b) => a.id - b.id);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 24) || 24, 50);
    return HttpResponse.json({ items: list.slice(0, limit).map(toListItem), nextCursor: null });
  }),

  // ── Product detail (full) ──
  http.get(`${API_BASE}/products/:slug`, ({ params }) => {
    const product = products.find((x) => x.slug === params.slug && x.status === "active");
    if (!product) return HttpResponse.json({ error: "not_found" }, { status: 404 });
    return HttpResponse.json(product);
  }),
];
