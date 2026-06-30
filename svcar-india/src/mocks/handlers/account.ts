import { http, HttpResponse } from "msw";
import { API_BASE } from "@/lib/api-config";
import {
  OtpVerifyRequestSchema,
  AddCartItemSchema,
  UpdateCartItemSchema,
  UpdateMeSchema,
  type ServerCartItem,
} from "@svcar/contracts";
import {
  MOCK_OTP,
  MOCK_USER_TOKEN,
  getOrCreateUser,
  setCurrentEmail,
  getCurrentUser,
  userHasPassword,
  setUserPassword,
  checkUserPassword,
  serverCart,
  nextLineId,
} from "../data/account";
import { MOCK_TOKEN } from "../data/settings";

const A = API_BASE;

/** 401 unless the request carries the mock user bearer token + an active user. */
function requireUser(request: Request) {
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${MOCK_USER_TOKEN}`) return null;
  return getCurrentUser();
}
const unauthorized = () => HttpResponse.json({ error: "unauthorized" }, { status: 401 });

export const accountHandlers = [
  // ── Auth ──
  http.post(`${A}/auth/otp/send`, async ({ request }) => {
    const body = (await request.json()) as { email?: string };
    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return HttpResponse.json({ error: "invalid_email" }, { status: 400 });
    }
    // Real backend emails the code; the mock just acknowledges (code is MOCK_OTP).
    return HttpResponse.json({ sent: true, devHint: MOCK_OTP });
  }),

  http.post(`${A}/auth/otp/verify`, async ({ request }) => {
    const parsed = OtpVerifyRequestSchema.safeParse(await request.json());
    if (!parsed.success) return HttpResponse.json({ error: "bad_request" }, { status: 400 });
    if (parsed.data.code !== MOCK_OTP) {
      return HttpResponse.json({ error: "invalid_otp" }, { status: 401 });
    }
    const user = getOrCreateUser(parsed.data.email);
    setCurrentEmail(user.email);
    return HttpResponse.json({ accessToken: MOCK_USER_TOKEN, user });
  }),

  // Email + password login (alternative to OTP).
  http.post(`${A}/auth/password/login`, async ({ request }) => {
    const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
    const email = body?.email?.trim().toLowerCase();
    const password = body?.password ?? "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
      return HttpResponse.json({ error: "bad_request" }, { status: 400 });
    }
    if (!userHasPassword(email)) {
      // No password set for this account yet — tell the UI to offer OTP.
      return HttpResponse.json({ error: "no_password" }, { status: 403 });
    }
    if (!checkUserPassword(email, password)) {
      return HttpResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }
    const user = getOrCreateUser(email);
    setCurrentEmail(user.email);
    return HttpResponse.json({ accessToken: MOCK_USER_TOKEN, user });
  }),

  // Set/change the current user's password (authenticated).
  http.post(`${A}/auth/password/set`, async ({ request }) => {
    const user = requireUser(request);
    if (!user) return unauthorized();
    const body = (await request.json().catch(() => null)) as { password?: string } | null;
    const password = body?.password ?? "";
    if (password.length < 6) {
      return HttpResponse.json({ error: "weak_password" }, { status: 400 });
    }
    setUserPassword(user.email, password);
    return HttpResponse.json(user);
  }),

  // Mock silent-refresh: the client replays its localStorage marker as `email`.
  http.post(`${A}/auth/refresh`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { email?: string };
    if (!body.email) return unauthorized();
    const user = getOrCreateUser(body.email);
    setCurrentEmail(user.email);
    return HttpResponse.json({ accessToken: MOCK_USER_TOKEN, user });
  }),

  // Exchange a customer session for an admin session — only if the logged-in
  // user is an admin. Lets the storefront "Admin" button drop straight into the
  // admin panel without a second login. (Real backend must validate role server-side.)
  http.post(`${A}/admin/auth/exchange`, ({ request }) => {
    const user = requireUser(request);
    if (!user) return unauthorized();
    if (!user.isAdmin) return HttpResponse.json({ error: "forbidden" }, { status: 403 });
    return HttpResponse.json({
      accessToken: MOCK_TOKEN,
      admin: { id: user.id, email: user.email, name: user.name || "Admin" },
    });
  }),

  http.post(`${A}/auth/logout`, () => {
    setCurrentEmail(null);
    // The mock keeps a single in-memory cart for "one logged-in user at a time".
    // Clear it on logout so the next user who signs in on this session doesn't
    // inherit the previous user's cart.
    serverCart.length = 0;
    return HttpResponse.json({ ok: true });
  }),

  // ── Profile ──
  http.get(`${A}/me`, ({ request }) => {
    const user = requireUser(request);
    return user ? HttpResponse.json(user) : unauthorized();
  }),

  http.patch(`${A}/me`, async ({ request }) => {
    const user = requireUser(request);
    if (!user) return unauthorized();
    const parsed = UpdateMeSchema.safeParse(await request.json());
    if (!parsed.success) return HttpResponse.json({ error: "bad_request" }, { status: 400 });
    if (parsed.data.name !== undefined) user.name = parsed.data.name;
    return HttpResponse.json(user);
  }),

  // ── Cart ──
  http.get(`${A}/me/cart`, ({ request }) => {
    if (!requireUser(request)) return unauthorized();
    return HttpResponse.json({ items: serverCart });
  }),

  http.post(`${A}/me/cart/items`, async ({ request }) => {
    if (!requireUser(request)) return unauthorized();
    const parsed = AddCartItemSchema.safeParse(await request.json());
    if (!parsed.success) return HttpResponse.json({ error: "bad_request" }, { status: 400 });
    const d = parsed.data;
    const existing = serverCart.find((i) => i.skuId === d.skuId && i.variant === d.variant);
    if (existing) {
      existing.qty += d.qty; // idempotent merge by SKU
    } else {
      const item: ServerCartItem = {
        id: nextLineId(),
        skuId: d.skuId,
        name: d.name,
        slug: d.slug,
        price: d.price,
        image: d.image,
        variant: d.variant,
        qty: d.qty,
      };
      serverCart.push(item);
    }
    return HttpResponse.json({ items: serverCart });
  }),

  http.patch(`${A}/me/cart/items/:id`, async ({ request, params }) => {
    if (!requireUser(request)) return unauthorized();
    const parsed = UpdateCartItemSchema.safeParse(await request.json());
    if (!parsed.success) return HttpResponse.json({ error: "bad_request" }, { status: 400 });
    const item = serverCart.find((i) => i.id === Number(params.id));
    if (!item) return HttpResponse.json({ error: "not_found" }, { status: 404 });
    item.qty = parsed.data.qty;
    return HttpResponse.json({ items: serverCart });
  }),

  http.delete(`${A}/me/cart/items/:id`, ({ request, params }) => {
    if (!requireUser(request)) return unauthorized();
    const idx = serverCart.findIndex((i) => i.id === Number(params.id));
    if (idx !== -1) serverCart.splice(idx, 1);
    return HttpResponse.json({ items: serverCart });
  }),
];
