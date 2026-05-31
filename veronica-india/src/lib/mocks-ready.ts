import { USE_MOCKS } from "@/lib/api-config";

/**
 * Resolves once the MSW browser worker is started and ready to intercept.
 *
 * Client admin fetches fire on component mount (SWR), which can race the
 * service-worker startup on a hard page load/refresh — unintercepted requests
 * then escape to the real API origin and fail. The admin API client awaits this
 * before every request so a fetch is always held until interception is live.
 *
 * Resolved immediately when mocks are off (nothing to wait for) and on the
 * server (the node MSW server is started in instrumentation.ts, not here).
 */
let resolve!: () => void;
export const mocksReady = new Promise<void>((r) => {
  resolve = r;
});

if (!USE_MOCKS || typeof window === "undefined") resolve();

/** Called by MswProvider once `worker.start()` has resolved. */
export function signalMocksReady() {
  resolve();
}
