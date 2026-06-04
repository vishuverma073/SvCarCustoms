import { http, HttpResponse } from "msw";
import { nanoid } from "nanoid";
import { API_BASE } from "@/lib/api-config";
import {
  AdminProductCreateSchema,
  AdminCategoryCreateSchema,
  SettingsUpdateSchema,
  type Product,
  type Category,
} from "@veronica/contracts";
import { products, toListItem } from "../data/products";
import { categories } from "../data/categories";
import { home } from "../data/home";
import {
  settings,
  adminUser,
  MOCK_TOKEN,
  MOCK_EMAIL,
  MOCK_PASSWORD,
} from "../data/settings";

const A = API_BASE;

/** 401 if the request lacks the mock bearer token; otherwise null (proceed). */
function gate(request: Request): Response | null {
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${MOCK_TOKEN}`) {
    return HttpResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

function nextProductId(): number {
  return products.reduce((max, p) => Math.max(max, p.id), 0) + 1;
}
function nextCategoryId(): number {
  return categories.reduce((max, c) => Math.max(max, c.id), 0) + 1;
}

export const adminHandlers = [
  // ── Auth ──
  http.post(`${A}/admin/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };
    if (body.email === MOCK_EMAIL && body.password === MOCK_PASSWORD) {
      return HttpResponse.json({ accessToken: MOCK_TOKEN, admin: adminUser });
    }
    return HttpResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }),

  // ── Products ──
  http.get(`${A}/admin/products`, ({ request }) => {
    const denied = gate(request);
    if (denied) return denied;

    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").toLowerCase();
    const status = url.searchParams.get("status"); // active|draft|archived
    const flag = url.searchParams.get("flag"); // bestseller|new|featured

    let result = [...products];
    if (q) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (status) result = result.filter((p) => p.status === status);
    if (flag === "bestseller") result = result.filter((p) => p.isBestseller);
    if (flag === "new") result = result.filter((p) => p.isNew);
    if (flag === "featured") result = result.filter((p) => p.isFeatured);

    // Mirror the deployed admin API: an `{ items, nextCursor }` envelope whose
    // rows carry `primaryImage`/`categoryName` (the admin client maps these).
    return HttpResponse.json({
      items: result.map((p) => ({
        ...toListItem(p),
        primaryImage: p.images[0] ?? null,
        categoryName: categories.find((c) => c.id === p.categoryId)?.name,
      })),
      nextCursor: null,
    });
  }),

  http.post(`${A}/admin/products`, async ({ request }) => {
    const denied = gate(request);
    if (denied) return denied;
    const raw = await request.json();
    const parsed = AdminProductCreateSchema.safeParse(raw);
    if (!parsed.success) {
      return HttpResponse.json(
        { error: "validation", message: parsed.error.message },
        { status: 422 },
      );
    }
    const data = parsed.data;
    const product: Product = {
      ...data,
      id: nextProductId(),
      slug: data.slug && data.slug.length > 0 ? data.slug : slugifyName(data.name),
    } as Product;
    products.push(product);
    return HttpResponse.json(product, { status: 201 });
  }),

  http.get(`${A}/admin/products/:id`, ({ request, params }) => {
    const denied = gate(request);
    if (denied) return denied;
    const product = products.find((p) => p.id === Number(params.id));
    if (!product) return HttpResponse.json({ error: "not_found" }, { status: 404 });
    return HttpResponse.json(product);
  }),

  http.patch(`${A}/admin/products/:id`, async ({ request, params }) => {
    const denied = gate(request);
    if (denied) return denied;
    const idx = products.findIndex((p) => p.id === Number(params.id));
    if (idx === -1) return HttpResponse.json({ error: "not_found" }, { status: 404 });
    const patch = (await request.json()) as Partial<Product>;
    products[idx] = { ...products[idx], ...patch, id: products[idx].id };
    return HttpResponse.json(products[idx]);
  }),

  http.delete(`${A}/admin/products/:id`, ({ request, params }) => {
    const denied = gate(request);
    if (denied) return denied;
    const idx = products.findIndex((p) => p.id === Number(params.id));
    if (idx === -1) return HttpResponse.json({ error: "not_found" }, { status: 404 });
    products.splice(idx, 1);
    return HttpResponse.json({ success: true });
  }),

  // ── Categories ──
  http.get(`${A}/admin/categories`, ({ request }) => {
    const denied = gate(request);
    if (denied) return denied;
    const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
    return HttpResponse.json(sorted);
  }),

  http.post(`${A}/admin/categories`, async ({ request }) => {
    const denied = gate(request);
    if (denied) return denied;
    const raw = await request.json();
    const parsed = AdminCategoryCreateSchema.safeParse(raw);
    if (!parsed.success) {
      return HttpResponse.json(
        { error: "validation", message: parsed.error.message },
        { status: 422 },
      );
    }
    const d = parsed.data;
    const category: Category = {
      id: nextCategoryId(),
      parentId: d.parentId,
      name: d.name,
      slug: d.slug && d.slug.length > 0 ? d.slug : slugifyName(d.name),
      description: d.description ?? "",
      image: d.image,
      sortOrder: d.sortOrder ?? categories.length,
      showInHeader: d.showInHeader ?? false,
    };
    categories.push(category);
    return HttpResponse.json(category, { status: 201 });
  }),

  http.patch(`${A}/admin/categories/:id`, async ({ request, params }) => {
    const denied = gate(request);
    if (denied) return denied;
    const idx = categories.findIndex((c) => c.id === Number(params.id));
    if (idx === -1) return HttpResponse.json({ error: "not_found" }, { status: 404 });
    const patch = (await request.json()) as Partial<Category>;
    categories[idx] = { ...categories[idx], ...patch, id: categories[idx].id };
    return HttpResponse.json(categories[idx]);
  }),

  http.delete(`${A}/admin/categories/:id`, ({ request, params }) => {
    const denied = gate(request);
    if (denied) return denied;
    const id = Number(params.id);
    const idx = categories.findIndex((c) => c.id === id);
    if (idx === -1) return HttpResponse.json({ error: "not_found" }, { status: 404 });

    const childCount = categories.filter((c) => c.parentId === id).length;
    const productCount = products.filter((p) => p.categoryId === id).length;
    if (childCount > 0 || productCount > 0) {
      return HttpResponse.json(
        { error: "has_dependencies", childCount, productCount },
        { status: 409 },
      );
    }
    categories.splice(idx, 1);
    return HttpResponse.json({ success: true });
  }),

  // ── Home composer ──
  http.get(`${A}/admin/home`, ({ request }) => {
    const denied = gate(request);
    if (denied) return denied;
    return HttpResponse.json(home);
  }),

  http.put(`${A}/admin/home`, async ({ request }) => {
    const denied = gate(request);
    if (denied) return denied;
    // The admin client sends the backend wire shape ({ sections:[{key,enabled,
    // order,config}] }), not the flat composer model — accept that.
    const raw = (await request.json()) as { sections?: unknown };
    if (!raw || !Array.isArray(raw.sections)) {
      return HttpResponse.json({ error: "validation" }, { status: 422 });
    }
    home.sections = raw.sections as typeof home.sections;
    return HttpResponse.json(home);
  }),

  // ── Settings ──
  http.get(`${A}/admin/settings`, ({ request }) => {
    const denied = gate(request);
    if (denied) return denied;
    return HttpResponse.json(settings);
  }),

  http.patch(`${A}/admin/settings`, async ({ request }) => {
    const denied = gate(request);
    if (denied) return denied;
    const raw = await request.json();
    const parsed = SettingsUpdateSchema.safeParse(raw);
    if (!parsed.success) {
      return HttpResponse.json(
        { error: "validation", message: parsed.error.message },
        { status: 422 },
      );
    }
    Object.assign(settings, parsed.data);
    return HttpResponse.json(settings);
  }),

  // ── Uploads ──
  http.post(`${A}/admin/upload`, ({ request }) => {
    const denied = gate(request);
    if (denied) return denied;
    return HttpResponse.json({ url: `https://placehold.co/600x600/EEEEEE/57534E/png?text=${nanoid(6)}` });
  }),

  // ── Stubs (full UI in Phase 4 / later) ──
  http.get(`${A}/admin/orders`, ({ request }) => {
    const denied = gate(request);
    if (denied) return denied;
    return HttpResponse.json({ items: [], nextCursor: null });
  }),

  http.get(`${A}/admin/audit`, ({ request }) => {
    const denied = gate(request);
    if (denied) return denied;
    return HttpResponse.json([
      { id: 1, actorEmail: adminUser.email, action: "product.update", resourceType: "product", resourceId: "1", createdAt: "2026-05-29T10:00:00.000Z", changes: { before: { status: "draft" }, after: { status: "active" } } },
      { id: 2, actorEmail: adminUser.email, action: "category.create", resourceType: "category", resourceId: "21", createdAt: "2026-05-28T14:30:00.000Z", changes: null },
    ]);
  }),
];

// Local slugify to avoid importing app utils into the mock bundle chain twice.
function slugifyName(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
