import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Magnanium",
  description: "Movie release RSS feeds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to TMDB image CDN to eliminate DNS lookup & TLS handshake latency */}
        <link rel="preconnect" href="https://image.tmdb.org" crossOrigin="" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />
      </head>
      <body className="min-h-screen flex flex-col antialiased font-sans">
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 pb-12">{children}</main>
        <footer className="py-6 text-center text-[11px] text-neutral-400 dark:text-neutral-600">
          <span>This product uses the TMDB API but is not endorsed or certified by TMDB.</span>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
