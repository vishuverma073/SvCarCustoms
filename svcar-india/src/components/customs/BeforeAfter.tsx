"use client";

import { useRef, useState, type PointerEvent, type CSSProperties } from "react";
import { MoveHorizontal } from "lucide-react";
import { CarSvg } from "./CarSvg";

/**
 * Drag-to-reveal before/after wrap comparison (#2). The same car renders in
 * both panes (dull stock vs. vivid wrap) and a clip-path driven by `--split`
 * wipes between them. Pointer-capture makes the drag feel native.
 */
export function BeforeAfter() {
  const ref = useRef<HTMLDivElement>(null);
  const [split, setSplit] = useState(50);
  const dragging = useRef(false);

  const move = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pct = ((clientX - r.left) / r.width) * 100;
    setSplit(Math.max(2, Math.min(98, pct)));
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    move(e.clientX);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) move(e.clientX);
  };
  const onUp = () => {
    dragging.current = false;
  };

  return (
    <section id="wraps" className="cc-section">
      <span className="cc-eyebrow cc-reveal">See the difference</span>
      <h2 className="cc-h2 cc-reveal">
        Drag to reveal <span className="cc-accent">the transformation.</span>
      </h2>
      <p className="cc-lead cc-reveal">
        Same car, two worlds. Slide across a real before/after to see what a full
        custom wrap and detail actually delivers.
      </p>

      <div
        className="cc-ba cc-reveal"
        ref={ref}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={{ "--split": `${split}%` } as CSSProperties}
        role="slider"
        aria-label="Before and after comparison"
        aria-valuenow={Math.round(split)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setSplit((s) => Math.max(2, s - 4));
          if (e.key === "ArrowRight") setSplit((s) => Math.min(98, s + 4));
        }}
      >
        {/* AFTER (right side) */}
        <div className="cc-ba-pane cc-ba-after cc-ba-bg-after">
          <CarSvg className="cc-ba-stage" color="#E8822A" finish="gloss" />
        </div>
        {/* BEFORE (left side) */}
        <div className="cc-ba-pane cc-ba-before cc-ba-bg-before">
          <CarSvg className="cc-ba-stage cc-ba-car-before" color="#6b6b73" finish="matte" />
        </div>

        <span className="cc-ba-label cc-l">Before</span>
        <span className="cc-ba-label cc-r">After</span>

        <div className="cc-ba-handle">
          <span className="cc-ba-knob">
            <MoveHorizontal size={22} />
          </span>
        </div>
      </div>
    </section>
  );
}
