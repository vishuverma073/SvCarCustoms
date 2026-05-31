import { http, HttpResponse } from "msw";
import { API_BASE } from "@/lib/api-config";
import { rootCategories } from "../data/categories";

/**
 * Category endpoints. Phase 0 ships only the list endpoint; later phases
 * add `/categories/:slug` (with breadcrumb + children) and admin CRUD.
 */
export const categoriesHandlers = [
  http.get(`${API_BASE}/categories`, () => {
    return HttpResponse.json(rootCategories);
  }),
];
