import { NextRequest, NextResponse } from "next/server";
import { getPersonReleases } from "@/lib/tmdb";
import { generateRssFeed } from "@/lib/rss";
import {
  guardRateLimit,
  validatePersonId,
  buildCachedResponse,
} from "@/lib/api-response";
import { kv } from "@/lib/kv";
import { isEtagMatch, generateEtag } from "@/lib/etag";
import { parseFeedRequestParams, getFeedEtagKey } from "@/lib/feed-params";
import { CACHE_TTL, HTTP_CACHE, RATE_LIMITS } from "@/lib/constants";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ personId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const { feedParams, filterOptions } = parseFeedRequestParams(searchParams, request.headers);
    const { isJson, isRaw, refresh, clientKey } = feedParams;

    // 1. IP Rate Limiting:
    // - Interactive JSON preview in UI: 120 req/min with dedicated prefix so rapid filtering never starves.
    // - External XML/RSS feed polling: 30 req/min for feed reader background refresh.
    const rateLimitConfig = isJson ? RATE_LIMITS.FEED_PREVIEW : RATE_LIMITS.FEED_RSS;
    const rateGuard = guardRateLimit(
      request,
      rateLimitConfig.prefix,
      rateLimitConfig.max,
      rateLimitConfig.windowMs,
      isJson
    );
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
    filterOptions.personId = personId;

    // 3. Early-Exit ETag Check: If client sends If-None-Match matching cached ETag, return 304 immediately!
    const ifNoneMatch = request.headers.get("if-none-match");
    const etagKey = getFeedEtagKey(personId, feedParams);

    if (ifNoneMatch && !refresh) {
      const cachedEtag = await kv.get<string>(etagKey);
      if (cachedEtag && isEtagMatch(ifNoneMatch, cachedEtag)) {
        const cacheConfig = isJson ? HTTP_CACHE.FEED_JSON : HTTP_CACHE.FEED_RSS;

        return new NextResponse(null, {
          status: 304,
          headers: {
            "Cache-Control": `public, max-age=${cacheConfig.maxAge}, s-maxage=${cacheConfig.sMaxAge}, stale-while-revalidate=${cacheConfig.staleWhileRevalidate}`,
            "CDN-Cache-Control": `public, s-maxage=${cacheConfig.sMaxAge}, stale-while-revalidate=${cacheConfig.staleWhileRevalidate}`,
            ETag: cachedEtag,
            Vary: "Accept, Accept-Encoding",
            ...rateGuard.headers,
          },
        });
      }
    }

    const { personName, releases, profilePath, notFound } = await getPersonReleases(
      filterOptions,
      clientKey
    );

    if (notFound) {
      return new NextResponse("Person not found", { status: 404 });
    }

    const host =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      "localhost:3000";
    const forwardedProto = request.headers.get("x-forwarded-proto");
    const protocol =
      forwardedProto ||
      (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
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

    // 4. Generate ETag, update KV cache with 24h TTL, and negotiate cached response
    const etag = generateEtag(payload);
    kv.set(etagKey, etag, CACHE_TTL.FEED_ETAG).catch(() => {});

    const cacheConfig = isJson ? HTTP_CACHE.FEED_JSON : HTTP_CACHE.FEED_RSS;

    return buildCachedResponse({
      content: payload,
      contentType,
      maxAge: cacheConfig.maxAge,
      sMaxAge: cacheConfig.sMaxAge,
      staleWhileRevalidate: cacheConfig.staleWhileRevalidate,
      etag,
      ifNoneMatch,
      rateLimitHeaders: rateGuard.headers,
    });
  } catch (error) {
    console.error("RSS feed generation error:", error);
    return new NextResponse("Failed to generate RSS feed", { status: 500 });
  }
}
