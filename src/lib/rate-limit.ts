import { NextRequest } from "next/server";
import { BoundedMap } from "./cache";

// Bounded sliding-window store for rate limiting by IP (capped at 5,000 active entries)
const ipRecords = new BoundedMap<string, number[]>(5000);

/**
 * Check if a client exceeds the allowed request limit within the sliding time window.
 */
export function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60 * 1000
): {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
} {
  const now = Date.now();
  const threshold = now - windowMs;

  const timestamps = (ipRecords.get(key) || []).filter((t) => t > threshold);

  if (timestamps.length >= limit) {
    const oldest = timestamps[0];
    const resetSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    ipRecords.set(key, timestamps);
    return {
      success: false,
      limit,
      remaining: 0,
      resetSeconds,
    };
  }

  timestamps.push(now);
  ipRecords.set(key, timestamps);
  const resetSeconds = Math.ceil(windowMs / 1000);

  return {
    success: true,
    limit,
    remaining: limit - timestamps.length,
    resetSeconds,
  };
}

/**
 * Extract client IP from request headers (Cloudflare, proxies, x-forwarded-for).
 */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  return "127.0.0.1";
}
