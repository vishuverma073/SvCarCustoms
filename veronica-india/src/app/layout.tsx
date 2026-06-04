import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SITE_URL } from "@/lib/site";
import "./globals.css";
import { MswProvider } from "@/components/MswProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Explicit mobile viewport: fit the device width and allow pinch-zoom (never
// disable user scaling — that's an accessibility failure).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Veronica India — Premium Sinks, Faucets & Bath Solutions",
  description:
    "Shop premium kitchen sinks, health faucets, bathroom accessories and plumbing solutions. Quality, Durability, Reliability since 2004.",
  keywords: [
    "kitchen sinks",
    "quartz sinks",
    "health faucets",
    "bathroom accessories",
    "plumbing fittings",
    "Veronica India",
  ],
  openGraph: {
    title: "Veronica India — Premium Sinks, Faucets & Bath Solutions",
    description:
      "Shop premium kitchen sinks, health faucets, bathroom accessories and plumbing solutions.",
    type: "website",
    images: ["/veronica-og.jpg"],
  },
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Apply the saved (or system) theme before paint so there's no flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('veronica-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-surface font-sans antialiased" suppressHydrationWarning>
        <MswProvider>{children}</MswProvider>
        {/* No-ops off Vercel; report page views + Core Web Vitals once deployed. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
