import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CineFeed - Movie Release RSS Feeds for Directors & Actors",
  description:
    "Generate custom RSS feeds for upcoming movie theatrical releases, digital/streaming debuts, and physical releases for any director or actor.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-amber-500 selection:text-black">
        {/* Navigation / Header */}
        <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-md shadow-amber-500/20 text-slate-950 font-black text-xl">
                🎬
              </span>
              <div>
                <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  CineFeed
                  <span className="text-xs uppercase font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    RSS
                  </span>
                </span>
                <p className="text-xs text-slate-400">Movie release alerts for artists</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs text-slate-400">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/50">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Public RSS Feeds
              </span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">{children}</main>

        {/* Footer with TMDB Attribution (Required by TMDB API Terms) */}
        <footer className="border-t border-slate-800/80 bg-slate-950/80 py-8 text-xs text-slate-400">
          <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* TMDB Official Logo SVG */}
              <svg
                className="h-4 w-auto text-[#01b4e4]"
                viewBox="0 0 185 16"
                fill="currentColor"
                aria-label="TMDB Logo"
              >
                <path d="M12.9 5.8H8.5V1.2C8.5.5 8 0 7.3 0H6.2c-.7 0-1.2.5-1.2 1.2v4.6H.6C.3 5.8 0 6.1 0 6.4v1.2c0 .4.3.6.6.6H5v6.6c0 .7.5 1.2 1.2 1.2h1.1c.7 0 1.2-.5 1.2-1.2V8.2h4.4c.4 0 .6-.3.6-.6V6.4c0-.3-.2-.6-.6-.6zM32.8 5.8h-1.9c-.5 0-.9.2-1.2.6-.7-1-1.9-1.6-3.2-1.6-2.6 0-4.6 2.1-4.6 5.6 0 3.5 2 5.6 4.6 5.6 1.3 0 2.5-.6 3.2-1.6.3.4.7.6 1.2.6h1.9c.4 0 .6-.3.6-.6V6.4c0-.3-.3-.6-.6-.6zm-6.2 7.8c-1.4 0-2.3-1.1-2.3-3.4 0-2.2.9-3.4 2.3-3.4s2.3 1.2 2.3 3.4c0 2.3-.9 3.4-2.3 3.4zM53.4 5.8h-1.8c-.4 0-.8.3-.9.7l-3.3 5.7-3.3-5.7c-.1-.4-.5-.7-.9-.7h-1.8c-.5 0-.8.5-.5.9l4.5 7.6c.3.5.8.8 1.4.8h1.2c.6 0 1.1-.3 1.4-.8l4.5-7.6c.3-.4 0-.9-.4-.9zM74.1 5.8h-4.3c-.4 0-.8.2-1 .5l-3.8 4.7V1.2c0-.7-.5-1.2-1.2-1.2h-1.1c-.7 0-1.2.5-1.2 1.2v13.6c0 .7.5 1.2 1.2 1.2h1.1c.7 0 1.2-.5 1.2-1.2V9.6l1.7-2.1 3.5 7.8c.2.4.6.7 1.1.7h1.9c.5 0 .8-.5.6-.9l-3.2-7.1 4.1-5c.3-.4 0-.9-.5-.9z" />
              </svg>
              <span>
                This product uses the TMDB API but is not endorsed or certified by TMDB.
              </span>
            </div>

            <div className="flex items-center gap-4 text-slate-500">
              <span>Non-commercial open web tool</span>
              <span>•</span>
              <span>Compatible with Feedly, NetNewsWire, and all RSS readers</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
