import { NextRequest } from "next/server";

/**
 * Server-side relay for the storefront analytics beacon. Enriches the page-view
 * with the request User-Agent and Vercel edge geo headers (city / country),
 * then forwards it to the backend. Always returns 204 — never blocks the client.
 */
export async function POST(req: NextRequest) {
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  try {
    const body = await req.json();
    const h = req.headers;
    const rawCity = h.get("x-vercel-ip-city");
    const city = rawCity ? decodeURIComponent(rawCity) : null;
    const country = h.get("x-vercel-ip-country");
    const userAgent = h.get("user-agent");
    if (apiBase) {
      await fetch(`${apiBase}/analytics/track`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...body, userAgent, city, country }),
      }).catch(() => {});
    }
  } catch {
    /* ignore malformed beacons */
  }
  return new Response(null, { status: 204 });
}
