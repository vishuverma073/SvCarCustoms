"use client";

import { useEffect, useState } from "react";
import { X, ShoppingBag } from "lucide-react";

type Sale = { name: string; city: string; product: string; ago: string };

const SALES: Sale[] = [
  { name: "Rohan", city: "Mumbai", product: "Cat-Back Sport Exhaust", ago: "2 minutes ago" },
  { name: "Aditya", city: "Delhi", product: "RGB Ambient Light Kit", ago: "5 minutes ago" },
  { name: "Sneha", city: "Bengaluru", product: "Carbon Mirror Caps", ago: "8 minutes ago" },
  { name: "Karan", city: "Pune", product: "Aluminium Paddle Shifters", ago: "11 minutes ago" },
  { name: "Vivek", city: "Hyderabad", product: "GT Wing Pro", ago: "14 minutes ago" },
  { name: "Ananya", city: "Chennai", product: "7D Custom Floor Mats", ago: "18 minutes ago" },
  { name: "Manish", city: "Jaipur", product: "Projector LED Headlights", ago: "23 minutes ago" },
];

const FIRST_DELAY_MS = 4000;
const VISIBLE_MS = 5500;
const GAP_MS = 9000;

export default function RecentPurchaseToast() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    let hideTimer: ReturnType<typeof setTimeout>;
    const showTimer = setTimeout(function cycle() {
      setVisible(true);
      hideTimer = setTimeout(() => {
        setVisible(false);
        setIndex((i) => (i + 1) % SALES.length);
      }, VISIBLE_MS);
    }, visible ? GAP_MS : FIRST_DELAY_MS);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
    // Re-arm each time visibility flips.
  }, [visible, dismissed]);

  if (dismissed) return null;

  const sale = SALES[index];

  return (
    <div
      aria-live="polite"
      className={`fixed bottom-5 left-5 z-40 max-w-[88vw] transition-all duration-500 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-brand-black/95 p-3 pr-9 shadow-xl backdrop-blur">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-orange/15 text-brand-orange">
          <ShoppingBag size={18} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-white">
            {sale.name} in {sale.city}
          </p>
          <p className="truncate text-[12px] text-white/60">
            Purchased {sale.product}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-white/35">{sale.ago}</p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss notification"
          className="absolute right-2 top-2 text-white/40 transition-colors hover:text-white/80"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
