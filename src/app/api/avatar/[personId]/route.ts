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
    const rateGuard = guardRateLimit(request, "avatar", 60);
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
        maxAge: 86400,
        sMaxAge: 604800,
        staleWhileRevalidate: 2592000,
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

    // 5. Fetch source portrait & crop to 1:1 square centered JPEG
    const tmdbImageUrl = `https://image.tmdb.org/t/p/w342${person.profile_path}`;
    const imgRes = await fetch(tmdbImageUrl);
    if (!imgRes.ok) {
      return new NextResponse("Image not found on TMDB", { status: imgRes.status });
    }

    const sourceBuffer = Buffer.from(await imgRes.arrayBuffer());
    const squareBuffer = await sharp(sourceBuffer)
      .resize(300, 300, { fit: "cover", position: "center" })
      .jpeg({ quality: 90 })
      .toBuffer();

    const etag = generateEtag(squareBuffer);
    avatarCache.set(personId, { buffer: squareBuffer, etag });

    return buildCachedResponse({
      content: new Uint8Array(squareBuffer),
      contentType: "image/jpeg",
      maxAge: 86400,
      sMaxAge: 604800,
      staleWhileRevalidate: 2592000,
      etagPayload: squareBuffer,
      ifNoneMatch,
      rateLimitHeaders: rateGuard.headers,
    });
  } catch (error) {
    console.error("Avatar processing error:", error);
    return new NextResponse("Failed to process avatar", { status: 500 });
  }
}
