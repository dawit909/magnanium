import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if request is a direct browser navigation (user typing in address bar, clicking link, etc.)
  const secFetchDest = request.headers.get("sec-fetch-dest");
  const secFetchMode = request.headers.get("sec-fetch-mode");
  const acceptHeader = request.headers.get("accept") || "";

  const isDirectBrowserVisit =
    secFetchDest === "document" ||
    secFetchMode === "navigate" ||
    (acceptHeader.includes("text/html") && !acceptHeader.includes("application/json"));

  if (isDirectBrowserVisit) {
    // Prevent all users from directly visiting API URLs in their browser
    return NextResponse.redirect(new URL("/", request.url), 307);
  }

  // Cross-origin protection for internal API endpoints
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (pathname.startsWith("/api/search") && secFetchSite === "cross-site") {
    return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
