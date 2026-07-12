import { NextRequest } from "next/server";

/**
 * Server-side relay for the WhatsApp-intent beacon. Enriches the click with the
 * Vercel edge geo headers (city / country) then forwards to the backend. Always
 * returns 204 — never blocks the client's jump to wa.me.
 */
export async function POST(req: NextRequest) {
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  try {
    const body = await req.json();
    const h = req.headers;
    const rawCity = h.get("x-vercel-ip-city");
    const city = rawCity ? decodeURIComponent(rawCity) : null;
    const country = h.get("x-vercel-ip-country");
    if (apiBase) {
      await fetch(`${apiBase}/leads/whatsapp`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...body, city, country }),
      }).catch(() => {});
    }
  } catch {
    /* ignore malformed beacons */
  }
  return new Response(null, { status: 204 });
}
