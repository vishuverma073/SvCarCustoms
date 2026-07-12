import { Hono } from "hono";
import { sql } from "drizzle-orm";
import type { DbClient } from "../../db/client.js";
import { makeRequireAdmin } from "../../middleware/auth.js";
import type { AppEnv } from "../../lib/types.js";

type Row = Record<string, unknown>;
const num = (v: unknown) => (v == null ? 0 : Number(v));

const RANGES = {
  days: { days: 30, bucket: "day" },
  weeks: { days: 84, bucket: "week" },
  months: { days: 365, bucket: "month" },
} as const;
type RangeKey = keyof typeof RANGES;

/** GET /admin/analytics?range=days|weeks|months — Store Analytics dashboard data. */
export function makeAdminAnalyticsRouter(db: DbClient) {
  const router = new Hono<AppEnv>();
  router.use("*", makeRequireAdmin(db));

  router.get("/", async (c) => {
    const rk = (c.req.query("range") as RangeKey) || "days";
    const { days, bucket } = RANGES[rk] ?? RANGES.days;
    const start = new Date(Date.now() - days * 86400000);

    const exec = async (q: ReturnType<typeof sql>): Promise<Row[]> => {
      const r = await db.execute(q);
      return (Array.isArray(r) ? r : (r as { rows?: Row[] }).rows ?? []) as Row[];
    };

    // Session-level rollup: sessions, unique visitors, avg duration, bounce.
    const [sessAgg] = await exec(sql`
      with s as (
        select session_id, visitor_id, count(*)::int as views,
               extract(epoch from (max(created_at) - min(created_at))) as dur
        from analytics_events where created_at >= ${start}
        group by session_id, visitor_id
      )
      select count(*)::int total_sessions,
             count(distinct visitor_id)::int unique_visitors,
             coalesce(avg(dur),0) avg_dur,
             coalesce(avg(case when views = 1 then 1.0 else 0.0 end),0) bounce
      from s`);

    const [newAgg] = await exec(sql`
      select count(*)::int new_visitors from (
        select visitor_id, min(created_at) first_seen from analytics_events group by visitor_id
      ) f where f.first_seen >= ${start}`);

    const traffic = await exec(sql`
      select date_trunc(${bucket}, created_at) as b, count(distinct session_id)::int users
      from analytics_events where created_at >= ${start}
      group by b order by b`);

    const cities = await exec(sql`
      select coalesce(city,'Unknown') city, count(distinct session_id)::int cnt
      from analytics_events where created_at >= ${start} and city is not null and city <> ''
      group by city order by cnt desc limit 8`);

    const devices = await exec(sql`
      select device_type, coalesce(os,'Other') os, count(*)::int cnt
      from analytics_events where created_at >= ${start}
      group by device_type, os`);

    const channels = await exec(sql`
      select channel, count(*)::int cnt
      from analytics_events where created_at >= ${start}
      group by channel order by cnt desc`);

    const unique = num(sessAgg?.unique_visitors);
    const newV = Math.min(num(newAgg?.new_visitors), unique);
    const totalDevices = devices.reduce((s, r) => s + num(r.cnt), 0) || 1;
    const pct = (n: number) => Math.round((n / totalDevices) * 10000) / 100;
    const dsum = (pred: (r: Row) => boolean) => devices.filter(pred).reduce((s, r) => s + num(r.cnt), 0);

    const totalCh = channels.reduce((s, r) => s + num(r.cnt), 0) || 1;

    return c.json({
      range: rk,
      totals: {
        totalVisitors: num(sessAgg?.total_sessions),
        uniqueVisitors: unique,
        newVisitors: newV,
        returningVisitors: Math.max(0, unique - newV),
        avgTimeSpentSec: Math.round(num(sessAgg?.avg_dur)),
        bounceRatePct: Math.round(num(sessAgg?.bounce) * 100),
      },
      traffic: traffic.map((r) => ({ date: new Date(r.b as string).toISOString(), users: num(r.users) })),
      topCities: cities.map((r) => ({ city: String(r.city), count: num(r.cnt) })),
      devices: {
        groups: [
          {
            label: "Mobile",
            pct: pct(dsum((r) => r.device_type === "Mobile")),
            sub: [
              { label: "iOS", pct: pct(dsum((r) => r.os === "iOS")) },
              { label: "Android", pct: pct(dsum((r) => r.os === "Android")) },
            ],
          },
          {
            label: "Laptop/Desktop",
            pct: pct(dsum((r) => r.device_type === "Desktop")),
            sub: [
              { label: "Windows", pct: pct(dsum((r) => r.os === "Windows")) },
              { label: "Macbook", pct: pct(dsum((r) => r.os === "macOS")) },
            ],
          },
          { label: "Others", pct: pct(dsum((r) => r.device_type === "Other")), sub: [] },
        ],
      },
      channels: channels.map((r) => ({
        channel: String(r.channel),
        pct: Math.round((num(r.cnt) / totalCh) * 10000) / 100,
      })),
    });
  });

  return router;
}
