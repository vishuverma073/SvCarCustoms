"use client";

import { Check, Truck } from "lucide-react";
import {
  buildTracking,
  formatStageTime,
  type RawTrackingEvent,
} from "@/lib/order-tracking";
import type { OrderStatus } from "@svcar/contracts";

/**
 * Vertical order-tracking timeline.
 *
 *   Online: Order Placed → Payment Confirmed → Processing → Shipped → Out for Delivery → Delivered
 *   COD:    Order Confirmed → Processing → Shipped → Out for Delivery → Delivered
 *
 * Completed stages are brand-orange with a check + timestamp; the next expected
 * stage is highlighted; later stages are grey. Shows an "Arriving by" estimate
 * until the order is delivered/cancelled.
 */
export default function OrderTimeline({
  events,
  status,
  createdAt,
  isCod = false,
}: {
  events: RawTrackingEvent[];
  status: OrderStatus;
  createdAt: string;
  isCod?: boolean;
}) {
  const { stages, cancelled, cancelledAt, arrivalEstimate } = buildTracking({
    events,
    status,
    createdAt,
    isCod,
  });

  return (
    <section className="bg-white rounded-2xl border border-border-light shadow-card p-5 mb-4">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h2 className="text-xs font-bold uppercase tracking-wide text-text-secondary">Track Order</h2>
        {isCod && (
          <span className="text-[10px] font-bold uppercase tracking-wide text-text-muted bg-surface-dim px-2 py-0.5 rounded-full">
            Cash on Delivery
          </span>
        )}
      </div>

      {arrivalEstimate && (
        <p className="flex items-center gap-1.5 text-sm font-semibold text-text-primary mb-4">
          <Truck size={15} className="text-brand-orange shrink-0" />
          Arriving by {arrivalEstimate}
        </p>
      )}
      {cancelled && (
        <p className="text-sm font-semibold text-danger mb-4">
          {status === "failed" ? "Payment failed" : "Order cancelled"}
          {cancelledAt ? ` · ${formatStageTime(cancelledAt)}` : ""}
        </p>
      )}

      <ol className="relative">
        {stages.map((s, i) => {
          const last = i === stages.length - 1;
          return (
            <li key={s.key} className="flex gap-3 pb-5 last:pb-0 relative">
              {!last && (
                <span
                  className={`absolute left-[11px] top-6 bottom-0 w-px ${s.done ? "bg-brand-orange" : "bg-border-light"}`}
                  aria-hidden
                />
              )}
              <span
                className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  s.done
                    ? "bg-brand-orange text-white"
                    : s.current
                      ? "bg-white border-2 border-brand-orange"
                      : "bg-surface-dim text-text-muted border border-border-light"
                }`}
                aria-hidden
              >
                {s.done ? (
                  <Check size={13} strokeWidth={3} />
                ) : (
                  <span className={`w-1.5 h-1.5 rounded-full ${s.current ? "bg-brand-orange" : "bg-text-muted"}`} />
                )}
              </span>
              <div className="min-w-0 -mt-0.5">
                <p
                  className={`text-sm font-semibold ${s.done || s.current ? "text-text-primary" : "text-text-muted"}`}
                >
                  {s.label}
                </p>
                {s.note && <p className="text-xs text-text-secondary mt-0.5">{s.note}</p>}
                <p className="text-[11px] text-text-muted mt-0.5">
                  {s.at ? formatStageTime(s.at) : s.hint ? s.hint : s.done ? "Completed" : "Pending"}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
