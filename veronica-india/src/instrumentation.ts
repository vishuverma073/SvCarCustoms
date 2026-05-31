/**
 * Next.js instrumentation hook — runs once at server process startup.
 * Starts the MSW node interceptor so Server Component / SSR fetches to the
 * API are mocked in dev when NEXT_PUBLIC_USE_MOCKS=true.
 *
 * Guarded to the Node runtime: `register()` also fires in the edge runtime,
 * where `msw/node` cannot load.
 */
export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NEXT_PUBLIC_USE_MOCKS === "true"
  ) {
    const { server } = await import("./mocks/node");
    // `bypass` is mandatory: Next makes many internal fetches (.rsc, static,
    // fonts, telemetry) that we must let through untouched.
    server.listen({ onUnhandledRequest: "bypass" });
  }
}
