import { NextRequest, NextResponse } from "next/server";
import { searchPerson } from "@/lib/tmdb";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // 1. IP Rate Limiting (10 requests per minute)
  const clientIp = getClientIp(request);
  const rateCheck = checkRateLimit(clientIp, 10, 60 * 1000);

  if (!rateCheck.success) {
    return NextResponse.json(
      { error: "Too many requests. Limit is 10 requests per minute.", results: [] },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateCheck.resetSeconds),
          "X-RateLimit-Limit": String(rateCheck.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(rateCheck.resetSeconds),
        },
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get("q") || "";
  const query = rawQuery.trim().slice(0, 80); // Cap query string to 80 chars
  const clientKey = request.headers.get("x-tmdb-key") || searchParams.get("api_key") || undefined;

  if (query.length < 2) {
    return NextResponse.json(
      { results: [] },
      {
        headers: {
          "X-RateLimit-Limit": String(rateCheck.limit),
          "X-RateLimit-Remaining": String(rateCheck.remaining),
        },
      }
    );
  }

  try {
    const { results, noApiKey } = await searchPerson(query, clientKey);
    return NextResponse.json(
      { results, noApiKey: !!noApiKey },
      {
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
          "X-RateLimit-Limit": String(rateCheck.limit),
          "X-RateLimit-Remaining": String(rateCheck.remaining),
        },
      }
    );
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Failed to search people", results: [] },
      {
        status: 500,
        headers: {
          "X-RateLimit-Limit": String(rateCheck.limit),
          "X-RateLimit-Remaining": String(rateCheck.remaining),
        },
      }
    );
  }
}
