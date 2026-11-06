import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { getPersonDetails } from "@/lib/tmdb";
import { BoundedMap } from "@/lib/cache";
import { generateEtag } from "@/lib/etag";
import {
  guardRateLimit,
  validatePersonId,
  buildCachedResponse,
} from "@/lib/api-response";
import { getTmdbImageUrl } from "@/lib/media";
import { HTTP_CACHE, RATE_LIMITS } from "@/lib/constants";

export const runtime = "nodejs";

interface CachedAvatar {
  buffer: Buffer;
  etag: string;
}
const avatarCache = new BoundedMap<number, CachedAvatar>(500);

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ personId: string }> }
) {
  try {
    // 1. Rate limiting (60 req/min per IP)
    const rateGuard = guardRateLimit(
      request,
      RATE_LIMITS.AVATAR.prefix,
      RATE_LIMITS.AVATAR.max,
      RATE_LIMITS.AVATAR.windowMs
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

    const ifNoneMatch = request.headers.get("if-none-match");

    // 3. Check in-memory avatar cache
    const cached = avatarCache.get(personId);
    if (cached) {
      return buildCachedResponse({
        content: new Uint8Array(cached.buffer),
        contentType: "image/jpeg",
        maxAge: HTTP_CACHE.AVATAR.maxAge,
        sMaxAge: HTTP_CACHE.AVATAR.sMaxAge,
        staleWhileRevalidate: HTTP_CACHE.AVATAR.staleWhileRevalidate,
        etagPayload: cached.buffer,
        ifNoneMatch,
        rateLimitHeaders: rateGuard.headers,
      });
    }

    // 4. Fetch person details from TMDB
    const { searchParams } = new URL(request.url);
    const clientKey = request.headers.get("x-tmdb-key") || searchParams.get("api_key") || undefined;

    const person = await getPersonDetails(personId, clientKey);
    if (!person || !person.profile_path) {
      return new NextResponse("Profile image not found", { status: 404 });
    }

    // 5. Fetch source portrait & crop to 1:1 square centered JPEG (using TMDB face crop or top-aligned fallback)
    const tmdbFaceUrl = getTmdbImageUrl(person.profile_path, "w300_and_h300_face")!;
    let imgRes = await fetch(tmdbFaceUrl, { signal: AbortSignal.timeout(6000) });
    if (!imgRes.ok) {
      const fallbackUrl = getTmdbImageUrl(person.profile_path, "w342")!;
      imgRes = await fetch(fallbackUrl, {
        signal: AbortSignal.timeout(6000),
      });
      if (!imgRes.ok) {
        return new NextResponse("Image not found on TMDB", { status: imgRes.status });
      }
    }

    const sourceBuffer = Buffer.from(await imgRes.arrayBuffer());
    const squareBuffer = await sharp(sourceBuffer)
      .resize(300, 300, { fit: "cover", position: "north" })
      .jpeg({ quality: 90 })
      .toBuffer();

    const etag = generateEtag(squareBuffer);
    avatarCache.set(personId, { buffer: squareBuffer, etag });

    return buildCachedResponse({
      content: new Uint8Array(squareBuffer),
      contentType: "image/jpeg",
      maxAge: HTTP_CACHE.AVATAR.maxAge,
      sMaxAge: HTTP_CACHE.AVATAR.sMaxAge,
      staleWhileRevalidate: HTTP_CACHE.AVATAR.staleWhileRevalidate,
      etagPayload: squareBuffer,
      ifNoneMatch,
      rateLimitHeaders: rateGuard.headers,
    });
  } catch (error) {
    console.error("Avatar API error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
