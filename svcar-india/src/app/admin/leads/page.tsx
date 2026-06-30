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
} from "lucide-react";
import { useLeads } from "@/lib/admin-hooks";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import AdminProductThumb from "@/components/admin/AdminProductThumb";
import type { Lead } from "@svcar/contracts";

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

type SortKey = "latest" | "value" | "held";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "latest", label: "Latest activity" },
  { key: "value", label: "Highest value" },
  { key: "held", label: "Longest held" },
];

type FilterKey = "all" | "active" | "stale";
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active (<24h)" },
  { key: "stale", label: "Stale (>24h)" },
];

function customerLabel(l: Lead): string {
  if (l.isGuest) return "Guest";
  return l.customerName || l.customerEmail || l.customerPhone || "Customer";
}

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

export default function LeadsPage() {
  const { data, isLoading, error } = useLeads();
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search, 250);
  const [sort, setSort] = useState<SortKey>("latest");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const rows = useMemo(() => {
    let list = data?.items ?? [];
    const q = debounced.trim().toLowerCase();
    if (q) {
      list = list.filter((l) =>
        [customerLabel(l), l.customerEmail, l.customerPhone].some((s) =>
          s.toLowerCase().includes(q),
        ),
      );
    }
    if (filter !== "all") {
      list = list.filter((l) => {
        const stale = Date.now() - new Date(l.updatedAt).getTime() > DAY_MS;
        return filter === "stale" ? stale : !stale;
      });
    }
    const sorted = [...list];
    if (sort === "latest") sorted.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    else if (sort === "value") sorted.sort((a, b) => b.total - a.total);
    else sorted.sort((a, b) => (a.oldestAddedAt > b.oldestAddedAt ? 1 : -1)); // longest held first
    return sorted;
  }, [data, debounced, filter, sort]);

  return (
    <div className="max-w-5xl pb-20">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Leads</h1>
        {data && (
          <span className="text-sm text-text-secondary">
            {data.total} cart{data.total === 1 ? "" : "s"} · {inr(data.totalValue)}
          </span>
        )}
      </div>
      <p className="mb-4 text-sm text-text-secondary">
        Customers&rsquo; current carts — what they&rsquo;re interested in and how long they&rsquo;ve held it.
      </p>

      <div className="relative mb-4">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name, email or phone…"
          className="input pl-10!"
          type="search"
        />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
              filter === f.key
                ? "border-brand-orange text-brand-orange bg-brand-orange/5"
                : "border-border text-text-secondary hover:bg-surface-dim"
            }`}
          >
            {f.label}
          </button>
        ))}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="ml-auto rounded-full border border-border bg-white px-3 py-1.5 text-sm font-semibold text-text-secondary"
          aria-label="Sort leads"
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
          <p className="text-sm">Couldn&rsquo;t load leads.</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-dim">
            <Users className="text-text-muted" />
          </div>
          <p className="font-medium text-text-secondary">No carts to show</p>
        </div>
      ) : (
        <div className="divide-y divide-border-light overflow-hidden rounded-xl border border-border-light bg-white shadow-sm">
          {rows.map((l) => {
            const isOpen = expanded.has(l.id);
            return (
              <div key={l.id}>
                <button
                  type="button"
                  onClick={() => toggle(l.id)}
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

                  {/* Thumbnails */}
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
                              {it.variantLabel ? (
                                <span className="text-text-muted"> · {it.variantLabel}</span>
                              ) : null}
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
          })}
        </div>
      )}
    </div>
  );
}
