import { z } from "zod";

/** Store Analytics dashboard payload (GET /admin/analytics). */
export const AnalyticsSchema = z.object({
  range: z.string(),
  totals: z.object({
    totalVisitors: z.number(),
    uniqueVisitors: z.number(),
    newVisitors: z.number(),
    returningVisitors: z.number(),
    avgTimeSpentSec: z.number(),
    bounceRatePct: z.number(),
  }),
  traffic: z.array(z.object({ date: z.string(), users: z.number() })),
  topCities: z.array(z.object({ city: z.string(), count: z.number() })),
  devices: z.object({
    groups: z.array(
      z.object({
        label: z.string(),
        pct: z.number(),
        sub: z.array(z.object({ label: z.string(), pct: z.number() })),
      }),
    ),
  }),
  channels: z.array(z.object({ channel: z.string(), pct: z.number() })),
});
export type Analytics = z.infer<typeof AnalyticsSchema>;
export type AnalyticsRange = "days" | "weeks" | "months";
