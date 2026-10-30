import { NextRequest, NextResponse } from "next/server";
import { searchPerson } from "@/lib/tmdb";
import { guardRateLimit } from "@/lib/api-response";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // 1. IP Rate Limiting (30 requests per minute)
  const rateGuard = guardRateLimit(request, "search", 30, 60 * 1000, true);
  if (!rateGuard.allowed) {
    return rateGuard.response!;
  }

  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get("q") || "";
  const query = rawQuery.trim().slice(0, 80);
  const clientKey = request.headers.get("x-tmdb-key") || searchParams.get("api_key") || undefined;

  if (query.length < 2) {
    return NextResponse.json({ results: [] }, { headers: rateGuard.headers });
  }

  try {
    const { results, noApiKey, error } = await searchPerson(query, clientKey);
    if (error) {
      return NextResponse.json(
        { error, results: [] },
        { status: 502, headers: rateGuard.headers }
      );
    }
    return NextResponse.json(
      { results, noApiKey: Boolean(noApiKey) },
      {
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
          "CDN-Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
          ...rateGuard.headers,
        },
      }
    );
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Failed to search people", results: [] },
      {
        status: 500,
        headers: rateGuard.headers,
      }
    );
  }
}
