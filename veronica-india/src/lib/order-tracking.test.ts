import { describe, expect, it } from "vitest";
import { buildTracking, type RawTrackingEvent } from "@/lib/order-tracking";

const placedAt = "2026-06-03T08:44:00.000Z";
const paidAt = "2026-06-03T08:45:00.000Z";

describe("buildTracking — online flow", () => {
  const events: RawTrackingEvent[] = [
    { eventType: "placed", at: placedAt, note: "We've received your order." },
    { eventType: "paid", at: paidAt, note: "Payment confirmed." },
  ];

  it("has all six online stages in order", () => {
    const t = buildTracking({ events, status: "paid", createdAt: placedAt });
    expect(t.stages.map((s) => s.key)).toEqual([
      "placed",
      "paid",
      "processing",
      "shipped",
      "out_for_delivery",
      "delivered",
    ]);
    expect(t.stages[0].label).toBe("Order Placed");
    expect(t.stages[1].label).toBe("Payment Confirmed");
  });

  it("marks placed + paid done and processing as the current step", () => {
    const t = buildTracking({ events, status: "paid", createdAt: placedAt });
    expect(t.stages[0].done).toBe(true);
    expect(t.stages[0].at).toBe(placedAt);
    expect(t.stages[1].done).toBe(true);
    const processing = t.stages.find((s) => s.key === "processing")!;
    expect(processing.done).toBe(false);
    expect(processing.current).toBe(true);
    expect(processing.hint).toBe("Expected within 24 hours");
    expect(t.arrivalEstimate).toBeTruthy();
  });

  it("a shipped order is past Processing even without an explicit processing event", () => {
    const t = buildTracking({ events, status: "shipped", createdAt: placedAt });
    expect(t.stages.find((s) => s.key === "processing")!.done).toBe(true);
    expect(t.stages.find((s) => s.key === "shipped")!.done).toBe(true);
    expect(t.stages.find((s) => s.key === "out_for_delivery")!.current).toBe(true);
  });

  it("delivered completes every stage and drops the arrival estimate", () => {
    const t = buildTracking({ events, status: "delivered", createdAt: placedAt });
    expect(t.stages.every((s) => s.done)).toBe(true);
    expect(t.arrivalEstimate).toBeUndefined();
  });
});

describe("buildTracking — COD flow", () => {
  it("omits Payment Confirmed and labels the first stage 'Order Confirmed'", () => {
    const t = buildTracking({
      events: [{ eventType: "placed", at: placedAt }],
      status: "created",
      createdAt: placedAt,
      isCod: true,
    });
    expect(t.stages.map((s) => s.key)).toEqual([
      "placed",
      "processing",
      "shipped",
      "out_for_delivery",
      "delivered",
    ]);
    expect(t.stages[0].label).toBe("Order Confirmed");
    expect(t.stages.some((s) => s.key === "paid")).toBe(false);
  });
});

describe("buildTracking — cancelled / failed", () => {
  it("flags cancelled and completes no stages", () => {
    const t = buildTracking({
      events: [{ eventType: "placed", at: placedAt }, { eventType: "cancelled", at: paidAt }],
      status: "cancelled",
      createdAt: placedAt,
    });
    expect(t.cancelled).toBe(true);
    expect(t.stages.every((s) => !s.done)).toBe(true);
    expect(t.arrivalEstimate).toBeUndefined();
  });
});
