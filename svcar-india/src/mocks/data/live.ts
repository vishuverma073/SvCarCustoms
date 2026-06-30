import type { LiveVisitor, LeadItem } from "@svcar/contracts";
import { products } from "./products";

/**
 * Mock live-presence snapshot. Real presence needs a heartbeat/WebSocket; here
 * we synthesize a fresh set of "online now" shoppers on every call so the
 * auto-refreshing /admin/live page visibly changes (people come/go, move pages).
 */

const SEC = 1000;
const secondsAgo = (s: number) => new Date(Date.now() - s * SEC).toISOString();
const byName = (name: string) => products.find((p) => p.name === name);

function item(name: string, qty: number): LeadItem {
  const p = byName(name);
  const sku = p?.skus[0];
  const unitPrice = sku ? (sku.salePrice ?? sku.price) : 0;
  const variantLabel = sku ? Object.values(sku.dimensionValues).join(" / ") : "";
  return {
    productId: p?.id ?? 0,
    productName: p?.name ?? name,
    slug: p?.slug,
    image: p?.images[0] ?? "",
    variantLabel,
    qty,
    unitPrice,
    lineTotal: unitPrice * qty,
    addedAt: secondsAgo(120),
  };
}

interface PoolMember {
  id: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  isGuest?: boolean;
  items: LeadItem[];
}

const POOL: PoolMember[] = [
  { id: "live_guest_1", isGuest: true, items: [item("GT Wing Pro", 1)] },
  { id: "live_guest_2", isGuest: true, items: [] }, // just browsing
  {
    id: "live_rohit",
    customerName: "Rohit Kumar",
    customerEmail: "rohit.kumar@example.com",
    customerPhone: "+919811122233",
    items: [item("Cat-Back Sport Exhaust", 1), item("Burnt Tip Exhaust Set", 1)],
  },
  {
    id: "live_sana",
    customerName: "Sana Khan",
    customerEmail: "sana.khan@example.com",
    items: [item("RGB Ambient Light Kit", 2)],
  },
  { id: "live_guest_3", isGuest: true, items: [item("Carbon Mirror Caps", 1)] },
  {
    id: "live_dev",
    customerName: "Dev Patel",
    customerPhone: "+919700088877",
    items: [item("7D Custom Floor Mats", 1)],
  },
  { id: "live_guest_4", isGuest: true, items: [] },
];

const PATHS = [
  "/",
  "/category/exterior-mods",
  "/category/car-lighting",
  "/product/gt-wing-pro",
  "/product/cat-back-sport-exhaust",
  "/search?q=exhaust",
  "/cart",
  "/checkout",
];

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!;

/** A fresh "online right now" snapshot — 3–6 shoppers with recent heartbeats. */
export function snapshotLive(): LiveVisitor[] {
  const count = 3 + Math.floor(Math.random() * Math.min(4, POOL.length - 2));
  const online = [...POOL].sort(() => Math.random() - 0.5).slice(0, count);
  return online.map((m) => {
    const itemCount = m.items.reduce((n, i) => n + i.qty, 0);
    const total = m.items.reduce((n, i) => n + i.lineTotal, 0);
    return {
      id: m.id,
      customerName: m.customerName ?? "",
      customerEmail: m.customerEmail ?? "",
      customerPhone: m.customerPhone ?? "",
      isGuest: m.isGuest ?? false,
      currentPath: pick(PATHS),
      startedAt: secondsAgo(60 + Math.floor(Math.random() * 1500)), // 1–26 min in
      lastSeen: secondsAgo(Math.floor(Math.random() * 40)), // 0–40s ago
      itemCount,
      total,
      items: m.items,
    };
  });
}
