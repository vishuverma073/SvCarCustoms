"use client";

import { useEffect, useState } from "react";

/**
 * Brief full-screen "Welcome back, <name>" shown once right after an admin signs
 * in, then fades away (~1s + a 0.5s fade). The login page stashes the name in
 * sessionStorage; we read it once and clear it, so it never reappears on plain
 * navigation or refresh — only on a fresh login.
 */
const FLAG = "veronica-admin-welcome";

export default function WelcomeSplash() {
  const [name, setName] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem(FLAG);
    if (!stored) return;
    sessionStorage.removeItem(FLAG);
    setName(stored);
    const hold = setTimeout(() => setLeaving(true), 1100); // visible ~1.1s
    const done = setTimeout(() => setName(null), 1700); // unmount after the fade
    return () => {
      clearTimeout(hold);
      clearTimeout(done);
    };
  }, []);

  if (!name) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-surface-dim pointer-events-none transition-opacity duration-500 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden
    >
      <div className="text-center px-6 animate-slide-up">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-orange mb-3">
          Welcome back
        </p>
        <h1 className="text-3xl md:text-5xl font-extrabold text-text-primary tracking-tight">{name}</h1>
      </div>
    </div>
  );
}
