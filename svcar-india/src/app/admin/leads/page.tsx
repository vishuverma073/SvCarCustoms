"use client";

import { useMemo, useState } from "react";
import {
  Loader2,
  Search,
  Users,
  AlertCircle,
  ChevronDown,
  MessageCircle,
  Mail,
  Clock,
  MapPin,
  Package,
  Phone,
} from "lucide-react";
import { useLeads, useSubscribers, useWhatsappLeads } from "@/lib/admin-hooks";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import AdminProductThumb from "@/components/admin/AdminProductThumb";
import type { Lead, Subscriber } from "@svcar/contracts";
import type { WhatsappLead } from "@/lib/admin-api";

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
const DAY_MS = 24 * 60 * 60 * 1000;

function relativeTime(iso: string): string {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  return `${d}d ago`;
}

function heldLabel(iso: string): string {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 60) return `kept ${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `kept ${hr}h`;
  const d = Math.round(hr / 24);
  return `kept ${d} day${d === 1 ? "" : "s"}`;
}

function customerLabel(l: Lead): string {
  if (l.isGuest) return "Guest";
  return l.customerName || l.customerEmail || l.customerPhone || "Customer";
}

// ── Tabs ──────────────────────────────────────────────────────
type TabKey = "active" | "abandoned" | "subscribers" | "whatsapp";
const isStale = (l: Lead) => Date.now() - new Date(l.updatedAt).getTime() > DAY_MS;

// ── Shared cart follow-up buttons ─────────────────────────────
function FollowUp({ lead }: { lead: Lead }) {
  if (lead.isGuest) {
    return (
      <span className="inline-flex items-center rounded-full bg-surface-dim px-2 py-0.5 text-[11px] font-semibold text-text-muted">
        Guest
      </span>
    );
  }
  const phoneDigits = lead.customerPhone.replace(/[^0-9]/g, "");
  const msg = encodeURIComponent(
    `Hi ${lead.customerName || "there"}, you left some items in your SV Car Customs cart. Need help completing your order?`,
  );
  return (
    <div className="flex items-center gap-1.5">
      {phoneDigits && (
        <a
          href={`https://wa.me/${phoneDigits}?text=${msg}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 rounded-full bg-whatsapp/10 px-2.5 py-1 text-[11px] font-semibold text-whatsapp hover:bg-whatsapp/20"
        >
          <MessageCircle size={13} /> WhatsApp
        </a>
      )}
      {lead.customerEmail && (
        <a
          href={`mailto:${lead.customerEmail}?subject=${encodeURIComponent("Your SV Car Customs cart")}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 rounded-full bg-brand-orange/10 px-2.5 py-1 text-[11px] font-semibold text-brand-orange hover:bg-brand-orange/20"
        >
          <Mail size={13} /> Email
        </a>
      )}
    </div>
  );
}

// ── Expandable cart row (Active / Abandoned tabs) ─────────────
function CartRow({ lead: l }: { lead: Lead }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-surface-dim/40"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-primary">{customerLabel(l)}</span>
            <FollowUp lead={l} />
          </div>
          <p className="mt-0.5 truncate text-sm text-text-secondary">
            {l.itemCount} item{l.itemCount === 1 ? "" : "s"}
            {l.customerEmail ? ` · ${l.customerEmail}` : ""}
            {l.customerPhone ? ` · ${l.customerPhone}` : ""}
          </p>
          <p className="mt-1 flex items-center gap-2 text-[11px] text-text-muted">
            <Clock size={12} /> {relativeTime(l.updatedAt)} · {heldLabel(l.oldestAddedAt)}
          </p>
        </div>

        <div className="hidden shrink-0 items-center -space-x-2 sm:flex">
          {l.items.slice(0, 3).map((it, i) => (
            <div
              key={i}
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-border-light bg-surface-dim"
            >
              <AdminProductThumb src={it.image} className="p-0.5" iconSize={14} />
            </div>
          ))}
          {l.items.length > 3 && (
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-light bg-surface-dim text-[11px] font-semibold text-text-secondary">
              +{l.items.length - 3}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="whitespace-nowrap font-bold text-text-primary">{inr(l.total)}</span>
          <ChevronDown
            size={18}
            className={`text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-border-light bg-surface-dim/30 px-4 py-3">
          <div className="space-y-2">
            {l.items.map((it, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-border-light bg-white">
                  <AdminProductThumb src={it.image} className="p-1" iconSize={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {it.productName}
                    {it.variantLabel ? <span className="text-text-muted"> · {it.variantLabel}</span> : null}
                  </p>
                  <p className="text-[11px] text-text-muted">
                    Qty {it.qty} × {inr(it.unitPrice)} · added {relativeTime(it.addedAt)}
                  </p>
                </div>
                <span className="whitespace-nowrap text-sm font-semibold text-text-primary">
                  {inr(it.lineTotal)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-dim">{icon}</div>
      <p className="font-medium text-text-secondary">{label}</p>
    </div>
  );
}

// ── Cart tab (Active / Abandoned) ─────────────────────────────
type SortKey = "latest" | "value" | "held";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "latest", label: "Latest activity" },
  { key: "value", label: "Highest value" },
  { key: "held", label: "Longest held" },
];

function CartTab({ tab }: { tab: "active" | "abandoned" }) {
  const { data, isLoading, error } = useLeads();
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search, 250);
  const [sort, setSort] = useState<SortKey>("latest");

  const rows = useMemo(() => {
    let list = (data?.items ?? []).filter((l) => (tab === "abandoned" ? isStale(l) : !isStale(l)));
    const q = debounced.trim().toLowerCase();
    if (q) {
      list = list.filter((l) =>
        [customerLabel(l), l.customerEmail, l.customerPhone].some((s) => s.toLowerCase().includes(q)),
      );
    }
    const sorted = [...list];
    if (sort === "latest") sorted.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    else if (sort === "value") sorted.sort((a, b) => b.total - a.total);
    else sorted.sort((a, b) => (a.oldestAddedAt > b.oldestAddedAt ? 1 : -1));
    return sorted;
  }, [data, debounced, sort, tab]);

  return (
    <>
      <p className="mb-4 text-sm text-text-secondary">
        {tab === "active"
          ? "Carts active in the last 24 hours — shoppers you can still catch."
          : "Carts untouched for over 24 hours — follow up to win them back."}
      </p>
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name, email or phone…"
          className="input pl-10!"
          type="search"
        />
      </div>
      <div className="mb-5 flex items-center">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="ml-auto rounded-full border border-border bg-white px-3 py-1.5 text-sm font-semibold text-text-secondary"
          aria-label="Sort carts"
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-20 text-text-muted">
          <Loader2 className="animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center text-text-secondary">
          <AlertCircle className="text-danger" />
          <p className="text-sm">Couldn&rsquo;t load carts.</p>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Users className="text-text-muted" />}
          label={tab === "active" ? "No active carts right now" : "No abandoned carts"}
        />
      ) : (
        <div className="divide-y divide-border-light overflow-hidden rounded-xl border border-border-light bg-white shadow-sm">
          {rows.map((l) => (
            <CartRow key={l.id} lead={l} />
          ))}
        </div>
      )}
    </>
  );
}

// ── Subscribers tab ───────────────────────────────────────────
function SubscribersTab() {
  const { data, isLoading, error } = useSubscribers();
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search, 250);

  const rows = useMemo(() => {
    let list: Subscriber[] = data?.items ?? [];
    const q = debounced.trim().toLowerCase();
    if (q) list = list.filter((s) => [s.email, s.name, s.phone].some((v) => v.toLowerCase().includes(q)));
    return list;
  }, [data, debounced]);

  return (
    <>
      <p className="mb-4 text-sm text-text-secondary">
        Newsletter signups from the storefront.{" "}
        {data ? `${data.activeCount} active of ${data.total}.` : ""}
      </p>
      <div className="relative mb-5">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email, name or phone…"
          className="input pl-10!"
          type="search"
        />
      </div>
      {isLoading ? (
        <div className="flex justify-center py-20 text-text-muted">
          <Loader2 className="animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center text-text-secondary">
          <AlertCircle className="text-danger" />
          <p className="text-sm">Couldn&rsquo;t load subscribers.</p>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={<Mail className="text-text-muted" />} label="No subscribers yet" />
      ) : (
        <div className="divide-y divide-border-light overflow-hidden rounded-xl border border-border-light bg-white shadow-sm">
          {rows.map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-orange/10">
                <Mail size={16} className="text-brand-orange" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-text-primary">{s.email}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-text-muted">
                  {s.name ? <span>{s.name}</span> : null}
                  {s.phone ? (
                    <span className="flex items-center gap-1">
                      <Phone size={11} /> {s.phone}
                    </span>
                  ) : null}
                  <span>via {s.source}</span>
                  <span>· {relativeTime(s.subscribedAt)}</span>
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  s.status === "active"
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-gray-300 bg-gray-100 text-gray-500"
                }`}
              >
                {s.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── WhatsApp leads tab ────────────────────────────────────────
const WA_SOURCE_STYLE: Record<string, string> = {
  floating: "border-gray-300 bg-gray-100 text-gray-600",
  product: "border-brand-orange/30 bg-brand-orange/10 text-brand-orange",
  cart: "border-blue-200 bg-blue-50 text-blue-700",
  contact: "border-teal-200 bg-teal-50 text-teal-700",
  other: "border-gray-300 bg-gray-100 text-gray-600",
};
const WA_SOURCE_LABEL: Record<string, string> = {
  floating: "Floating button",
  product: "Product page",
  cart: "Cart",
  contact: "Contact",
  other: "Other",
};

function WhatsappTab() {
  const { data, isLoading, error } = useWhatsappLeads();
  const rows: WhatsappLead[] = data?.items ?? [];

  return (
    <>
      <p className="mb-5 text-sm text-text-secondary">
        Every &ldquo;Chat on WhatsApp&rdquo; click across the store — intent signals with the page and product
        context. {data ? `${data.todayCount} today · ${data.total} total.` : ""}
      </p>
      {isLoading ? (
        <div className="flex justify-center py-20 text-text-muted">
          <Loader2 className="animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center text-text-secondary">
          <AlertCircle className="text-danger" />
          <p className="text-sm">Couldn&rsquo;t load WhatsApp leads.</p>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="text-text-muted" />}
          label="No WhatsApp clicks yet"
        />
      ) : (
        <div className="divide-y divide-border-light overflow-hidden rounded-xl border border-border-light bg-white shadow-sm">
          {rows.map((w) => (
            <div key={w.id} className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-whatsapp/10">
                <MessageCircle size={16} className="text-whatsapp" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      WA_SOURCE_STYLE[w.source] ?? WA_SOURCE_STYLE.other
                    }`}
                  >
                    {WA_SOURCE_LABEL[w.source] ?? w.source}
                  </span>
                  {w.productName ? (
                    <span className="flex min-w-0 items-center gap-1 text-sm font-medium text-text-primary">
                      <Package size={13} className="shrink-0 text-text-muted" />
                      <span className="truncate">{w.productName}</span>
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-text-muted">
                  <span className="truncate">{w.path}</span>
                  {w.city ? (
                    <span className="flex items-center gap-1">
                      <MapPin size={11} /> {w.city}
                      {w.country ? `, ${w.country}` : ""}
                    </span>
                  ) : null}
                </p>
              </div>
              <span className="shrink-0 whitespace-nowrap text-[11px] text-text-muted">
                {relativeTime(w.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── Page shell ────────────────────────────────────────────────
export default function LeadsPage() {
  const [tab, setTab] = useState<TabKey>("active");
  const { data: leadData } = useLeads();
  const { data: subData } = useSubscribers();
  const { data: waData } = useWhatsappLeads();

  const activeCount = (leadData?.items ?? []).filter((l) => !isStale(l)).length;
  const abandonedCount = (leadData?.items ?? []).filter(isStale).length;

  const TABS: { key: TabKey; label: string; count: number | null }[] = [
    { key: "active", label: "Active Cart", count: leadData ? activeCount : null },
    { key: "abandoned", label: "Abandoned Cart", count: leadData ? abandonedCount : null },
    { key: "subscribers", label: "Subscribers", count: subData ? subData.total : null },
    { key: "whatsapp", label: "WhatsApp Leads", count: waData ? waData.total : null },
  ];

  return (
    <div className="max-w-5xl pb-20">
      <h1 className="mb-4 text-xl font-bold text-text-primary">Leads</h1>

      {/* Tab bar */}
      <div className="mb-5 flex flex-wrap gap-2 border-b border-border-light pb-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              tab === t.key
                ? "border-brand-orange bg-brand-orange/5 text-brand-orange"
                : "border-border text-text-secondary hover:bg-surface-dim"
            }`}
          >
            {t.label}
            {t.count != null && (
              <span
                className={`ml-1.5 text-xs font-bold ${
                  tab === t.key ? "text-brand-orange" : "text-text-muted"
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "active" && <CartTab tab="active" />}
      {tab === "abandoned" && <CartTab tab="abandoned" />}
      {tab === "subscribers" && <SubscribersTab />}
      {tab === "whatsapp" && <WhatsappTab />}
    </div>
  );
}
