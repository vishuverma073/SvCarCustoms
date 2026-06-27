"use client";

import { useEffect, useRef } from "react";
import { ChevronRight, Play, Star } from "lucide-react";
import { CarSvg } from "./CarSvg";
import { Particles } from "./Particles";

const KINETIC = [
  "Custom Wraps",
  "Performance Tuning",
  "Alloy Wheels",
  "Ceramic Coating",
  "Body Kits",
  "Detailing",
];

/**
 * Mega hero: synthwave/garage backdrop with optional looping video (#1),
 * mouse parallax on the layers (#3), a cursor-tracking spotlight (#5), a
 * 3D-tilt hero car (#6), kinetic marquee + shimmer headline (#8) and an
 * ember particle field (#13). Pointer logic is rAF-throttled and writes
 * straight to the DOM to stay smooth.
 */
export function Hero({ videoSrc }: { videoSrc?: string }) {
  const heroRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let tx = 0;
    let ty = 0;

    const apply = () => {
      raf = 0;
      if (gridRef.current) gridRef.current.style.transform = `perspective(420px) rotateX(64deg) translateX(${tx * -22}px)`;
      if (glowRef.current) glowRef.current.style.transform = `translateX(calc(-50% + ${tx * 26}px))`;
      if (tiltRef.current)
        tiltRef.current.style.transform = `rotateY(${tx * 12}deg) rotateX(${ty * -8}deg) translate3d(${tx * 26}px, ${ty * 16}px, 0)`;
    };

    const onMove = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      hero.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
      hero.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      if (!raf) raf = requestAnimationFrame(apply);
    };

    hero.addEventListener("pointermove", onMove);
    hero.addEventListener("pointerleave", onLeave);
    return () => {
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header id="top" className="cc-hero" ref={heroRef}>
      {videoSrc ? (
        <video className="cc-hero-video" autoPlay muted loop playsInline>
          <source src={videoSrc} />
        </video>
      ) : null}
      <div className="cc-hero-bg" />
      <Particles className="cc-hero-video" />
      <div className="cc-hero-grid" ref={gridRef} />
      <div className="cc-hero-scrim" />
      <div className="cc-spotlight" />

      {/* speed lines */}
      <span className="cc-speedline" style={{ top: "30%", width: "180px" }} />
      <span className="cc-speedline" style={{ top: "52%", width: "120px", animationDelay: "1.1s" }} />
      <span className="cc-speedline" style={{ top: "68%", width: "220px", animationDelay: "1.9s" }} />

      <div className="cc-hero-inner">
        <div className="cc-hero-copy">
          <span className="cc-hero-tag">
            <span className="cc-dot" /> Booking builds for 2026 — limited slots
          </span>

          <h1 className="cc-hero-title">
            <span className="cc-outline">Built</span>{" "}
            <span className="cc-shine">Different.</span>
            <br />
            Customised <span className="cc-accent" style={{ color: "var(--cc-orange)" }}>To Perfection.</span>
          </h1>

          <p className="cc-hero-sub">
            Wraps, performance tuning, alloys and showroom detailing — SV Car Customs
            turns everyday cars into head-turning, road-legal statements.
          </p>

          <div className="cc-hero-actions">
            <a href="#configurator" className="cc-btn cc-btn-primary">
              Build Your Car <ChevronRight size={18} />
            </a>
            <a href="#builds" className="cc-btn cc-btn-ghost">
              <Play size={16} /> View Builds
            </a>
          </div>

          <div className="cc-hero-tag" style={{ marginTop: 26, gap: 12 }}>
            <span style={{ display: "inline-flex", gap: 2, color: "var(--cc-orange)" }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
              ))}
            </span>
            4.9/5 from 600+ owners
          </div>
        </div>

        <div className="cc-hero-stage">
          <div className="cc-tilt" ref={tiltRef}>
            <div className="cc-float">
              <CarSvg className="cc-hero-car" color="#E8822A" />
            </div>
          </div>
          <div className="cc-hero-underglow" ref={glowRef} />
        </div>
      </div>

      {/* kinetic marquee (#8) */}
      <div className="cc-kinetic">
        <div className="cc-kinetic-track">
          {[...KINETIC, ...KINETIC].map((w, i) => (
            <span key={i}>{w}</span>
          ))}
        </div>
      </div>

      <div className="cc-hero-scroll">
        <i />
        Scroll
      </div>
    </header>
  );
}
