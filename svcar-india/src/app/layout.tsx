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
  title: "SV Car Customs — Body Kits, Spoilers & Car Accessories",
  description:
    "Best car accessories delivered to your doorstep. Shop body kits, spoilers, ambient lights, diffusers, exhausts and more — with pan-India delivery.",
  keywords: [
    "car body kits",
    "car spoilers",
    "ambient lights",
    "car diffusers",
    "exhaust tips",
    "car accessories India",
    "SV Car Customs",
  ],
  openGraph: {
    title: "SV Car Customs — Body Kits, Spoilers & Car Accessories",
    description:
      "Best car accessories delivered to your doorstep. Body kits, spoilers, ambient lights, exhausts and more.",
    type: "website",
    images: ["/svcar-og.jpg"],
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
            __html: `(function(){try{var t=localStorage.getItem('svcar-theme');var d=t?t==='dark':true;if(d)document.documentElement.classList.add('dark');}catch(e){document.documentElement.classList.add('dark');}})();`,
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
