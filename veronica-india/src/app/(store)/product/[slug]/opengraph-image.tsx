import { ImageResponse } from "next/og";
import { backend } from "@/lib/backend";
import { getMinPrice } from "@/lib/sku-helpers";

// Run on Node so dev requests are intercepted by the MSW node server.
export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Veronica India product";

/** Social-share preview: product image + name + price on a branded card. */
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let name = "Veronica India";
  let priceLabel = "Premium Sanitaryware";
  let image: string | null = null;
  try {
    const product = await backend.getProductBySlug(slug);
    name = product.name;
    image = product.images[0] ?? null;
    const min = getMinPrice(product);
    if (min > 0) priceLabel = `From ₹${min.toLocaleString("en-IN")}`;
  } catch {
    // Fall back to the generic branded card.
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#FAFAF9",
          padding: "64px",
        }}
      >
        {/* Left: text */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#E8822A" }} />
              <span style={{ fontSize: 30, fontWeight: 800, color: "#0A0A0A", letterSpacing: "-0.02em" }}>
                VERONICA INDIA
              </span>
            </div>
            <div
              style={{
                marginTop: 48,
                fontSize: 60,
                fontWeight: 800,
                color: "#0A0A0A",
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                display: "flex",
                maxWidth: 560,
              }}
            >
              {name.length > 70 ? name.slice(0, 70) + "…" : name}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 38, fontWeight: 800, color: "#E8822A" }}>{priceLabel}</span>
            <span style={{ fontSize: 22, color: "#57534E", marginTop: 8 }}>
              Quality · Durability · Reliability since 2004
            </span>
          </div>
        </div>

        {/* Right: product image */}
        {image && (
          <div
            style={{
              display: "flex",
              width: 440,
              height: "100%",
              borderRadius: 28,
              background: "#fff",
              border: "1px solid #E7E5E4",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" width={400} height={400} style={{ objectFit: "contain" }} />
          </div>
        )}
      </div>
    ),
    { ...size },
  );
}
