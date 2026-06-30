import type { Lead, LeadItem } from "@svcar/contracts";
import { products } from "./products";

/**
 * Mock "leads" = sample customer carts for the admin Leads page. Built from the
 * real mock products so thumbnails/prices match the catalog. Timestamps are
 * relative to load time so "latest first" and "kept X" are visibly different.
 * Includes both signed-in customers and guest (anonymous) carts.
 */

const MIN = 60_000;
const minutesAgo = (min: number) => new Date(Date.now() - min * MIN).toISOString();

const byName = (name: string) => products.find((p) => p.name === name);

function item(name: string, qty: number, addedMinAgo: number): LeadItem {
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
    addedAt: minutesAgo(addedMinAgo),
  };
}

interface SeedLead {
  id: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  isGuest?: boolean;
  updatedMinAgo: number;
  items: LeadItem[];
}

function buildLead(s: SeedLead): Lead {
  const itemCount = s.items.reduce((n, i) => n + i.qty, 0);
  const total = s.items.reduce((n, i) => n + i.lineTotal, 0);
  const oldestAddedAt = s.items.reduce(
    (min, i) => (i.addedAt < min ? i.addedAt : min),
    s.items[0]?.addedAt ?? minutesAgo(s.updatedMinAgo),
  );
  return {
    id: s.id,
    customerName: s.customerName ?? "",
    customerEmail: s.customerEmail ?? "",
    customerPhone: s.customerPhone ?? "",
    isGuest: s.isGuest ?? false,
    itemCount,
    total,
    updatedAt: minutesAgo(s.updatedMinAgo),
    oldestAddedAt,
    items: s.items,
  };
}

export const leads: Lead[] = [
  buildLead({
    id: "cart_guest_a1",
    isGuest: true,
    updatedMinAgo: 6,
    items: [item("GT Wing Pro", 1, 6)],
  }),
  buildLead({
    id: "cart_rahul",
    customerName: "Rahul Sharma",
    customerEmail: "rahul.sharma@example.com",
    customerPhone: "+919812345678",
    updatedMinAgo: 38,
    items: [item("Cat-Back Sport Exhaust", 1, 2 * 24 * 60), item("Burnt Tip Exhaust Set", 2, 38)],
  }),
  buildLead({
    id: "cart_priya",
    customerName: "Priya Nair",
    customerEmail: "priya.nair@example.com",
    updatedMinAgo: 2 * 60,
    items: [item("RGB Ambient Light Kit", 1, 3 * 24 * 60)],
  }),
  buildLead({
    id: "cart_guest_b2",
    isGuest: true,
    updatedMinAgo: 5 * 60,
    items: [item("Virtus Boot Lip Spoiler", 1, 5 * 60), item("Carbon Mirror Caps", 1, 6 * 60)],
  }),
  buildLead({
    id: "cart_aman",
    customerName: "Aman Verma",
    customerPhone: "+919900112233",
    updatedMinAgo: 26 * 60,
    items: [item("Aluminium Paddle Shifters", 1, 6 * 24 * 60), item("7D Custom Floor Mats", 1, 26 * 60)],
  }),
  buildLead({
    id: "cart_neha",
    customerName: "Neha Gupta",
    customerEmail: "neha.gupta@example.com",
    customerPhone: "+919765432100",
    updatedMinAgo: 3 * 24 * 60,
    items: [item('Android 10" Touchscreen Stereo', 1, 9 * 24 * 60)],
  }),
];
