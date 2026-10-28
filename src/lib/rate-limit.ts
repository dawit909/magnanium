import { NextRequest } from "next/server";

interface RateLimitRecord {
  timestamps: number[];
}

// In-memory store for rate limiting by IP
const ipRecords = new Map<string, RateLimitRecord>();

// Clean up expired entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredRecords(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  const threshold = now - windowMs;

  for (const [ip, record] of ipRecords.entries()) {
    const valid = record.timestamps.filter((t) => t > threshold);
    if (valid.length === 0) {
      ipRecords.delete(ip);
    } else {
      record.timestamps = valid;
    }
  }
}

/**
 * Check if a client IP exceeds the allowed request limit within the sliding time window.
 * Default: 10 requests per 60,000ms (1 minute).
 */
export function checkRateLimit(
  ip: string,
  limit: number = 10,
  windowMs: number = 60 * 1000
): {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
} {
  const now = Date.now();
  cleanupExpiredRecords(windowMs);

  const threshold = now - windowMs;
  let record = ipRecords.get(ip);

  if (!record) {
    record = { timestamps: [] };
    ipRecords.set(ip, record);
  }

  // Filter timestamps within the current window
  record.timestamps = record.timestamps.filter((t) => t > threshold);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const resetSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      success: false,
      limit,
      remaining: 0,
      resetSeconds,
    };
  }

  record.timestamps.push(now);
  const resetSeconds = Math.ceil(windowMs / 1000);

  return {
    success: true,
    limit,
    remaining: limit - record.timestamps.length,
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
