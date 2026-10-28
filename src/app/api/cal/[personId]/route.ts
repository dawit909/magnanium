import { NextRequest, NextResponse } from "next/server";
import { getPersonReleases } from "@/lib/tmdb";
import { generateIcalFeed } from "@/lib/ical";
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
    // 1. Rate limiting (20 requests per minute)
    const rateGuard = guardRateLimit(request, "cal", 20, 60 * 1000);
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

    const { searchParams } = new URL(request.url);
    const mediaParam = searchParams.get("media") || "movie,tv";
    const rolesParam = searchParams.get("roles") || "actor,crew";
    const typesParam = searchParams.get("types") || "cinema,home";
    const country = searchParams.get("country") || "US";
    const window = (searchParams.get("window") as "upcoming" | "all") || "all";
    const alert = (searchParams.get("alert") as "announced" | "release_day" | "week_before") || "announced";
    const excludeShorts = searchParams.get("exclude_shorts") === "true";
    const clientKey = request.headers.get("x-tmdb-key") || searchParams.get("api_key") || undefined;

    const media = mediaParam.split(",").map((m) => m.trim().toLowerCase()) as ("movie" | "tv")[];
    const roles = rolesParam.split(",").map((r) => r.trim().toLowerCase());
    const types = typesParam.split(",").map((t) => t.trim().toLowerCase()) as ReleaseTypeCategory[];

    const { personName, releases, notFound } = await getPersonReleases(
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

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const siteUrl = `${protocol}://${host}`;
    const feedUrl = request.url;

    const icsContent = generateIcalFeed({
      personName,
      releases,
      feedUrl,
      siteUrl,
    });

    const fileSlug = personName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const response = buildCachedResponse({
      content: icsContent,
      contentType: "text/calendar; charset=utf-8",
      maxAge: 3600,
      sMaxAge: 43200,
      staleWhileRevalidate: 86400,
      etagPayload: icsContent,
      ifNoneMatch: request.headers.get("if-none-match"),
      rateLimitHeaders: rateGuard.headers,
    });

    // Add Content-Disposition header for calendar download/subscription
    response.headers.set(
      "Content-Disposition",
      `inline; filename="${fileSlug}-releases.ics"`
    );

    return response;
  } catch (error) {
    console.error("iCal feed generation error:", error);
    return new NextResponse("Failed to generate calendar feed", { status: 500 });
  }
}
