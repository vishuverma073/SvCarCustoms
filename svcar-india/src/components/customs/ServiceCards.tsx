"use client";

import type { MouseEvent } from "react";
import {
  SprayCan,
  Gauge,
  Disc3,
  Sparkles,
  Car,
  Armchair,
  ShieldCheck,
  Volume2,
  ArrowRight,
} from "lucide-react";

const SERVICES = [
  { icon: SprayCan, title: "Vinyl Wraps", desc: "Matte, satin, gloss & chrome-delete full wraps with precision-cut edges." },
  { icon: Gauge, title: "Performance Tuning", desc: "ECU remaps, exhausts and intakes for real, dyno-proven gains." },
  { icon: Disc3, title: "Alloy Wheels", desc: "Custom alloys, refurb & powder-coating in any finish you can dream up." },
  { icon: Sparkles, title: "Ceramic Detailing", desc: "Paint correction plus 9H ceramic coatings for a years-long shine." },
  { icon: Car, title: "Body Kits", desc: "Splitters, diffusers and widebody conversions, fitted flush." },
  { icon: Armchair, title: "Interior Customs", desc: "Bespoke upholstery, ambient lighting and trim retrims." },
  { icon: ShieldCheck, title: "PPF Protection", desc: "Self-healing paint protection film that keeps stone chips out." },
  { icon: Volume2, title: "Audio & Lighting", desc: "Sound systems, underglow and full LED conversions, road-legal." },
];

function Card({ s }: { s: (typeof SERVICES)[number] }) {
  const Icon = s.icon;
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <div className="cc-service cc-reveal" onMouseMove={onMove}>
      <div className="cc-service-icon">
        <Icon size={24} strokeWidth={2} />
      </div>
      <h3>{s.title}</h3>
      <p>{s.desc}</p>
      <span className="cc-service-link">
        Learn more <ArrowRight size={15} />
      </span>
    </div>
  );
}

/** Glassmorphism service grid with a spotlight glow that tracks the cursor (#10). */
export function ServiceCards() {
  return (
    <section id="services" className="cc-section">
      <span className="cc-eyebrow cc-reveal">What we do</span>
      <h2 className="cc-h2 cc-reveal">
        Everything your car needs, <span className="cc-accent">under one roof.</span>
      </h2>
      <p className="cc-lead cc-reveal">
        From a subtle refresh to a full transformation — our in-house specialists
        handle it end to end, no outsourcing.
      </p>

      <div className="cc-services-grid">
        {SERVICES.map((s) => (
          <Card key={s.title} s={s} />
        ))}
      </div>
    </section>
  );
}
