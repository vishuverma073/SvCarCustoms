/**
 * Single source of truth for the API origin + mock switch.
 * Both the `backend` client and the MSW mocks read from here so the
 * handlers and the fetcher can never drift on the base URL.
 */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

/** When true, MSW intercepts requests to API_BASE with mocked responses. */
export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
