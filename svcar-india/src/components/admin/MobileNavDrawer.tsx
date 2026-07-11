"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminNav, isNavActive } from "./nav-items";

/**
 * Mobile admin nav (hidden ≥ lg). A hamburger in the top bar opens a slide-out
 * drawer with the FULL nav list — the same items as the desktop sidebar — so
 * every admin section is reachable on a phone (the bottom bar only holds a few).
 */
export default function MobileNavDrawer() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden p-2 -ml-2 text-text-secondary hover:text-text-primary"
        aria-label="Open admin menu"
        aria-expanded={open}
      >
        <Menu size={22} />
      </button>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <nav className="absolute inset-y-0 left-0 flex w-64 max-w-[82%] flex-col overflow-y-auto bg-brand-black text-white shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
              <span className="text-sm font-extrabold tracking-tight">
                SV<span className="text-brand-orange">CAR</span>CUSTOMS
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="p-1 text-white/60 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 space-y-1 p-3">
              {adminNav.map((item) => {
                const Icon = item.icon;
                const active = isNavActive(item.href, pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                      active ? "bg-brand-orange text-white" : "text-white/70 hover:bg-white/10",
                    )}
                  >
                    <Icon size={18} strokeWidth={active ? 2.4 : 2} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
