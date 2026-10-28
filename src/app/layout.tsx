import type { Metadata } from "next";
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
      <body className="min-h-screen flex flex-col antialiased font-sans">
        <main className="flex-1 max-w-xl w-full mx-auto px-4 py-10">{children}</main>
        <footer className="py-6 text-center text-[11px] text-neutral-400 dark:text-neutral-600">
          <span>This product uses the TMDB API but is not endorsed or certified by TMDB.</span>
        </footer>
      </body>
    </html>
  );
}
