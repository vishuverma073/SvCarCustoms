"use client";

import { useId } from "react";

type CarSvgProps = {
  /** Body paint colour. */
  color?: string;
  /** Surface finish — gloss adds a sheen highlight, matte stays flat. */
  finish?: "gloss" | "matte";
  className?: string;
  /** Optional accent (stripe / rim) colour. */
  accent?: string;
};

/**
 * Hand-built stylised side-profile sports coupe. Pure SVG so it renders with
 * zero assets, scales crisply, and recolours instantly (used by the hero,
 * before/after slider, live configurator, builds carousel and gallery).
 * Drop a real photo in by swapping the consuming component's <CarSvg/> for an
 * <Image/> — the layout slots are identical.
 */
export function CarSvg({
  color = "#E8822A",
  finish = "gloss",
  className,
  accent = "#111118",
}: CarSvgProps) {
  const uid = useId().replace(/:/g, "");
  const sheen = `sheen-${uid}`;
  const rim = `rim-${uid}`;
  const glass = `glass-${uid}`;
  const tire = `tire-${uid}`;

  const renderWheel = (cx: number) => (
    <g key={cx}>
      <circle cx={cx} cy={250} r={52} fill={`url(#${tire})`} />
      <circle cx={cx} cy={250} r={52} fill="none" stroke="#000" strokeOpacity={0.6} strokeWidth={2} />
      <circle cx={cx} cy={250} r={33} fill={`url(#${rim})`} stroke="#0b0b0f" strokeWidth={2} />
      {Array.from({ length: 6 }).map((_, i) => (
        <rect
          key={i}
          x={cx - 3.5}
          y={222}
          width={7}
          height={28}
          rx={3}
          fill="#23232b"
          transform={`rotate(${i * 60} ${cx} ${250})`}
        />
      ))}
      <circle cx={cx} cy={250} r={8} fill={accent} stroke="#3a3a44" strokeWidth={1.5} />
      <circle cx={cx} cy={250} r={52} fill="none" stroke={color} strokeOpacity={0.5} strokeWidth={1} />
    </g>
  );

  return (
    <svg
      viewBox="0 0 820 340"
      className={className}
      role="img"
      aria-label="Custom sports car"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={sheen} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity={finish === "gloss" ? 0.4 : 0.08} />
          <stop offset="0.4" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={rim} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#f4f4f6" />
          <stop offset="0.5" stopColor="#b8b8c2" />
          <stop offset="1" stopColor="#5a5a64" />
        </radialGradient>
        <radialGradient id={tire} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.62" stopColor="#15151b" />
          <stop offset="1" stopColor="#0a0a0e" />
        </radialGradient>
        <linearGradient id={glass} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#cfe6ff" stopOpacity="0.85" />
          <stop offset="0.5" stopColor="#3a6ea5" stopOpacity="0.7" />
          <stop offset="1" stopColor="#0d1b2a" stopOpacity="0.85" />
        </linearGradient>
      </defs>

      {/* ground shadow */}
      <ellipse cx="410" cy="306" rx="330" ry="18" fill="#000" opacity="0.45" />

      {/* lower body */}
      <path
        d="M70 252 C66 224 78 206 110 200 C150 193 210 192 250 196
           C330 200 420 200 470 198 C560 196 610 198 660 206
           C712 213 748 224 766 244 C774 250 772 256 762 257
           L92 257 C80 257 71 256 70 252 Z"
        fill={color}
      />
      {/* cabin / greenhouse */}
      <path
        d="M262 192 C296 150 344 130 416 126 L548 128 C596 132 622 158 640 192 Z"
        fill={color}
      />
      {/* window glass */}
      <path
        d="M300 188 C326 156 366 142 416 140 L524 142 C560 145 584 162 600 188 Z"
        fill={`url(#${glass})`}
      />
      {/* B-pillar */}
      <rect x="452" y="140" width="9" height="50" fill={color} />

      {/* sheen overlay (recolour-safe) */}
      <path
        d="M70 252 C66 224 78 206 110 200 C150 193 210 192 250 196
           C330 200 420 200 470 198 C560 196 610 198 660 206
           C712 213 748 224 766 244 C774 250 772 256 762 257
           L92 257 C80 257 71 256 70 252 Z"
        fill={`url(#${sheen})`}
      />
      <path
        d="M262 192 C296 150 344 130 416 126 L548 128 C596 132 622 158 640 192 Z"
        fill={`url(#${sheen})`}
      />

      {/* belt-line shadow for depth */}
      <path
        d="M96 238 C200 230 520 230 740 244"
        fill="none"
        stroke="#000"
        strokeOpacity="0.18"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* door split line */}
      <path d="M430 200 L452 150" stroke="#000" strokeOpacity="0.2" strokeWidth="2" />

      {/* headlight (front / right) */}
      <path d="M742 226 L766 232 L764 244 L740 240 Z" fill="#fff3d6" />
      <path d="M742 226 L766 232 L764 244 L740 240 Z" fill="none" stroke="#ffce85" strokeWidth="1" />
      {/* taillight (rear / left) */}
      <path d="M71 220 L92 222 L92 236 L72 234 Z" fill="#ff3b3b" opacity="0.9" />
      {/* side mirror */}
      <path d="M300 178 l-16 -6 8 14 z" fill={color} />
      {/* front splitter accent */}
      <path d="M700 257 L770 257 L766 264 L702 264 Z" fill={accent} />

      {renderWheel(210)}
      {renderWheel(632)}
    </svg>
  );
}
