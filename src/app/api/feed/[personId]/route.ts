import { NextRequest, NextResponse } from "next/server";
import { getPersonReleases } from "@/lib/tmdb";
import { generateRssFeed } from "@/lib/rss";
import { ReleaseTypeCategory } from "@/types/tmdb";
import {
  guardRateLimit,
  validatePersonId,
  buildCachedResponse,
} from "@/lib/api-response";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ personId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");
    const isJson = format === "json" || Boolean(request.headers.get("accept")?.includes("application/json"));

    // 1. IP Rate Limiting (10 requests per minute)
    const rateGuard = guardRateLimit(request, "feed", 10, 60 * 1000, isJson);
    if (!rateGuard.allowed) {
      return rateGuard.response!;
    }

    // 2. Strict ID validation & negative cache check
    const params = await props.params;
    const validation = validatePersonId(params.personId);
    if (!validation.valid) {
      return validation.response!;
    }
    const personId = validation.personId!;

    const mediaParam = searchParams.get("media") || "movie,tv";
    const rolesParam = searchParams.get("roles") || "actor,director,writer,producer,crew";
    const typesParam = searchParams.get("types") || "cinema,home";
    const country = searchParams.get("country") || "US";
    const window = (searchParams.get("window") as "upcoming" | "all") || "all";
    const alert = (searchParams.get("alert") as "announced" | "month_before" | "week_before") || "announced";
    const excludeShorts = searchParams.get("exclude_shorts") === "true";
    const excludeReReleases = searchParams.get("exclude_rereleases") !== "false";
    const excludeUncredited =
      searchParams.get("exclude_uncredited") !== "false" &&
      searchParams.get("exclude_special") !== "false";
    const clientKey = request.headers.get("x-tmdb-key") || searchParams.get("api_key") || undefined;

    const media = mediaParam.split(",").map((m) => m.trim().toLowerCase()) as ("movie" | "tv")[];
    const roles = rolesParam.split(",").map((r) => r.trim().toLowerCase());
    const types = typesParam.split(",").map((t) => t.trim().toLowerCase()) as ReleaseTypeCategory[];

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
        excludeReReleases,
        excludeUncredited,
      },
      clientKey
    );

    if (notFound) {
      return new NextResponse("Person not found", { status: 404 });
    }

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const siteUrl = `${protocol}://${host}`;
    const feedUrl = request.url;
    const avatarUrl = profilePath
      ? `${siteUrl}/api/avatar/${personId}${clientKey ? `?api_key=${encodeURIComponent(clientKey)}` : ""}`
      : null;

    let payload: string;
    let contentType: string;

    if (isJson) {
      payload = JSON.stringify({ personName, releases, profilePath, avatarUrl });
      contentType = "application/json; charset=utf-8";
    } else {
      payload = generateRssFeed({
        personName,
        releases,
        feedUrl,
        siteUrl,
        profilePath,
        avatarUrl,
      });
      contentType = "application/rss+xml; charset=utf-8";
    }

    // 3. Cached response with ETag & 304 negotiation
    return buildCachedResponse({
      content: payload,
      contentType,
      maxAge: 3600,
      sMaxAge: 43200,
      staleWhileRevalidate: 86400,
      etagPayload: payload,
      ifNoneMatch: request.headers.get("if-none-match"),
      rateLimitHeaders: rateGuard.headers,
    });
  } catch (error) {
    console.error("RSS feed generation error:", error);
    return new NextResponse("Failed to generate RSS feed", { status: 500 });
  }
}
