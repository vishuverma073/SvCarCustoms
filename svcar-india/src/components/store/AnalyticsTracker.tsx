"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Reads (or creates) a stable id in the given storage. */
function stableId(key: string, store: Storage): string {
  try {
    let v = store.getItem(key);
    if (!v) {
      v = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).replace(/-/g, "").slice(0, 32);
      store.setItem(key, v);
    }
    return v;
  } catch {
    return "anon";
  }
}

/**
 * Fires a fire-and-forget page-view beacon to /api/track on every route change.
 * Powers the admin Store Analytics dashboard. Failures are always swallowed —
 * analytics must never affect the storefront.
 */
export default function AnalyticsTracker() {
  const pathname = usePathname();
  useEffect(() => {
    try {
      const visitorId = stableId("svcar-vid", window.localStorage);
      const sessionId = stableId("svcar-sid", window.sessionStorage);
      const utmSource = new URLSearchParams(window.location.search).get("utm_source") || undefined;
      void fetch("/api/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          path: pathname || "/",
          referrer: document.referrer || undefined,
          utmSource,
          visitorId,
          sessionId,
        }),
      }).catch(() => {});
    } catch {
      /* ignore */
    }
  }, [pathname]);
  return null;
}
