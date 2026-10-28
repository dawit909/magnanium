import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CineFeed - Movie Release RSS",
  description: "Simple RSS feeds for movie releases by actor or director.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-neutral-950 text-neutral-200 antialiased font-sans">
        <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-12">{children}</main>
        <footer className="py-8 text-center text-xs text-neutral-600">
          <span>This product uses the TMDB API but is not endorsed or certified by TMDB.</span>
        </footer>
      </body>
    </html>
  );
}
