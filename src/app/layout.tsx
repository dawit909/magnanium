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
        <footer className="py-8 text-center text-[11px] text-neutral-400 dark:text-neutral-500 space-y-1.5">
          <p>
            If you have a feedback, send to{" "}
            <a
              href="mailto:apps.hydrant673@passinbox.com"
              className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 underline underline-offset-2 transition-colors font-medium"
            >
              apps.hydrant673@passinbox.com
            </a>
          </p>
          <p className="text-[10px] text-neutral-400/80 dark:text-neutral-600">
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
