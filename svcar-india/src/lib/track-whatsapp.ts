/**
 * Fire-and-forget WhatsApp-intent beacon. Called when a shopper clicks any
 * "Chat on WhatsApp" CTA — records the click (page + product context) so the
 * admin Leads → WhatsApp tab can show intent. Never blocks navigation to
 * wa.me, and always swallows errors.
 */
export type WhatsappSource = "floating" | "product" | "cart" | "contact" | "other";

export function trackWhatsapp(
  source: WhatsappSource,
  ctx?: { productId?: number; productName?: string },
): void {
  if (typeof window === "undefined") return;
  try {
    let visitorId: string | undefined;
    try {
      visitorId = window.localStorage.getItem("svcar-vid") || undefined;
    } catch {
      /* storage blocked */
    }
    void fetch("/api/wa-lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        source,
        path: window.location.pathname,
        productId: ctx?.productId,
        productName: ctx?.productName,
        visitorId,
      }),
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}
