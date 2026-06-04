import type { NextConfig } from "next";

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
      // Retired category slug → canonical (keeps old external links alive).
      {
        source: "/category/health-faucets",
        destination: "/category/health-faucet-sets",
        permanent: true,
      },
    ];
  },
  async headers() {
    // Permissive but meaningful: blocks clickjacking + MIME-sniffing, and a CSP
    // that still allows Next.js' inline runtime, Razorpay checkout, the UPI QR
    // (api.qrserver.com → https img), Supabase images, and the API. HSTS only in
    // production builds. Tighten the CSP (nonces, drop unsafe-*) later.
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com",
      "connect-src 'self' https: http://localhost:8787",
      "frame-src 'self' https://api.razorpay.com https://*.razorpay.com",
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
