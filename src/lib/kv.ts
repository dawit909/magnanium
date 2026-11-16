import { TimedCache } from "./cache";

export function getUpstashConfig() {
  const url = (process.env.UPSTASH_REDIS_REST_URL || "").replace(/^["']|["']$/g, "").trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || "").replace(/^["']|["']$/g, "").trim();
  return { url, token, isConfigured: Boolean(url && token) };
}

// L1 In-Memory cache (holds up to 5,000 active entries with TTL)
const l1Cache = new TimedCache<string, any>(24 * 60 * 60 * 1000, 5000);

export const isRedisConfigured = Boolean(
  (process.env.UPSTASH_REDIS_REST_URL || "").trim() &&
  (process.env.UPSTASH_REDIS_REST_TOKEN || "").trim()
);

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
    const { url, token, isConfigured } = getUpstashConfig();
    if (!isConfigured) {
      return null;
    }

    try {
      const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // Cache: no-store on the fetch call itself so we always query live Redis
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      });

      if (!res.ok) return null;

      const data = await res.json();
      if (!data || data.result === null || data.result === undefined) {
        return null;
      }

      let parsed: T;
      if (typeof data.result === "string") {
        try {
          parsed = JSON.parse(data.result);
        } catch {
          parsed = data.result as unknown as T;
        }
      } else {
        parsed = data.result;
      }

      // Populate L1 cache for subsequent fast hits
      l1Cache.set(key, parsed);
      return parsed;
    } catch (err) {
      console.warn(`L2 Redis GET error for key ${key}:`, err);
      return null;
    }
  },

  /**
   * Store a value in L1 memory and L2 Redis with TTL (in seconds).
   * Pass ttlSeconds = 0 or negative for persistent keys without expiration.
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 86400): Promise<void> {
    if (value === undefined) {
      await this.del(key);
      return;
    }

    // 1. Always set L1 in-memory cache
    const memTtl = ttlSeconds > 0 ? ttlSeconds * 1000 : 365 * 24 * 60 * 60 * 1000;
    l1Cache.set(key, value, memTtl);

    // 2. Set L2 Upstash Redis if configured
    const { url, token, isConfigured } = getUpstashConfig();
    if (!isConfigured) return;

    try {
      const serialized = JSON.stringify(value);
      const command =
        ttlSeconds > 0
          ? ["SET", key, serialized, "EX", ttlSeconds]
          : ["SET", key, serialized];

      // Use POST command array format to safely handle large JSON payloads
      await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
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
    const { url, token, isConfigured } = getUpstashConfig();
    if (!isConfigured) return;

    try {
      await fetch(`${url}/del/${encodeURIComponent(key)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      });
    } catch (err) {
      console.warn(`L2 Redis DEL error for key ${key}:`, err);
    }
  },
};
