"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { backend } from "@/lib/backend";

const SESSION_FLAG = "veronica-visit-counted";

/**
 * Lifetime site-visit counter shown in the footer. Counts once per browser
 * session (a sessionStorage flag) so it tracks visits rather than every page
 * view, then just reads the total on later loads in the same session. Failures
 * are silent — the counter is non-critical chrome.
 */
export default function VisitorCount() {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let counted = false;
        try {
          counted = sessionStorage.getItem(SESSION_FLAG) === "1";
        } catch {
          /* storage disabled */
        }
        const res = counted ? await backend.getVisits() : await backend.recordVisit();
        if (!counted) {
          try {
            sessionStorage.setItem(SESSION_FLAG, "1");
          } catch {
            /* storage disabled */
          }
        }
        if (active) setTotal(res.total);
      } catch {
        /* best-effort; render nothing on failure */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (total === null) return null;

  return (
    <p className="text-[11px] text-white/30 flex items-center gap-1.5">
      <Users size={12} />
      {total.toLocaleString("en-IN")} visitors
    </p>
  );
}
