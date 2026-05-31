/**
 * Authenticated admin API client.
 *
 * Every call hits `${API_BASE}/admin/*` (MSW-backed in dev, the real API in
 * prod) with a `Authorization: Bearer <token>` header sourced from the admin
 * auth store, and validates the response against a `@veronica/contracts` schema
 * so shape drift fails loudly here rather than deep in a component.
 *
 * A 401 clears the session so the layout bounces the user back to /login.
 */
import { z } from "zod";
import { API_BASE, USE_MOCKS } from "@/lib/api-config";
import { mocksReady } from "@/lib/mocks-ready";
import { getAdminToken, useAdminAuthStore } from "@/store/adminAuthStore";
import {
  AdminLoginResponseSchema,
  ProductSchema,
  ProductListItemSchema,
  CategorySchema,
  CategoryListSchema,
  HomeConfigSchema,
  SettingsSchema,
  UploadResultSchema,
  type AdminLoginResponse,
  type Product,
  type ProductListItem,
  type Category,
  type HomeConfig,
  type Settings,
  type AdminProductCreate,
  type AdminProductUpdate,
  type AdminCategoryCreate,
  type AdminCategoryUpdate,
} from "@veronica/contracts";

const ProductListSchema = z.array(ProductListItemSchema);

/** Thrown on any non-2xx admin response; carries the parsed error code. */
export class AdminApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message?: string) {
    super(message ?? code);
    this.name = "AdminApiError";
    this.status = status;
    this.code = code;
  }
}

interface ReqOptions<T> {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Validates the parsed JSON body. Omit for endpoints that return no body. */
  schema?: z.ZodType<T>;
  /** Set false for the login call (no token yet). */
  auth?: boolean;
}

async function req<T>(path: string, opts: ReqOptions<T> = {}): Promise<T> {
  const { method = "GET", body, schema, auth = true } = opts;

  // Hold the request until the MSW worker is intercepting (resolves instantly
  // when mocks are off or already ready) so on-mount fetches never escape.
  if (USE_MOCKS) await mocksReady;

  const headers: Record<string, string> = {};
  if (body !== undefined && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (auth) {
    const token = getAdminToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });

  if (res.status === 401) {
    // Session is dead/invalid — drop it so the layout redirects to /login.
    useAdminAuthStore.getState().clear();
  }

  if (!res.ok) {
    let code = res.statusText || "error";
    let message: string | undefined;
    try {
      const errBody = await res.json();
      code = errBody.error ?? code;
      message = errBody.message;
    } catch {
      /* non-JSON error body — keep the status text */
    }
    throw new AdminApiError(res.status, code, message);
  }

  if (!schema) return undefined as T;
  const json = await res.json();
  return schema.parse(json);
}

export interface ProductListParams {
  q?: string;
  status?: "active" | "draft" | "archived";
  flag?: "bestseller" | "new" | "featured";
}

function toQuery(params: ProductListParams): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.status) sp.set("status", params.status);
  if (params.flag) sp.set("flag", params.flag);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export const adminApi = {
  // ── Auth ──
  async login(email: string, password: string): Promise<AdminLoginResponse> {
    const res = await req("/admin/auth/login", {
      method: "POST",
      body: { email, password },
      schema: AdminLoginResponseSchema,
      auth: false,
    });
    useAdminAuthStore.getState().setSession(res.accessToken, res.admin);
    return res;
  },
  logout(): void {
    useAdminAuthStore.getState().clear();
  },
  /** Cheap authenticated ping used to validate a restored session on mount. */
  async validateSession(): Promise<boolean> {
    try {
      await req("/admin/settings", { schema: SettingsSchema });
      return true;
    } catch {
      return false;
    }
  },

  // ── Products ──
  listProducts(params: ProductListParams = {}): Promise<ProductListItem[]> {
    return req(`/admin/products${toQuery(params)}`, { schema: ProductListSchema });
  },
  getProduct(id: number): Promise<Product> {
    return req(`/admin/products/${id}`, { schema: ProductSchema });
  },
  createProduct(data: AdminProductCreate): Promise<Product> {
    return req("/admin/products", { method: "POST", body: data, schema: ProductSchema });
  },
  updateProduct(id: number, patch: AdminProductUpdate): Promise<Product> {
    return req(`/admin/products/${id}`, { method: "PATCH", body: patch, schema: ProductSchema });
  },
  deleteProduct(id: number): Promise<void> {
    return req(`/admin/products/${id}`, { method: "DELETE" });
  },

  // ── Categories ──
  listCategories(): Promise<Category[]> {
    return req("/admin/categories", { schema: CategoryListSchema });
  },
  createCategory(data: AdminCategoryCreate): Promise<Category> {
    return req("/admin/categories", { method: "POST", body: data, schema: CategorySchema });
  },
  updateCategory(id: number, patch: AdminCategoryUpdate): Promise<Category> {
    return req(`/admin/categories/${id}`, { method: "PATCH", body: patch, schema: CategorySchema });
  },
  deleteCategory(id: number): Promise<void> {
    return req(`/admin/categories/${id}`, { method: "DELETE" });
  },

  // ── Home composer ──
  getHome(): Promise<HomeConfig> {
    return req("/admin/home", { schema: HomeConfigSchema });
  },
  putHome(config: HomeConfig): Promise<HomeConfig> {
    return req("/admin/home", { method: "PUT", body: config, schema: HomeConfigSchema });
  },

  // ── Settings ──
  getSettings(): Promise<Settings> {
    return req("/admin/settings", { schema: SettingsSchema });
  },
  updateSettings(patch: Partial<Settings>): Promise<Settings> {
    return req("/admin/settings", { method: "PATCH", body: patch, schema: SettingsSchema });
  },

  // ── Uploads ──
  async uploadImage(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    const res = await req("/admin/upload", {
      method: "POST",
      body: form,
      schema: UploadResultSchema,
    });
    return res.url;
  },
};
