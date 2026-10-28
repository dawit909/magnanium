import { NextRequest, NextResponse } from "next/server";
import { getPersonReleases } from "@/lib/tmdb";
import { generateRssFeed } from "@/lib/rss";
import { ReleaseTypeCategory } from "@/types/tmdb";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { isValidPersonId, isPersonMarkedNotFound } from "@/lib/negative-cache";
import { generateEtag, isEtagMatch } from "@/lib/etag";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ personId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");
    const acceptsJson = request.headers.get("accept")?.includes("application/json");
    const isJson = format === "json" || acceptsJson;

    // 1. IP Rate Limiting (10 requests per minute)
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(clientIp, 10, 60 * 1000);

    if (!rateCheck.success) {
      return new NextResponse(
        isJson
          ? JSON.stringify({ error: "Too many requests. Limit is 10 requests per minute." })
          : "Too Many Requests. Rate limit of 10 requests per minute exceeded.",
        {
          status: 429,
          headers: {
            "Content-Type": isJson ? "application/json; charset=utf-8" : "text/plain; charset=utf-8",
            "Retry-After": String(rateCheck.resetSeconds),
            "X-RateLimit-Limit": String(rateCheck.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateCheck.resetSeconds),
          },
        }
      );
    }

    // 2. Strict Parameter Validation
    const params = await props.params;
    const personId = parseInt(params.personId, 10);

    if (isNaN(personId) || !isValidPersonId(personId)) {
      return new NextResponse("Invalid person ID", { status: 400 });
    }

    // 3. Fast Negative Cache (404s)
    if (isPersonMarkedNotFound(personId)) {
      return new NextResponse("Person not found", { status: 404 });
    }

    const mediaParam = searchParams.get("media") || "movie,tv";
    const rolesParam = searchParams.get("roles") || "actor,crew";
    const typesParam = searchParams.get("types") || "cinema,home";
    const country = searchParams.get("country") || "US";
    const window = (searchParams.get("window") as "upcoming" | "all") || "all";
    const alert = (searchParams.get("alert") as "announced" | "release_day" | "week_before") || "announced";
    const excludeShorts = searchParams.get("exclude_shorts") === "true";
    const clientKey = request.headers.get("x-tmdb-key") || searchParams.get("api_key") || undefined;

    const media = mediaParam
      .split(",")
      .map((m) => m.trim().toLowerCase()) as ("movie" | "tv")[];
    const roles = rolesParam.split(",").map((r) => r.trim().toLowerCase());
    const types = typesParam
      .split(",")
      .map((t) => t.trim().toLowerCase()) as ReleaseTypeCategory[];

    const { personName, releases, profilePath, notFound } = await getPersonReleases(
      {
        personId,
        media,
        roles,
        types,
        country,
        window,
        alert,
        excludeShorts,
      },
      clientKey
    );

    if (notFound) {
      return new NextResponse("Person not found", { status: 404 });
    }

    // 4. Edge & CDN Caching Headers
    const cacheHeader = "public, max-age=3600, s-maxage=43200, stale-while-revalidate=86400";
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const siteUrl = `${protocol}://${host}`;
    const feedUrl = request.url;

    let payload: string;
    let contentType: string;

    if (isJson) {
      payload = JSON.stringify({ personName, releases, profilePath });
      contentType = "application/json; charset=utf-8";
    } else {
      payload = generateRssFeed({
        personName,
        releases,
        feedUrl,
        siteUrl,
        profilePath,
      });
      contentType = "application/rss+xml; charset=utf-8";
    }

    // 5. ETag / 304 Not Modified Support
    const etag = generateEtag(payload);
    const ifNoneMatch = request.headers.get("if-none-match");

    const commonHeaders = {
      "Cache-Control": cacheHeader,
      Vary: "Accept, Accept-Encoding",
      ETag: etag,
      "X-RateLimit-Limit": String(rateCheck.limit),
      "X-RateLimit-Remaining": String(rateCheck.remaining),
    };

    if (isEtagMatch(ifNoneMatch, etag)) {
      return new NextResponse(null, {
        status: 304,
        headers: commonHeaders,
      });
    }

    return new NextResponse(payload, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        ...commonHeaders,
      },
    });
  } catch (error) {
    console.error("RSS feed generation error:", error);
    return new NextResponse("Failed to generate RSS feed", { status: 500 });
  }
}
