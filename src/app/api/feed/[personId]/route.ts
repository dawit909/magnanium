import { NextRequest, NextResponse } from "next/server";
import { getPersonReleases } from "@/lib/tmdb";
import { generateRssFeed } from "@/lib/rss";
import { ReleaseTypeCategory } from "@/types/tmdb";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ personId: string }> }
) {
  try {
    const params = await props.params;
    const personId = parseInt(params.personId, 10);

    if (isNaN(personId)) {
      return new NextResponse("Invalid person ID", { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const rolesParam = searchParams.get("roles") || "director,actor";
    const typesParam = searchParams.get("types") || "theatrical,digital";
    const country = searchParams.get("country") || "US";
    const window = (searchParams.get("window") as "upcoming" | "all") || "all";

    const roles = rolesParam.split(",").map((r) => r.trim().toLowerCase());
    const types = typesParam
      .split(",")
      .map((t) => t.trim().toLowerCase()) as ReleaseTypeCategory[];

    const { personName, releases } = await getPersonReleases({
      personId,
      roles,
      types,
      country,
      window,
    });

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const siteUrl = `${protocol}://${host}`;
    const feedUrl = request.url;

    const rssXml = generateRssFeed({
      personName,
      releases,
      feedUrl,
      siteUrl,
    });

    return new NextResponse(rssXml, {
      status: 200,
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        // Cache in browser for 1 hour, Edge/CDN for 12 hours, allow serving stale for 24 hours
        "Cache-Control":
          "public, max-age=3600, s-maxage=43200, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("RSS feed generation error:", error);
    return new NextResponse("Failed to generate RSS feed", { status: 500 });
  }
}
