import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MswProvider } from "@/components/MswProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

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
  metadataBase: new URL("http://localhost:3000"), // TODO: Update to production URL
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
      <body className="min-h-screen bg-surface font-sans antialiased" suppressHydrationWarning>
        <MswProvider>{children}</MswProvider>
      </body>
    </html>
  );
}
