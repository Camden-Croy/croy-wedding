import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { MotionConfig } from "framer-motion";
import "./globals.css";
import { GuestProvider } from "./guest-provider";
import { Nav } from "@/components/nav";
import { WEDDING } from "@/lib/content";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

// Absolute base URL for metadata (og:image etc). Link-preview crawlers
// (iMessage, Slack, Facebook) fetch these from their own servers, so the URL
// MUST be the public HTTPS domain — a localhost value means no preview image.
// On Vercel, VERCEL_PROJECT_PRODUCTION_URL is the stable production domain and
// requires no manual config; set NEXT_PUBLIC_SITE_URL to override (custom domain).
const withHttps = (host: string) => (host.startsWith("http") ? host : `https://${host}`);
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL && withHttps(process.env.VERCEL_PROJECT_PRODUCTION_URL)) ??
  process.env.BETTER_AUTH_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
  "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: `${WEDDING.coupleNames} · Wedding`,
  description: "We're getting married — join us to celebrate our wedding.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <GuestProvider>
          <MotionConfig reducedMotion="user">
            <Nav />
            {children}
          </MotionConfig>
        </GuestProvider>
      </body>
    </html>
  );
}
