import type { NextConfig } from "next";

const apiProxyTarget = process.env.API_PROXY_TARGET ?? "http://127.0.0.1:8787";

function apiConnectSrc(): string {
  if (process.env.NEXT_PUBLIC_USE_API_PROXY === "true") {
    return "'self'";
  }
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";
  try {
    return `'self' ${new URL(raw).origin}`;
  } catch {
    return "'self' http://localhost:8787";
  }
}

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90],
    remotePatterns: [
      // Supabase Storage (admin image uploads, once wired)
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Placeholder host used by MSW mock image URLs (serves real PNGs)
      { protocol: "https", hostname: "placehold.co", pathname: "/**" },
    ],
  },
  async redirects() {
    return [
      // Singular/synonym category slugs → canonical (keeps shared links alive).
      { source: "/category/body-kit", destination: "/category/body-kits", permanent: true },
      { source: "/category/spoiler", destination: "/category/spoilers", permanent: true },
      { source: "/category/exhaust", destination: "/category/exhausts", permanent: true },
      { source: "/category/exhausts-tips", destination: "/category/exhausts", permanent: true },
      { source: "/category/ambient-light", destination: "/category/ambient-lights", permanent: true },
    ];
  },
  /** Proxy API through Next on the same origin — best for phone/LAN testing (no CORS). */
  async rewrites() {
    const useProxy = process.env.NEXT_PUBLIC_USE_API_PROXY === "true";
    if (!useProxy) return [];
    const target = process.env.API_PROXY_TARGET ?? "http://127.0.0.1:8787";
    return [
      {
        source: "/svcar-api/:path*",
        destination: `${target}/:path*`,
      },
    ];
  },
  async headers() {
    // Permissive but meaningful: blocks clickjacking + MIME-sniffing, and a CSP
    // that still allows Next.js' inline runtime, PayU hosted checkout, Supabase
    // images, and the API. HSTS only in production builds. Tighten the CSP
    // (nonces, drop unsafe-*) later.
    // [Razorpay disabled — PayU-only project] Razorpay's checkout/frame hosts
    // were removed from script-src/frame-src since the modal is no longer loaded.
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "connect-src 'self' https: ws: wss: " + apiConnectSrc(),
      "frame-src 'self' https://www.google.com https://maps.google.com",
      // PayU hosted checkout is a full-page form POST to its payment host.
      "form-action 'self' https://secure.payu.in https://test.payu.in https://*.payu.in",
    ].join("; ");

    const headers = [
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
      { key: "Content-Security-Policy", value: csp },
    ];
    if (process.env.NODE_ENV === "production") {
      headers.push({ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" });
    }
    return [{ source: "/:path*", headers }];
  },
};

export default nextConfig;
