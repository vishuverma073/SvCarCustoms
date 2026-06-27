"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { Maximize2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { CarSvg } from "./CarSvg";

const ITEMS = [
  { title: "Sunset Drift", tag: "Wrap + Alloys", color: "#E8822A", finish: "gloss" as const },
  { title: "Ocean Spec", tag: "Full Detail", color: "#1E3A8A", finish: "gloss" as const },
  { title: "Apex Red", tag: "Body Kit", color: "#d22f2f", finish: "gloss" as const },
  { title: "Forest Run", tag: "Performance", color: "#1f7a4d", finish: "matte" as const },
  { title: "Phantom", tag: "Stealth PPF", color: "#1b1b22", finish: "matte" as const },
  { title: "Voltage", tag: "Custom Alloys", color: "#aee02a", finish: "gloss" as const },
];

function tilt(e: MouseEvent<HTMLButtonElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width - 0.5;
  const py = (e.clientY - r.top) / r.height - 0.5;
  el.style.transform = `rotateY(${px * 10}deg) rotateX(${py * -10}deg) translateY(-4px)`;
}
function untilt(e: MouseEvent<HTMLButtonElement>) {
  e.currentTarget.style.transform = "";
}

/** 3D-tilt build gallery with a full-screen lightbox + keyboard nav (#12). */
export function Gallery() {
  const [open, setOpen] = useState<number | null>(null);
  const n = ITEMS.length;

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowLeft") setOpen((p) => (p === null ? p : (p - 1 + n) % n));
      if (e.key === "ArrowRight") setOpen((p) => (p === null ? p : (p + 1) % n));
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, n]);

  const active = open === null ? null : ITEMS[open];

  return (
    <section id="gallery" className="cc-section">
      <span className="cc-eyebrow cc-reveal">Portfolio</span>
      <h2 className="cc-h2 cc-reveal">
        The <span className="cc-accent">gallery.</span>
      </h2>
      <p className="cc-lead cc-reveal">Tap any build to open it full-screen. Use ← → to browse.</p>

      <div className="cc-gallery">
        {ITEMS.map((it, idx) => (
          <button
            key={it.title}
            type="button"
            className="cc-gcard cc-reveal"
            onMouseMove={tilt}
            onMouseLeave={untilt}
            onClick={() => setOpen(idx)}
            aria-label={`Open ${it.title}`}
          >
            <div className="cc-gcard-art" style={{ background: `radial-gradient(60% 50% at 50% 40%, ${it.color}33, transparent 65%)` }}>
              <CarSvg className="cc-hero-car" color={it.color} finish={it.finish} />
            </div>
            <span className="cc-gcard-zoom">
              <Maximize2 size={16} />
            </span>
            <div className="cc-gcard-info">
              <b>{it.title}</b>
              <span>{it.tag}</span>
            </div>
          </button>
        ))}
      </div>

      <div
        className={`cc-lightbox${open !== null ? " cc-open" : ""}`}
        onClick={() => setOpen(null)}
        aria-hidden={open === null}
      >
        {active ? (
          <div className="cc-lightbox-stage" onClick={(e) => e.stopPropagation()}>
            <CarSvg className="cc-hero-car" color={active.color} finish={active.finish} />
            <div className="cc-lightbox-cap">
              <span>{active.tag}</span>
              <b>{active.title}</b>
            </div>
            <button className="cc-lightbox-x" aria-label="Close" onClick={() => setOpen(null)}>
              <X size={22} />
            </button>
            <button
              className="cc-lightbox-arrow cc-prev"
              aria-label="Previous"
              onClick={() => setOpen((p) => (p === null ? p : (p - 1 + n) % n))}
            >
              <ChevronLeft size={22} />
            </button>
            <button
              className="cc-lightbox-arrow cc-next"
              aria-label="Next"
              onClick={() => setOpen((p) => (p === null ? p : (p + 1) % n))}
            >
              <ChevronRight size={22} />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
