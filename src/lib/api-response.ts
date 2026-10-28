import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "./rate-limit";
import { isValidPersonId, isPersonMarkedNotFound } from "./negative-cache";
import { generateEtag, isEtagMatch } from "./etag";

export interface RateLimitResult {
  allowed: boolean;
  response?: NextResponse;
  headers: Record<string, string>;
}

/**
 * Apply rate limiting to an incoming request and generate appropriate headers.
 */
export function guardRateLimit(
  request: NextRequest,
  prefix: string,
  limit: number,
  windowMs: number = 60 * 1000,
  isJson: boolean = false
): RateLimitResult {
  const clientIp = getClientIp(request);
  const check = checkRateLimit(`${prefix}:${clientIp}`, limit, windowMs);

  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(check.limit),
    "X-RateLimit-Remaining": String(check.remaining),
    "X-RateLimit-Reset": String(check.resetSeconds),
  };

  if (!check.success) {
    const errorBody = isJson
      ? JSON.stringify({ error: `Too many requests. Limit is ${limit} requests per minute.` })
      : `Too Many Requests. Rate limit of ${limit} requests per minute exceeded.`;

    const response = new NextResponse(errorBody, {
      status: 429,
      headers: {
        "Content-Type": isJson ? "application/json; charset=utf-8" : "text/plain; charset=utf-8",
        "Retry-After": String(check.resetSeconds),
        ...headers,
      },
    });

    return { allowed: false, response, headers };
  }

  return { allowed: true, headers };
}

/**
 * Validate a person ID parameter and check negative cache.
 */
export function validatePersonId(personIdStr: string): {
  valid: boolean;
  personId?: number;
  response?: NextResponse;
} {
  const personId = parseInt(personIdStr, 10);

  if (isNaN(personId) || !isValidPersonId(personId)) {
    return {
      valid: false,
      response: new NextResponse("Invalid person ID", { status: 400 }),
    };
  }

  if (isPersonMarkedNotFound(personId)) {
    return {
      valid: false,
      response: new NextResponse("Person not found", { status: 404 }),
    };
  }

  return { valid: true, personId };
}

export interface CachedResponseOptions {
  content: BodyInit | null;
  contentType: string;
  maxAge?: number;
  sMaxAge?: number;
  staleWhileRevalidate?: number;
  etagPayload?: string | Buffer;
  ifNoneMatch?: string | null;
  rateLimitHeaders?: Record<string, string>;
}

/**
 * Build a cached HTTP response with automatic ETag and 304 Not Modified negotiation.
 */
export function buildCachedResponse({
  content,
  contentType,
  maxAge = 3600,
  sMaxAge = 43200,
  staleWhileRevalidate = 86400,
  etagPayload,
  ifNoneMatch,
  rateLimitHeaders = {},
}: CachedResponseOptions): NextResponse {
  const cacheControl = `public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`;
  const etag = etagPayload ? generateEtag(etagPayload) : undefined;

  const baseHeaders: Record<string, string> = {
    "Cache-Control": cacheControl,
    Vary: "Accept, Accept-Encoding",
    ...rateLimitHeaders,
  };

  if (etag) {
    baseHeaders["ETag"] = etag;

    if (isEtagMatch(ifNoneMatch || null, etag)) {
      return new NextResponse(null, {
        status: 304,
        headers: baseHeaders,
      });
    }
  }

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      ...baseHeaders,
    },
  });
}
