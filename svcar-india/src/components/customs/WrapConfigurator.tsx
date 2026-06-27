"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { CarSvg } from "./CarSvg";

const COLORS = [
  { name: "Inferno Orange", hex: "#E8822A" },
  { name: "Stealth Black", hex: "#1b1b22" },
  { name: "Midnight Blue", hex: "#1E3A8A" },
  { name: "Racing Red", hex: "#d22f2f" },
  { name: "Sprint Green", hex: "#1f7a4d" },
  { name: "Chrome Silver", hex: "#c7ccd4" },
  { name: "Volt Lime", hex: "#aee02a" },
  { name: "Royal Purple", hex: "#6b2fb3" },
];

const FINISHES = [
  { id: "gloss", label: "Gloss", add: 0 },
  { id: "matte", label: "Matte", add: 12000 },
] as const;

const BASE = 78000;

/** Real-time paint/finish configurator that recolours the SVG car live (#4). */
export function WrapConfigurator() {
  const [color, setColor] = useState(COLORS[0]);
  const [finish, setFinish] = useState<(typeof FINISHES)[number]>(FINISHES[0]);

  const price = (BASE + finish.add).toLocaleString("en-IN");

  return (
    <section id="configurator" className="cc-section">
      <span className="cc-eyebrow cc-reveal">Design studio</span>
      <h2 className="cc-h2 cc-reveal">
        Configure your wrap <span className="cc-accent">in real time.</span>
      </h2>
      <p className="cc-lead cc-reveal">
        Pick a colour and finish and watch it land on the car instantly. Lock in a
        look, then book a slot to make it real.
      </p>

      <div className="cc-config cc-reveal">
        <div className="cc-config-stage">
          <CarSvg className="cc-hero-car" color={color.hex} finish={finish.id} />
          <div
            className="cc-hero-underglow"
            style={{
              background: `radial-gradient(50% 50% at 50% 50%, ${color.hex}b3, transparent 70%)`,
            }}
          />
        </div>

        <div className="cc-config-panel">
          <h3>Paint</h3>
          <div className="cc-swatches">
            {COLORS.map((c) => (
              <button
                key={c.name}
                type="button"
                aria-label={c.name}
                title={c.name}
                onClick={() => setColor(c)}
                className={`cc-swatch${color.name === c.name ? " cc-active" : ""}`}
                style={{ background: c.hex }}
              >
                {color.name === c.name ? (
                  <Check
                    size={18}
                    color={c.hex === "#c7ccd4" ? "#111" : "#fff"}
                    style={{ position: "absolute", inset: 0, margin: "auto" }}
                  />
                ) : null}
              </button>
            ))}
          </div>

          <h3>Finish</h3>
          <div className="cc-finish-row">
            {FINISHES.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFinish(f)}
                className={`cc-finish${finish.id === f.id ? " cc-active" : ""}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <p className="cc-config-name">
            {color.name} · {finish.label}
          </p>
          <p className="cc-config-meta">Full wrap · premium cast vinyl · 5-yr warranty</p>
          <p style={{ margin: "0 0 18px", fontSize: 14, color: "var(--cc-text-dim)" }}>
            Estimated from <b style={{ color: "#fff", fontSize: 22 }}>₹{price}</b>
          </p>
          <a href="#contact" className="cc-btn cc-btn-primary" style={{ width: "100%", justifyContent: "center" }}>
            Book this build
          </a>
        </div>
      </div>
    </section>
  );
}
