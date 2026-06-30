import type { Subscriber } from "@svcar/contracts";

/**
 * Mutable in-memory newsletter subscribers. The public POST /newsletter/subscribe
 * handler appends here; the admin GET /admin/subscribers handler reads it — so a
 * signup on the storefront shows up in the admin within the same mock session.
 */

const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();

export const subscribers: Subscriber[] = [
  { id: "sub_seed_1", email: "arjun.mehta@example.com", name: "Arjun Mehta", phone: "+919812000111", source: "footer", status: "active", subscribedAt: daysAgo(1) },
  { id: "sub_seed_2", email: "kabir.singh@example.com", name: "Kabir Singh", phone: "", source: "footer", status: "active", subscribedAt: daysAgo(3) },
  { id: "sub_seed_3", email: "isha.reddy@example.com", name: "Isha Reddy", phone: "+919700333222", source: "footer", status: "active", subscribedAt: daysAgo(6) },
  { id: "sub_seed_4", email: "manav.joshi@example.com", name: "", phone: "", source: "footer", status: "active", subscribedAt: daysAgo(12) },
  { id: "sub_seed_5", email: "tanvi.shah@example.com", name: "Tanvi Shah", phone: "+919650444333", source: "footer", status: "unsubscribed", subscribedAt: daysAgo(20) },
];
