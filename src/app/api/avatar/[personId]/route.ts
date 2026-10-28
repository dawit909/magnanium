import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { getPersonDetails } from "@/lib/tmdb";
import { isValidPersonId, isPersonMarkedNotFound } from "@/lib/negative-cache";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { generateEtag, isEtagMatch } from "@/lib/etag";

export const runtime = "nodejs";

// In-memory LRU-like cache for cropped square avatars to minimize TMDB fetches & image processing
interface CachedAvatar {
  buffer: Buffer;
  etag: string;
}
const avatarCache = new Map<number, CachedAvatar>();
const MAX_CACHE_ENTRIES = 500;

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ personId: string }> }
) {
  try {
    const clientIp = getClientIp(request);
    // Rate limit avatar requests (60 req/min per IP)
    const rateCheck = checkRateLimit(`avatar:${clientIp}`, 60, 60 * 1000);
    if (!rateCheck.success) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": String(rateCheck.resetSeconds),
        },
      });
    }

    const params = await props.params;
    const personId = parseInt(params.personId, 10);

    if (isNaN(personId) || !isValidPersonId(personId)) {
      return new NextResponse("Invalid person ID", { status: 400 });
    }

    if (isPersonMarkedNotFound(personId)) {
      return new NextResponse("Person not found", { status: 404 });
    }

    const ifNoneMatch = request.headers.get("if-none-match");

    // 1. Check in-memory avatar cache
    const cached = avatarCache.get(personId);
    if (cached) {
      if (isEtagMatch(ifNoneMatch, cached.etag)) {
        return new NextResponse(null, {
          status: 304,
          headers: {
            "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
            ETag: cached.etag,
          },
        });
      }

      return new NextResponse(new Uint8Array(cached.buffer), {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
          ETag: cached.etag,
        },
      });
    }

    // 2. Fetch TMDB details
    const { searchParams } = new URL(request.url);
    const clientKey = request.headers.get("x-tmdb-key") || searchParams.get("api_key") || undefined;

    const person = await getPersonDetails(personId, clientKey);
    if (!person || !person.profile_path) {
      return new NextResponse("Profile image not found", { status: 404 });
    }

    // 3. Fetch source TMDB portrait image (2:3 aspect ratio, w342)
    const tmdbImageUrl = `https://image.tmdb.org/t/p/w342${person.profile_path}`;
    const imgRes = await fetch(tmdbImageUrl);
    if (!imgRes.ok) {
      return new NextResponse("Image not found on TMDB", { status: imgRes.status });
    }

    const sourceBuffer = Buffer.from(await imgRes.arrayBuffer());

    // 4. Crop to 1:1 square centered and encode as JPEG
    const squareBuffer = await sharp(sourceBuffer)
      .resize(300, 300, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 90 })
      .toBuffer();

    const etag = generateEtag(squareBuffer);

    // Evict oldest entry if cache exceeds limit
    if (avatarCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = avatarCache.keys().next().value;
      if (oldestKey !== undefined) {
        avatarCache.delete(oldestKey);
      }
    }
    avatarCache.set(personId, {
      buffer: squareBuffer,
      etag,
    });

    if (isEtagMatch(ifNoneMatch, etag)) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
          ETag: etag,
        },
      });
    }

    return new NextResponse(new Uint8Array(squareBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
        ETag: etag,
      },
    });
  } catch (error) {
    console.error("Avatar processing error:", error);
    return new NextResponse("Failed to process avatar", { status: 500 });
  }
}
