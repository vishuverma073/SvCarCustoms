/**
 * Razorpay Standard Checkout types + script loader.
 *
 * In mock mode the payment UI is simulated by {@link MockRazorpayModal} (no real
 * SDK, no account needed). In real mode we load checkout.razorpay.com and call
 * `new window.Razorpay(options).open()`. Both paths drive the SAME options shape
 * and the SAME `handler` / `modal.ondismiss` callbacks, so flipping
 * NEXT_PUBLIC_USE_MOCKS off swaps the implementation with no UI rewrite.
 */

/** The success payload Razorpay passes to `handler`. */
export interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number; // in paise
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  image?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void; close: () => void };
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

/** Load the real Razorpay script once (real mode only). Resolves false on failure. */
export function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}
