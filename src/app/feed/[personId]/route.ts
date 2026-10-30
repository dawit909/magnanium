import { NextRequest, NextResponse } from "next/server";
import { getPersonReleases } from "@/lib/tmdb";
import { generateRssFeed } from "@/lib/rss";
import { ReleaseTypeCategory, FeedFilterOptions, AlertTimingWindow } from "@/types/tmdb";
import { DEFAULT_FEED_OPTIONS } from "@/lib/feed-options";
import {
  guardRateLimit,
  validatePersonId,
  buildCachedResponse,
} from "@/lib/api-response";
import { kv } from "@/lib/kv";
import { isEtagMatch, generateEtag } from "@/lib/etag";

export const runtime = "nodejs";

function getFeedEtagKey(
  personId: number,
  isJson: boolean,
  isRaw: boolean,
  country: string,
  roles: string[],
  types: string[],
  window: string,
  alert: string,
  excludeShorts: boolean,
  excludeReReleases: boolean,
  excludeUncredited: boolean,
  clientKey?: string
): string {
  const normRoles = [...roles].sort().join(",");
  const normTypes = [...types].sort().join(",");
  const countryUpper = country.toUpperCase();
  const filterPart = isRaw
    ? "raw"
    : `${normRoles}_${normTypes}_${window}_${alert}_${excludeShorts}_${excludeReReleases}_${excludeUncredited}`;
  return `feed_etag:${personId}:${countryUpper}:${isJson ? "json" : "rss"}:${filterPart}${clientKey ? `:${clientKey}` : ""}`;
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ personId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");
    const isJson = format === "json" || Boolean(request.headers.get("accept")?.includes("application/json"));

    // 1. IP Rate Limiting:
    // - Interactive JSON preview in UI: 120 req/min with dedicated prefix so rapid filtering never starves.
    // - External XML/RSS feed polling: 30 req/min for feed reader background refresh.
    const rateLimit = isJson ? 120 : 30;
    const ratePrefix = isJson ? "feed-preview" : "feed-rss";
    const rateGuard = guardRateLimit(request, ratePrefix, rateLimit, 60 * 1000, isJson);
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

    const isRaw = searchParams.get("raw") === "true";
    const refresh = searchParams.get("refresh") === "true";
    const rolesParam = searchParams.get("roles") || DEFAULT_FEED_OPTIONS.roles.join(",");
    const typesParam = searchParams.get("types") || DEFAULT_FEED_OPTIONS.types.join(",");
    const country = searchParams.get("country") || DEFAULT_FEED_OPTIONS.country;
    const window = (searchParams.get("window") as "upcoming" | "all") || "all";
    const alert = (searchParams.get("alert") as AlertTimingWindow) || DEFAULT_FEED_OPTIONS.alert;
    const excludeShorts = searchParams.get("exclude_shorts") === "true";
    const excludeReReleases = searchParams.get("exclude_rereleases") !== "false";
    const excludeUncredited = searchParams.get("exclude_uncredited") !== "false";
    const clientKey = request.headers.get("x-tmdb-key") || searchParams.get("api_key") || undefined;

    const roles = searchParams.has("roles")
      ? (rolesParam ? rolesParam.split(",").map((r) => r.trim().toLowerCase()).filter(Boolean) : [])
      : DEFAULT_FEED_OPTIONS.roles;
    const types = searchParams.has("types")
      ? (typesParam ? (typesParam.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean) as ReleaseTypeCategory[]) : [])
      : (DEFAULT_FEED_OPTIONS.types as ReleaseTypeCategory[]);

    // 3. Early-Exit ETag Check: If client sends If-None-Match matching cached ETag, return 304 immediately!
    const ifNoneMatch = request.headers.get("if-none-match");
    const etagKey = getFeedEtagKey(
      personId,
      isJson,
      isRaw,
      country,
      roles,
      types,
      window,
      alert,
      excludeShorts,
      excludeReReleases,
      excludeUncredited,
      clientKey
    );

    if (ifNoneMatch && !refresh) {
      const cachedEtag = await kv.get<string>(etagKey);
      if (cachedEtag && isEtagMatch(ifNoneMatch, cachedEtag)) {
        const maxAge = isJson ? 300 : 3600;
        const sMaxAge = isJson ? 3600 : 43200;
        const staleWhileRevalidate = 86400;

        return new NextResponse(null, {
          status: 304,
          headers: {
            "Cache-Control": `public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
            "CDN-Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
            ETag: cachedEtag,
            Vary: "Accept, Accept-Encoding",
            ...rateGuard.headers,
          },
        });
      }
    }

    const filterOptions: FeedFilterOptions = isRaw
      ? {
          personId,
          roles: DEFAULT_FEED_OPTIONS.roles,
          types: DEFAULT_FEED_OPTIONS.types as ReleaseTypeCategory[],
          country,
          window: "all",
          alert: "announced",
          excludeShorts: false,
          excludeReReleases: false,
          excludeUncredited: false,
          bypassCache: refresh,
        }
      : {
          personId,
          roles,
          types,
          country,
          window,
          alert,
          excludeShorts,
          excludeReReleases,
          excludeUncredited,
          bypassCache: refresh,
        };

    const { personName, releases, profilePath, notFound } = await getPersonReleases(
      filterOptions,
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
      ? `${siteUrl}/avatar/${personId}${clientKey ? `?api_key=${encodeURIComponent(clientKey)}` : ""}`
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

    // 4. Generate ETag, update KV cache with 12h TTL, and negotiate cached response
    const etag = generateEtag(payload);
    kv.set(etagKey, etag, 43200).catch(() => {});

    return buildCachedResponse({
      content: payload,
      contentType,
      maxAge: isJson ? 300 : 3600,
      sMaxAge: isJson ? 3600 : 43200,
      staleWhileRevalidate: 86400,
      etag,
      ifNoneMatch,
      rateLimitHeaders: rateGuard.headers,
    });
  } catch (error) {
    console.error("RSS feed generation error:", error);
    return new NextResponse("Failed to generate RSS feed", { status: 500 });
  }
}
