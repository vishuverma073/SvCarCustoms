"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CarSvg } from "./CarSvg";

const BUILDS = [
  {
    badge: "Full Build",
    title: "Project Ember",
    desc: "Satin-orange full wrap, stage-2 remap and forged 19s. A daily that turns every head.",
    color: "#E8822A",
    finish: "matte" as const,
    specs: [
      ["+82", "bhp gained"],
      ["19\"", "forged alloys"],
      ["6", "weeks build"],
    ],
  },
  {
    badge: "Track Spec",
    title: "Blue Phantom",
    desc: "Midnight-blue gloss, widebody arches and a coilover setup tuned for the apex.",
    color: "#1E3A8A",
    finish: "gloss" as const,
    specs: [
      ["−35", "kg weight"],
      ["Widebody", "conversion"],
      ["Track", "alignment"],
    ],
  },
  {
    badge: "Show Car",
    title: "Crimson Royale",
    desc: "Candy-red multi-stage paint, chrome delete and a full custom leather retrim.",
    color: "#d22f2f",
    finish: "gloss" as const,
    specs: [
      ["9H", "ceramic coat"],
      ["Custom", "interior"],
      ["Show", "winner"],
    ],
  },
  {
    badge: "Sleeper",
    title: "Shadow Spec",
    desc: "Stealth-black satin PPF, blacked-out everything and a quietly brutal exhaust.",
    color: "#1b1b22",
    finish: "matte" as const,
    specs: [
      ["Full", "PPF armour"],
      ["Valved", "exhaust"],
      ["Murdered", "out"],
    ],
  },
];

/** Auto-advancing showcase of signature builds; pauses on hover (#7). */
export function BuildsCarousel() {
  const [i, setI] = useState(0);
  const paused = useRef(false);
  const n = BUILDS.length;

  const go = (next: number) => setI(((next % n) + n) % n);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      if (!paused.current) setI((p) => (p + 1) % n);
    }, 5000);
    return () => clearInterval(id);
  }, [n]);

  return (
    <section id="builds" className="cc-section">
      <span className="cc-eyebrow cc-reveal">From the garage</span>
      <h2 className="cc-h2 cc-reveal">
        Signature <span className="cc-accent">builds.</span>
      </h2>
      <p className="cc-lead cc-reveal">
        A look at cars that rolled out of our bay. Yours could be next on this reel.
      </p>

      <div
        className="cc-builds cc-reveal"
        onMouseEnter={() => (paused.current = true)}
        onMouseLeave={() => (paused.current = false)}
      >
        <div className="cc-builds-track" style={{ transform: `translateX(-${i * 100}%)` }}>
          {BUILDS.map((b) => (
            <article key={b.title} className="cc-build">
              <div className="cc-build-art">
                <CarSvg className="cc-hero-car" color={b.color} finish={b.finish} />
              </div>
              <div className="cc-build-scrim" />
              <div className="cc-build-body">
                <span className="cc-build-badge">{b.badge}</span>
                <h3 className="cc-build-title">{b.title}</h3>
                <p className="cc-build-desc">{b.desc}</p>
                <div className="cc-build-specs">
                  {b.specs.map(([v, l]) => (
                    <div key={l} className="cc-build-spec">
                      <b>{v}</b>
                      <span>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        <button className="cc-builds-nav cc-prev" aria-label="Previous build" onClick={() => go(i - 1)}>
          <ChevronLeft size={22} />
        </button>
        <button className="cc-builds-nav cc-next" aria-label="Next build" onClick={() => go(i + 1)}>
          <ChevronRight size={22} />
        </button>

        <div className="cc-builds-dots">
          {BUILDS.map((b, idx) => (
            <button
              key={b.title}
              aria-label={`Go to ${b.title}`}
              className={`cc-dot-btn${idx === i ? " cc-active" : ""}`}
              onClick={() => go(idx)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
