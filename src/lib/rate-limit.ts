import { NextRequest } from "next/server";
import { BoundedMap } from "./cache";

// Bounded LRU store for rate limiting by IP (capped at 5,000 active IPs)
const ipRecords = new BoundedMap<string, number[]>(5000);

/**
 * Check if a client exceeds the allowed request limit within the sliding time window.
 * High-performance in-place sliding window with zero-allocation on steady hits.
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

  let timestamps = ipRecords.get(key);
  if (!timestamps) {
    timestamps = [now];
    ipRecords.set(key, timestamps);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetSeconds: Math.ceil(windowMs / 1000),
    };
  }

  // Remove expired timestamps from the front in-place (timestamps are strictly chronological)
  let dropCount = 0;
  while (dropCount < timestamps.length && timestamps[dropCount] <= threshold) {
    dropCount++;
  }
  if (dropCount > 0) {
    timestamps.splice(0, dropCount);
  }

  if (timestamps.length >= limit) {
    const oldest = timestamps[0];
    const resetSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      success: false,
      limit,
      remaining: 0,
      resetSeconds,
    };
  }

  timestamps.push(now);
  // Re-set to update LRU position
  ipRecords.set(key, timestamps);

  return {
    success: true,
    limit,
    remaining: limit - timestamps.length,
    resetSeconds: Math.ceil(windowMs / 1000),
  };
}

/**
 * Extract client IP from standard proxy request headers (x-real-ip, x-forwarded-for).
 */
export function getClientIp(request: NextRequest): string {
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const commaIdx = forwardedFor.indexOf(",");
    return (commaIdx === -1 ? forwardedFor : forwardedFor.slice(0, commaIdx)).trim();
  }

  return "127.0.0.1";
}
