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
};

export default nextConfig;
