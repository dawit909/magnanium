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
 * Stateful keys represent distributed, mutable state (user profiles, session tokens,
 * subscriptions, auth tokens, dedup records).
 * In serverless environments (e.g. Vercel), concurrent lambda instances have isolated memory.
 * Caching stateful keys in L1 process memory causes desynchronization across lambda instances
 * (e.g. one lambda returns 7 artists, another returns 2 or 1, and mutations overwrite each other).
 *
 * Therefore, when Upstash Redis is configured, stateful keys MUST always read from and write to
 * Upstash Redis directly, bypassing in-memory L1 cache.
 */
function isStatefulKey(key: string): boolean {
  return key.startsWith("sub:");
}

/**
 * Multi-tier Key-Value store:
 * - L1: Instant in-memory cache (for static/idempotent cached data e.g. TMDB responses)
 * - L2: Upstash Redis over REST (shared single source of truth across all serverless instances)
 * - Fallback: Graceful degradation to memory cache if Redis is unconfigured or offline
 */
export const kv = {
  /**
   * Internal helper to fetch and parse a key from Upstash Redis REST API
   */
  async fetchFromRedis<T>(key: string, url: string, token: string, retries: number = 1): Promise<T | null> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

        return parsed;
      } catch (err) {
        if (attempt < retries) {
          continue;
        }
        console.warn(`L2 Redis GET error for key ${key}:`, err);
        return null;
      }
    }
    return null;
  },

  /**
   * Retrieve a value by key from L1 memory or L2 Redis
   */
  async get<T>(key: string): Promise<T | null> {
    const { url, token, isConfigured } = getUpstashConfig();

    // 1. If Redis is configured and key is stateful (e.g. sub:*), NEVER read from L1.
    // Always fetch the live state directly from Redis so all serverless instances stay 100% in sync.
    if (isConfigured && isStatefulKey(key)) {
      return this.fetchFromRedis<T>(key, url, token);
    }

    // 2. Check L1 in-memory cache for static/idempotent keys or when Redis is not configured
    const inMemory = l1Cache.get(key);
    if (inMemory !== undefined) {
      return inMemory as T;
    }

    // If Redis is not configured, we rely entirely on L1
    if (!isConfigured) {
      return null;
    }

    // 3. For non-stateful keys (TMDB data, ETags), fetch from L2 Redis and populate L1
    const redisValue = await this.fetchFromRedis<T>(key, url, token);
    if (redisValue !== null) {
      l1Cache.set(key, redisValue);
    }
    return redisValue;
  },

  /**
   * Store a value in L1 memory and/or L2 Redis with TTL (in seconds).
   * Pass ttlSeconds = 0 or negative for persistent keys without expiration.
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 86400): Promise<void> {
    if (value === undefined) {
      await this.del(key);
      return;
    }

    const { url, token, isConfigured } = getUpstashConfig();

    if (isConfigured) {
      // If stateful, ensure any stale L1 entry is purged
      if (isStatefulKey(key)) {
        l1Cache.delete(key);
      } else {
        // Cacheable data gets L1 TTL
        const memTtl = ttlSeconds > 0 ? ttlSeconds * 1000 : 365 * 24 * 60 * 60 * 1000;
        l1Cache.set(key, value, memTtl);
      }

      try {
        const serialized = JSON.stringify(value);
        const command =
          ttlSeconds > 0
            ? ["SET", key, serialized, "EX", ttlSeconds]
            : ["SET", key, serialized];

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
      return;
    }

    // Fallback: When Redis is not configured (e.g. tests or local dev without Redis), store in L1
    const memTtl = ttlSeconds > 0 ? ttlSeconds * 1000 : 365 * 24 * 60 * 60 * 1000;
    l1Cache.set(key, value, memTtl);
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
