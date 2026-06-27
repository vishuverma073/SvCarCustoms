/**
 * Customer-facing order tracking pipeline.
 *
 * Maps the backend's granular order events (placed / paid / confirmed / shipped /
 * out_for_delivery / delivered) onto the tracking stages shown on the order page:
 *
 *   Online: Order Placed → Payment Confirmed → Processing → Shipped → Out for Delivery → Delivered
 *   COD:    Order Confirmed → Processing → Shipped → Out for Delivery → Delivered
 *
 * A stage is "done" if its event exists OR the order's status implies it (a
 * shipped order is past Processing even if no explicit event row was logged).
 * The first not-done stage is the "current" (next expected) step.
 */
import type { OrderStatus } from "@svcar/contracts";

/** One backend order event, with its raw `eventType` preserved. */
export interface RawTrackingEvent {
  eventType: string; // placed | paid | confirmed | shipped | out_for_delivery | delivered | cancelled | refunded | note
  at: string; // ISO timestamp
  note?: string;
}

export type StageKey =
  | "placed"
  | "paid"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered";

/** Which stage a backend event advances. (note/cancelled/refunded don't map to a stage.) */
const EVENT_TO_STAGE: Record<string, StageKey> = {
  placed: "placed",
  paid: "paid",
  confirmed: "processing",
  shipped: "shipped",
  out_for_delivery: "out_for_delivery",
  delivered: "delivered",
};

const ONLINE_PIPELINE: StageKey[] = [
  "placed",
  "paid",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
];
const COD_PIPELINE: StageKey[] = ["placed", "processing", "shipped", "out_for_delivery", "delivered"];

function stageLabel(key: StageKey, isCod: boolean): string {
  const labels: Record<StageKey, string> = {
    placed: isCod ? "Order Confirmed" : "Order Placed",
    paid: "Payment Confirmed",
    processing: "Processing",
    shipped: "Shipped",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
  };
  return labels[key];
}

export interface TrackingStage {
  key: StageKey;
  label: string;
  done: boolean;
  current: boolean; // the next expected (first not-done) stage
  at?: string; // ISO timestamp when completed
  note?: string;
  hint?: string; // e.g. "Expected within 24 hours"
}

export interface Tracking {
  stages: TrackingStage[];
  cancelled: boolean;
  cancelledAt?: string;
  arrivalEstimate?: string; // e.g. "Friday, 7 Jun"
}

/** "by" date the customer is promised delivery (createdAt + this many days). */
const DELIVERY_DAYS = 6;

/** "3 Jun, 2:14 PM" */
export function formatStageTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function arrivalEstimate(createdAt: string): string {
  const d = new Date(createdAt);
  d.setDate(d.getDate() + DELIVERY_DAYS);
  return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });
}

/** The lowest stage index the order status guarantees is complete. */
function statusFloorIndex(status: OrderStatus, pipeline: StageKey[], isCod: boolean): number {
  switch (status) {
    case "delivered":
      return pipeline.length - 1;
    case "shipped":
      return pipeline.indexOf("shipped");
    case "paid":
      // Online: payment confirmed. COD has no paid stage → just "placed/confirmed".
      return pipeline.indexOf(isCod ? "placed" : "paid");
    default: // "created" (pending payment), "cancelled", "failed"
      return pipeline.indexOf("placed");
  }
}

export function buildTracking(opts: {
  events: RawTrackingEvent[];
  status: OrderStatus;
  createdAt: string;
  isCod?: boolean;
}): Tracking {
  const { events, status, createdAt, isCod = false } = opts;
  const cancelled = status === "cancelled" || status === "failed";
  const pipeline = isCod ? COD_PIPELINE : ONLINE_PIPELINE;

  // Latest event per stage (events arrive oldest → newest).
  const eventByStage = new Map<StageKey, RawTrackingEvent>();
  for (const e of events) {
    const stage = EVENT_TO_STAGE[e.eventType];
    if (stage && pipeline.includes(stage)) eventByStage.set(stage, e);
  }

  // Furthest stage reached = max(highest event stage, status floor).
  let lastEventIdx = -1;
  pipeline.forEach((k, i) => {
    if (eventByStage.has(k)) lastEventIdx = Math.max(lastEventIdx, i);
  });
  const doneThrough = cancelled ? -1 : Math.max(lastEventIdx, statusFloorIndex(status, pipeline, isCod));

  const stages: TrackingStage[] = pipeline.map((key, i) => {
    const ev = eventByStage.get(key);
    const done = i <= doneThrough;
    const current = !cancelled && i === doneThrough + 1;
    return {
      key,
      label: stageLabel(key, isCod),
      done,
      current,
      at: ev?.at,
      note: ev?.note,
      hint: current && key === "processing" ? "Expected within 24 hours" : undefined,
    };
  });

  // A done stage without its own event (e.g. the admin advanced shipped →
  // delivered without logging "out for delivery") inherits the nearest known
  // timestamp, so every completed step shows a time rather than a bare label.
  for (let i = 0; i < stages.length; i++) {
    if (!stages[i].done || stages[i].at) continue;
    let t: string | undefined;
    for (let j = i - 1; j >= 0 && !t; j--) t = stages[j].at;
    for (let j = i + 1; j < stages.length && !t; j++) t = stages[j].at;
    if (t) stages[i].at = t;
  }

  return {
    stages,
    cancelled,
    cancelledAt: cancelled ? events[events.length - 1]?.at : undefined,
    arrivalEstimate: cancelled || status === "delivered" ? undefined : arrivalEstimate(createdAt),
  };
}
