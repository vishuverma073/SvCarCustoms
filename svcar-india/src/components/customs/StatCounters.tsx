"use client";

import { useEffect, useRef, useState } from "react";

type Stat = { value: number; suffix?: string; label: string };

const STATS: Stat[] = [
  { value: 21, suffix: "+", label: "Years in the Game" },
  { value: 640, suffix: "+", label: "Builds Delivered" },
  { value: 48, suffix: "h", label: "Avg. Turnaround" },
  { value: 100, suffix: "%", label: "Road-Legal Work" },
];

function Counter({ stat, run }: { stat: Stat; run: boolean }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!run) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let start = 0;
    const dur = reduce ? 0 : 1500;
    const step = (t: number) => {
      if (!start) start = t;
      const p = dur === 0 ? 1 : Math.min((t - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * stat.value));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [run, stat.value]);

  return (
    <div className="cc-stat">
      <div className="cc-stat-num">
        {n}
        {stat.suffix ? <span className="cc-suffix">{stat.suffix}</span> : null}
      </div>
      <div className="cc-stat-label">{stat.label}</div>
    </div>
  );
}

/** Animated metric bar that counts up the first time it enters the viewport (#9). */
export function StatCounters() {
  const ref = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setRun(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="cc-stats" ref={ref}>
      {STATS.map((s) => (
        <Counter key={s.label} stat={s} run={run} />
      ))}
    </div>
  );
}
