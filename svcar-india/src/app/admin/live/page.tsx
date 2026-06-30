"use client";

import {
  Loader2,
  Radio,
  AlertCircle,
  MessageCircle,
  Mail,
  Eye,
  ShoppingCart,
} from "lucide-react";
import { useLive } from "@/lib/admin-hooks";
import AdminProductThumb from "@/components/admin/AdminProductThumb";
import type { LiveVisitor } from "@svcar/contracts";

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

function sinceLabel(iso: string): string {
  const sec = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  return `${Math.round(min / 60)}h ago`;
}

function onSiteLabel(iso: string): string {
  const sec = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  const min = Math.floor(sec / 60);
  if (min < 1) return `${sec}s`;
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

function customerLabel(v: LiveVisitor): string {
  if (v.isGuest) return "Guest";
  return v.customerName || v.customerEmail || v.customerPhone || "Customer";
}

function FollowUp({ v }: { v: LiveVisitor }) {
  if (v.isGuest) {
    return (
      <span className="inline-flex items-center rounded-full bg-surface-dim px-2 py-0.5 text-[11px] font-semibold text-text-muted">
        Guest
      </span>
    );
  }
  const phone = v.customerPhone.replace(/[^0-9]/g, "");
  return (
    <div className="flex items-center gap-1.5">
      {phone && (
        <a
          href={`https://wa.me/${phone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full bg-whatsapp/10 px-2.5 py-1 text-[11px] font-semibold text-whatsapp hover:bg-whatsapp/20"
        >
          <MessageCircle size={13} /> WhatsApp
        </a>
      )}
      {v.customerEmail && (
        <a
          href={`mailto:${v.customerEmail}`}
          className="inline-flex items-center gap-1 rounded-full bg-brand-orange/10 px-2.5 py-1 text-[11px] font-semibold text-brand-orange hover:bg-brand-orange/20"
        >
          <Mail size={13} /> Email
        </a>
      )}
    </div>
  );
}

export default function LivePage() {
  const { data, isLoading, error } = useLive();
  const visitors = data?.items ?? [];

  return (
    <div className="max-w-5xl pb-20">
      <div className="mb-1 flex items-center gap-3">
        <h1 className="text-xl font-bold text-text-primary">Live</h1>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-600">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          {data ? `${data.onlineCount} online now` : "—"}
        </span>
      </div>
      <p className="mb-5 text-sm text-text-secondary">
        Shoppers active on the site right now, what page they&rsquo;re on, and what&rsquo;s in their cart.
        Updates every few seconds.
      </p>

      {isLoading && !data ? (
        <div className="flex justify-center py-20 text-text-muted">
          <Loader2 className="animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center text-text-secondary">
          <AlertCircle className="text-danger" />
          <p className="text-sm">Couldn&rsquo;t load live activity.</p>
        </div>
      ) : visitors.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-dim">
            <Radio className="text-text-muted" />
          </div>
          <p className="font-medium text-text-secondary">No one browsing right now</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visitors.map((v) => (
            <div
              key={v.id}
              className="rounded-xl border border-border-light bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                    </span>
                    <span className="truncate font-semibold text-text-primary">
                      {customerLabel(v)}
                    </span>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-[12px] text-text-secondary">
                    <Eye size={13} className="shrink-0" />
                    <span className="truncate font-mono">{v.currentPath}</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-text-muted">
                    On site {onSiteLabel(v.startedAt)} · active {sinceLabel(v.lastSeen)}
                  </p>
                </div>
                <FollowUp v={v} />
              </div>

              {/* Cart */}
              <div className="mt-3 flex items-center gap-3 rounded-lg bg-surface-dim/40 p-2.5">
                {v.items.length === 0 ? (
                  <p className="flex items-center gap-1.5 text-[12px] text-text-muted">
                    <ShoppingCart size={14} /> Just browsing — empty cart
                  </p>
                ) : (
                  <>
                    <div className="flex items-center -space-x-2">
                      {v.items.slice(0, 3).map((it, i) => (
                        <div
                          key={i}
                          className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-border-light bg-white"
                        >
                          <AdminProductThumb src={it.image} className="p-0.5" iconSize={13} />
                        </div>
                      ))}
                    </div>
                    <p className="min-w-0 flex-1 truncate text-[12px] text-text-secondary">
                      {v.itemCount} item{v.itemCount === 1 ? "" : "s"} ·{" "}
                      <span className="font-semibold text-text-primary">{inr(v.total)}</span>
                    </p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
