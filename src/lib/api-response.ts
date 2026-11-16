import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "./rate-limit";
import { isValidPersonId, isPersonMarkedNotFound } from "./negative-cache";
import { generateEtag, isEtagMatch } from "./etag";
import { HTTP_CACHE, TIME_MS, APP_CONFIG, AUTH_CONFIG } from "./constants";
import { getSession, SessionPayload } from "./subscriptions";

/**
 * Resolve canonical site URL from request headers or environment.
 */
export function getRequestSiteUrl(
  request: Request | NextRequest,
  fallback: string = APP_CONFIG.DEFAULT_SITE_URL
): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  const headers = request.headers;
  const host = headers.get("x-forwarded-host") || headers.get("host") || "";
  if (!host) {
    return fallback;
  }

  const forwardedProto = headers.get("x-forwarded-proto");
  const protocol =
    forwardedProto ||
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return `${protocol}://${host}`;
}

export interface AuthRequestResult {
  authenticated: boolean;
  sessionToken?: string;
  session?: SessionPayload;
  errorResponse?: NextResponse;
}

/**
 * Authenticates an incoming API request using the session cookie.
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<AuthRequestResult> {
  const sessionToken = request.cookies.get(AUTH_CONFIG.COOKIE_NAME)?.value;
  if (!sessionToken) {
    return {
      authenticated: false,
      errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const session = await getSession(sessionToken);
  if (!session) {
    const errorResponse = NextResponse.json({ error: "Session expired" }, { status: 401 });
    errorResponse.cookies.delete(AUTH_CONFIG.COOKIE_NAME);
    return {
      authenticated: false,
      errorResponse,
    };
  }

  return {
    authenticated: true,
    sessionToken,
    session,
  };
}

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
  windowMs: number = TIME_MS.MINUTE,
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
  etag?: string;
  ifNoneMatch?: string | null;
  rateLimitHeaders?: Record<string, string>;
}

/**
 * Build a cached HTTP response with automatic ETag and 304 Not Modified negotiation.
 */
export function buildCachedResponse({
  content,
  contentType,
  maxAge = HTTP_CACHE.FEED_RSS.maxAge,
  sMaxAge = HTTP_CACHE.FEED_RSS.sMaxAge,
  staleWhileRevalidate = HTTP_CACHE.FEED_RSS.staleWhileRevalidate,
  etagPayload,
  etag: directEtag,
  ifNoneMatch,
  rateLimitHeaders = {},
}: CachedResponseOptions): NextResponse {
  const cacheControl = `public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`;
  const cdnCacheControl = `public, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`;
  const etag = directEtag || (etagPayload ? generateEtag(etagPayload) : undefined);

  const baseHeaders: Record<string, string> = {
    "Cache-Control": cacheControl,
    "CDN-Cache-Control": cdnCacheControl,
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
