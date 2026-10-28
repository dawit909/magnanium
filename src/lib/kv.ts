import { TimedCache } from "./cache";

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || "";
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "";

// L1 In-Memory cache (holds up to 5,000 active entries with TTL)
const l1Cache = new TimedCache<string, any>(24 * 60 * 60 * 1000, 5000);

export const isRedisConfigured = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

/**
 * Multi-tier Key-Value store:
 * - L1: Instant in-memory cache (0ms)
 * - L2: Upstash Redis over REST (5-15ms, shared across all servers/functions)
 * - Fallback: Graceful degradation to memory cache if Redis is unconfigured or offline
 */
export const kv = {
  /**
   * Retrieve a value by key from L1 memory or L2 Redis
   */
  async get<T>(key: string): Promise<T | null> {
    // 1. Check L1 in-memory cache
    const inMemory = l1Cache.get(key);
    if (inMemory !== undefined) {
      return inMemory as T;
    }

    // 2. Check L2 Upstash Redis if configured
    if (!isRedisConfigured) {
      return null;
    }

    try {
      const res = await fetch(`${UPSTASH_URL}/get/${encodeURIComponent(key)}`, {
        headers: {
          Authorization: `Bearer ${UPSTASH_TOKEN}`,
        },
        // Cache: no-store on the fetch call itself so we always query live Redis
        cache: "no-store",
      });

      if (!res.ok) return null;

      const data = await res.json();
      if (!data || data.result === null || data.result === undefined) {
        return null;
      }

      const parsed: T = typeof data.result === "string" ? JSON.parse(data.result) : data.result;

      // Populate L1 cache for subsequent fast hits
      l1Cache.set(key, parsed);
      return parsed;
    } catch (err) {
      console.warn(`L2 Redis GET error for key ${key}:`, err);
      return null;
    }
  },

  /**
   * Store a value in L1 memory and L2 Redis with TTL (in seconds)
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 86400): Promise<void> {
    // 1. Always set L1 in-memory cache
    l1Cache.set(key, value, ttlSeconds * 1000);

    // 2. Set L2 Upstash Redis if configured
    if (!isRedisConfigured) return;

    try {
      const serialized = JSON.stringify(value);
      // Use POST command array format to safely handle large JSON payloads
      await fetch(UPSTASH_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${UPSTASH_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(["SET", key, serialized, "EX", ttlSeconds]),
        cache: "no-store",
      });
    } catch (err) {
      console.warn(`L2 Redis SET error for key ${key}:`, err);
    }
  },

  /**
   * Delete a key from L1 and L2
   */
  async del(key: string): Promise<void> {
    l1Cache.delete(key);
    if (!isRedisConfigured) return;

    try {
      await fetch(`${UPSTASH_URL}/del/${encodeURIComponent(key)}`, {
        headers: {
          Authorization: `Bearer ${UPSTASH_TOKEN}`,
        },
        cache: "no-store",
      });
    } catch {}
  },
};
