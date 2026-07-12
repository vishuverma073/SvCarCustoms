"use client";

import { useState } from "react";
import {
  Users,
  UserPlus,
  UserCheck,
  Clock,
  TrendingDown,
  Loader2,
  AlertCircle,
  MapPin,
} from "lucide-react";
import { useAnalytics } from "@/lib/admin-hooks";
import type { Analytics, AnalyticsRange } from "@svcar/contracts";

/* ─────────────────────────── helpers ─────────────────────────── */

function fmtNum(n: number): string {
  return n.toLocaleString("en-IN");
}
function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m}min ${s}s` : `${s}s`;
}

/* ───────────────────────── SVG line chart ───────────────────────── */

function TrafficChart({ points, range }: { points: { date: string; users: number }[]; range: AnalyticsRange }) {
  if (points.length === 0) {
    return <div className="flex h-64 items-center justify-center text-sm text-text-muted">No traffic yet.</div>;
  }
  const W = 900;
  const H = 300;
  const pad = { l: 44, r: 16, t: 20, b: 36 };
  const maxU = Math.max(...points.map((p) => p.users), 1);
  const niceMax = Math.ceil(maxU / 20) * 20 || 20;
  const n = points.length;
  const x = (i: number) => pad.l + (n <= 1 ? 0 : (i / (n - 1)) * (W - pad.l - pad.r));
  const y = (u: number) => H - pad.b - (u / niceMax) * (H - pad.t - pad.b);

  // Catmull-Rom → cubic bézier for a smooth curve.
  const pts = points.map((p, i) => [x(i), y(p.users)] as const);
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  const area = `${d} L ${x(n - 1)},${H - pad.b} L ${x(0)},${H - pad.b} Z`;

  const yTicks = [0, niceMax / 4, niceMax / 2, (niceMax * 3) / 4, niceMax];
  const labelEvery = Math.max(1, Math.floor(n / 8));
  const fmtX = (iso: string) => {
    const dt = new Date(iso);
    if (range === "months") return dt.toLocaleDateString("en-IN", { month: "short" });
    return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-[300px] w-full min-w-[560px]" preserveAspectRatio="none">
        <defs>
          <linearGradient id="trafficFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={pad.l} y1={y(t)} x2={W - pad.r} y2={y(t)} stroke="#eef0f2" strokeWidth={1} />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#9aa1a9">
              {Math.round(t)}
            </text>
          </g>
        ))}
        <path d={area} fill="url(#trafficFill)" />
        <path d={d} fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round" />
        {points.map((p, i) =>
          i % labelEvery === 0 || i === n - 1 ? (
            <text key={i} x={x(i)} y={H - 12} textAnchor="middle" fontSize="11" fill="#9aa1a9">
              {fmtX(p.date)}
            </text>
          ) : null,
        )}
      </svg>
    </div>
  );
}

/* ───────────────────────── SVG donut ───────────────────────── */

function Donut({ segments, size = 150 }: { segments: { pct: number; color: string }[]; size?: number }) {
  const stroke = 20;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f2f4" strokeWidth={stroke} />
      {segments
        .filter((s) => s.pct > 0)
        .map((s, i) => {
          const len = (C * s.pct) / 100;
          const el = (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
          offset += len;
          return el;
        })}
    </svg>
  );
}

/* ───────────────────────── stat card ───────────────────────── */

function Stat({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  tint: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border-light bg-white p-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tint}`}>
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[13px] text-text-muted">{label}</p>
        <p className="text-xl font-bold text-text-primary">{value}</p>
      </div>
    </div>
  );
}

const DEVICE_COLORS = ["#14b8a6", "#6366f1", "#9ca3af"];
const CHANNEL_COLORS: Record<string, string> = {
  Google: "#f59e0b",
  Instagram: "#ec4899",
  Facebook: "#3b5998",
  Whatsapp: "#25d366",
  Others: "#9ca3af",
  Direct: "#9ca3af",
};

/* ───────────────────────── page ───────────────────────── */

export default function StoreAnalyticsPage() {
  const [range, setRange] = useState<AnalyticsRange>("days");
  const { data, isLoading, error } = useAnalytics(range);

  return (
    <div className="space-y-6 pb-16">
      <h1 className="text-xl font-bold text-text-primary">Store Analytics</h1>

      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          <AlertCircle size={18} /> Couldn&rsquo;t load analytics.
        </div>
      ) : isLoading || !data ? (
        <div className="flex h-64 items-center justify-center text-text-muted">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <Loaded data={data} range={range} setRange={setRange} />
      )}
    </div>
  );
}

function Loaded({
  data,
  range,
  setRange,
}: {
  data: Analytics;
  range: AnalyticsRange;
  setRange: (r: AnalyticsRange) => void;
}) {
  const t = data.totals;
  const deviceSegs = data.devices.groups.map((g, i) => ({ pct: g.pct, color: DEVICE_COLORS[i] ?? "#9ca3af" }));
  const channelSegs = data.channels.map((c) => ({ pct: c.pct, color: CHANNEL_COLORS[c.channel] ?? "#9ca3af" }));

  return (
    <>
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Users} label="Total Visitors" value={fmtNum(t.totalVisitors)} tint="bg-gray-100 text-gray-600" />
        <Stat icon={UserCheck} label="Unique Visitors" value={fmtNum(t.uniqueVisitors)} tint="bg-violet-100 text-violet-600" />
        <Stat icon={UserPlus} label="New Visitors" value={fmtNum(t.newVisitors)} tint="bg-blue-100 text-blue-600" />
        <Stat icon={Users} label="Returning Visitors" value={fmtNum(t.returningVisitors)} tint="bg-emerald-100 text-emerald-600" />
        <Stat icon={Clock} label="Average Time Spent" value={fmtDuration(t.avgTimeSpentSec)} tint="bg-amber-100 text-amber-600" />
        <Stat icon={TrendingDown} label="Bounce Rate" value={`${t.bounceRatePct}%`} tint="bg-red-100 text-red-600" />
      </div>

      {/* Traffic chart */}
      <div className="rounded-2xl border border-border-light bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-primary">Website Traffic</h2>
          <div className="inline-flex rounded-lg border border-border-light p-0.5 text-xs font-medium">
            {(["days", "weeks", "months"] as AnalyticsRange[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded-md px-3 py-1.5 capitalize transition-colors ${
                  range === r ? "bg-brand-orange text-white" : "text-text-muted hover:text-text-primary"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <TrafficChart points={data.traffic} range={range} />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Cities */}
        <div className="rounded-2xl border border-border-light bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <MapPin size={16} className="text-text-muted" />
            <h2 className="text-sm font-bold text-text-primary">Highest Visitors From</h2>
          </div>
          <div className="flex items-center justify-between border-b border-border-light pb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            <span>City</span>
            <span>Visits</span>
          </div>
          <ul>
            {data.topCities.length === 0 ? (
              <li className="py-4 text-sm text-text-muted">No city data yet.</li>
            ) : (
              data.topCities.map((c) => (
                <li key={c.city} className="flex items-center justify-between border-b border-border-light/60 py-2.5 text-sm">
                  <span className="truncate pr-2 text-text-secondary">{c.city}</span>
                  <span className="font-semibold text-text-primary tabular-nums">{fmtNum(c.count)}</span>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Device Traffic */}
        <div className="rounded-2xl border border-border-light bg-white p-5">
          <h2 className="mb-4 text-sm font-bold text-text-primary">Device Traffic</h2>
          <div className="flex justify-center">
            <Donut segments={deviceSegs} />
          </div>
          <ul className="mt-4 space-y-3">
            {data.devices.groups.map((g, i) => (
              <li key={g.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-text-secondary">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: DEVICE_COLORS[i] ?? "#9ca3af" }} />
                    {g.label}
                  </span>
                  <span className="font-bold text-text-primary tabular-nums">{g.pct}%</span>
                </div>
                {g.sub.map((s) => (
                  <div key={s.label} className="flex items-center justify-between pl-4.5 text-[12px] text-text-muted">
                    <span>{s.label}</span>
                    <span className="tabular-nums">{s.pct}%</span>
                  </div>
                ))}
              </li>
            ))}
          </ul>
        </div>

        {/* Acquisition Channels */}
        <div className="rounded-2xl border border-border-light bg-white p-5">
          <h2 className="mb-4 text-sm font-bold text-text-primary">Acquisition Channels</h2>
          <div className="flex justify-center">
            <Donut segments={channelSegs} />
          </div>
          <ul className="mt-4 space-y-2.5">
            {data.channels.map((c) => (
              <li key={c.channel} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-text-secondary">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHANNEL_COLORS[c.channel] ?? "#9ca3af" }} />
                  {c.channel}
                </span>
                <span className="font-bold text-text-primary tabular-nums">{c.pct}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
