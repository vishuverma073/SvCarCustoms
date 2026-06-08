"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

/**
 * Light/dark toggle. The actual theme is a `dark` class on <html> (applied before
 * paint by the inline script in layout.tsx, so there's no flash). This just flips
 * that class and persists the choice. Dark styling is driven by CSS-variable
 * overrides under `.dark` in globals.css.
 */
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  // Sync the icon with whatever the pre-paint script already applied.
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("veronica-theme", next ? "dark" : "light");
    } catch {
      /* private mode / storage disabled — fall back to in-memory only */
    }
    setDark(next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="p-2.5 rounded-xl text-text-secondary hover:text-brand-black hover:bg-surface-dim transition-all duration-200"
    >
      {dark ? <Sun size={20} strokeWidth={2} /> : <Moon size={20} strokeWidth={2} />}
    </button>
  );
}
