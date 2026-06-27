"use client";

import { useEffect, useRef } from "react";

/**
 * Lightweight canvas ember/spark field for the hero backdrop (#13).
 * rAF-driven, DPR-aware, auto-pauses for `prefers-reduced-motion`, and cleans
 * up on unmount. No dependencies.
 */
export function Particles({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    type P = { x: number; y: number; vx: number; vy: number; r: number; life: number; max: number };
    let parts: P[] = [];

    const seed = (x: number) =>
      // pseudo-random spread without Math.random (varies by index/position)
      (Math.sin(x * 12.9898) * 43758.5453) % 1;

    const spawn = (i: number): P => {
      const a = Math.abs(seed(i + parts.length));
      const b = Math.abs(seed(i * 1.7 + 3));
      const max = 240 + a * 260;
      return {
        x: a * w,
        y: h * 0.5 + b * h * 0.5,
        vx: (b - 0.5) * 0.25,
        vy: -(0.25 + a * 0.55),
        r: 0.6 + b * 1.8,
        life: a * max,
        max,
      };
    };

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = reduce ? 0 : Math.min(70, Math.round((w * h) / 26000));
      parts = Array.from({ length: count }, (_, i) => spawn(i));
    };

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        p.life += 1;
        if (p.life > p.max || p.y < -10) {
          Object.assign(p, spawn(p.life));
          p.y = h + 8;
        }
        const t = p.life / p.max;
        const alpha = Math.sin(t * Math.PI) * 0.6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232, ${130 + Math.round(t * 60)}, 42, ${alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(232,130,42,0.8)";
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    if (!reduce) raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}

/**
 * Adds `cc-in` to elements with `.cc-reveal` as they scroll into view.
 * One observer for the whole page; call once near the top of the page tree.
 */
export function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".cc-reveal");
    if (!("IntersectionObserver" in window) || els.length === 0) {
      els.forEach((el) => el.classList.add("cc-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("cc-in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}
