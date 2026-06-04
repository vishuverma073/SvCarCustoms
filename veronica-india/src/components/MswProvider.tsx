"use client";

import { useEffect } from "react";
import { USE_MOCKS } from "@/lib/api-config";
import { signalMocksReady } from "@/lib/mocks-ready";

/**
 * Starts the MSW browser worker on mount when mocking is enabled, then signals
 * readiness via {@link signalMocksReady}.
 *
 * Children are NOT gated on readiness (no SSR flash); instead the admin API
 * client awaits `mocksReady` before each fetch, so on-mount client fetches are
 * held until the worker is actually intercepting rather than escaping to the
 * real API origin during the service-worker startup window.
 */
export function MswProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!USE_MOCKS) return;
    let cancelled = false;
    (async () => {
      try {
        const { worker } = await import("@/mocks/browser");
        if (cancelled) return;
        await worker.start({ onUnhandledRequest: "bypass" });
      } catch (err) {
        // If the worker fails to load/start, don't leave every fetch hanging on
        // `mocksReady` forever — release the gate so requests proceed (and fail
        // loudly) instead of the whole app stalling on a silent deadlock.
        console.error("[MSW] worker failed to start; releasing mocksReady", err);
      } finally {
        if (!cancelled) signalMocksReady();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <>{children}</>;
}
