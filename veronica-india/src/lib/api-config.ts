/**
 * Single source of truth for the API origin + mock switch.
 * Both the `backend` client and the MSW mocks read from here so the
 * handlers and the fetcher can never drift on the base URL.
 */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

/** When true, MSW intercepts requests to API_BASE with mocked responses. */
export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

/**
 * Simulate Razorpay payments with the in-app mock modal instead of loading the
 * real checkout.razorpay.com SDK. True whenever API mocks are on, OR explicitly
 * via NEXT_PUBLIC_MOCK_PAYMENTS=true — so the checkout flow is fully testable
 * against the dummy backend (which has no real Razorpay keys). With a real
 * backend + real keys, leave both flags off to use the real SDK.
 */
export const MOCK_PAYMENTS =
  USE_MOCKS || process.env.NEXT_PUBLIC_MOCK_PAYMENTS === "true";
