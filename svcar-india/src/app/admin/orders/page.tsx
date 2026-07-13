"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  IndianRupee,
  Loader2,
  Package,
  Search,
  ShoppingCart,
} from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { useOrderStats } from "@/lib/admin-hooks";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

/** Status filter tabs (key = backend status, "" = all). */
const FILTERS = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "paid", label: "Paid" },
  { key: "confirmed", label: "Processing" },
  { key: "shipped", label: "On the way" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
] as const;

/** Date-range presets — value matches the backend ?range= param. */
const RANGES = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "12m", label: "Last 12 months" },
  { key: "all", label: "All time" },
] as const;

// Every status the admin can set from the list (override mode: any → any).
// `confirmed` is shown as "Processing"; `out_for_delivery` logs a timeline event.
const ALL_STATUSES = [
  "pending",
  "paid",
  "confirmed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refunded",
] as const;
const STATUS_LABEL: Record<string, string> = {
  pending: "Pending payment",
  paid: "Payment confirmed",
  confirmed: "Processing",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  paid: "bg-blue-100 text-blue-700 border-blue-200",
  confirmed: "bg-indigo-100 text-indigo-700 border-indigo-200",
  shipped: "bg-purple-100 text-purple-700 border-purple-200",
  out_for_delivery: "bg-cyan-100 text-cyan-700 border-cyan-200",
  delivered: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-600 border-red-200",
  refunded: "bg-gray-200 text-gray-600 border-gray-300",
};

/** Derive a payment badge from the order status (list has no separate field). */
function paymentBadge(status: string): { label: string; cls: string } {
  if (status === "pending") return { label: "Unpaid", cls: "bg-amber-50 text-amber-700 border-amber-200" };
  if (status === "refunded") return { label: "Refunded", cls: "bg-gray-100 text-gray-600 border-gray-300" };
  if (status === "cancelled") return { label: "—", cls: "bg-gray-50 text-gray-400 border-gray-200" };
  return { label: "Paid", cls: "bg-green-50 text-green-700 border-green-200" };
}

function inr(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

/** Compact stat tile for the dashboard row. */
function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-border-light shadow-sm p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-text-muted truncate">{label}</p>
        <p className="text-lg font-bold text-text-primary leading-tight">{value}</p>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [filter, setFilter] = useState<string>("");
  const [range, setRange] = useState<string>("12m");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [statusConfirm, setStatusConfirm] = useState<{
    id: string;
    orderNumber: string;
    from: string;
    to: string;
  } | null>(null);

  const { data: stats } = useOrderStats(range);
  const { data: orders, isLoading, mutate } = useSWR(
    ["admin/orders", filter, debouncedSearch, range],
    () => adminApi.listOrders(filter || undefined, debouncedSearch || undefined, range),
  );

  async function setStatus(id: string, status: string) {
    try {
      await adminApi.addOrderEvent(id, status);
      toast.success(`Order marked ${STATUS_LABEL[status] ?? status}`);
      mutate();
    } catch {
      toast.error("Couldn’t update the order");
    }
  }

  // Confirm before any status change (override mode: cancelled → shipped, etc.).
  function requestStatus(o: { id: string; orderNumber: string; status: string }, next: string) {
    if (!next || next === o.status) return;
    setStatusConfirm({ id: o.id, orderNumber: o.orderNumber, from: o.status, to: next });
  }

  // Count shown on each filter tab (range-scoped, from the stats endpoint).
  function tabCount(key: string): number | null {
    if (!stats) return null;
    if (key === "") return stats.totalOrders;
    return stats.statusCounts[key] ?? 0;
  }

  return (
    <div className="max-w-5xl pb-20">
      <h1 className="text-xl font-bold text-text-primary mb-4">Orders</h1>

      {/* Dashboard tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Stat
          icon={<Package size={18} className="text-blue-600" />}
          label="Total orders"
          value={stats ? stats.totalOrders.toLocaleString("en-IN") : "—"}
          accent="bg-blue-50"
        />
        <Stat
          icon={<IndianRupee size={18} className="text-green-600" />}
          label="Total revenue"
          value={stats ? inr(stats.totalRevenue) : "—"}
          accent="bg-green-50"
        />
        <Stat
          icon={<Clock size={18} className="text-amber-600" />}
          label="Pending"
          value={stats ? stats.pendingOrders.toLocaleString("en-IN") : "—"}
          accent="bg-amber-50"
        />
        <Stat
          icon={<CheckCircle2 size={18} className="text-emerald-600" />}
          label="Completed"
          value={stats ? stats.completedOrders.toLocaleString("en-IN") : "—"}
          accent="bg-emerald-50"
        />
      </div>

      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, phone, or name…"
            className="input pl-10!"
            type="search"
          />
        </div>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="input py-2! w-full text-sm font-semibold sm:w-48"
          aria-label="Date range"
        >
          {RANGES.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map((f) => {
          const cnt = tabCount(f.key);
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                filter === f.key
                  ? "border-brand-orange text-brand-orange bg-brand-orange/5"
                  : "border-border text-text-secondary hover:bg-surface-dim"
              }`}
            >
              {f.label}
              {cnt != null && (
                <span
                  className={`ml-1.5 text-xs font-bold ${
                    filter === f.key ? "text-brand-orange" : "text-text-muted"
                  }`}
                >
                  {cnt}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20 text-text-muted">
          <Loader2 className="animate-spin" />
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-dim flex items-center justify-center">
            <ShoppingCart className="text-text-muted" />
          </div>
          <p className="text-text-secondary font-medium">
            No orders{filter ? ` marked “${FILTERS.find((f) => f.key === filter)?.label}”` : ""} in this range
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border-light shadow-sm divide-y divide-border-light overflow-hidden">
          {orders.map((o) => {
            const pay = paymentBadge(o.status);
            return (
              <div
                key={o.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 hover:bg-surface-dim/40 transition-colors"
              >
                <Link href={`/admin/orders/${o.id}`} className="flex-1 min-w-0 block">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-text-primary">{o.orderNumber}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wide rounded border px-1.5 py-0.5 ${pay.cls}`}>
                      {pay.label}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mt-0.5 truncate">
                    {o.customerName || "Customer"} · {o.customerPhone} · {o.itemCount} item
                    {o.itemCount === 1 ? "" : "s"}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {new Date(o.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </Link>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-bold text-text-primary whitespace-nowrap">{inr(o.total)}</span>
                  {/* Status badge IS the changer: shows current status, change it inline
                      (confirms first, then updates status + timeline + badge). */}
                  <select
                    value={o.status}
                    onChange={(e) => requestStatus(o, e.target.value)}
                    className={`text-xs font-bold uppercase tracking-wide rounded-full border px-2.5 py-1.5 cursor-pointer ${
                      STATUS_STYLE[o.status] ?? "bg-surface-dim text-text-secondary border-border"
                    }`}
                    aria-label={`Order status: ${STATUS_LABEL[o.status] ?? o.status}`}
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s] ?? s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={statusConfirm != null}
        title="Change order status?"
        message={
          statusConfirm
            ? `Change ${statusConfirm.orderNumber} from “${STATUS_LABEL[statusConfirm.from] ?? statusConfirm.from}” to “${STATUS_LABEL[statusConfirm.to] ?? statusConfirm.to}”? This updates the order status and adds a timeline entry.`
            : ""
        }
        confirmLabel="Update status"
        onCancel={() => setStatusConfirm(null)}
        onConfirm={() => {
          if (statusConfirm) {
            void setStatus(statusConfirm.id, statusConfirm.to);
          }
          setStatusConfirm(null);
        }}
      />
    </div>
  );
}
