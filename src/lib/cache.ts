/**
 * Generic bounded in-memory cache with FIFO/LRU eviction to prevent unbounded memory growth.
 */
export class BoundedMap<K, V> {
  private map = new Map<K, V>();

  constructor(public readonly maxSize: number = 500) {}

  get(key: K): V | undefined {
    return this.map.get(key);
  }

  set(key: K, value: V): this {
    if (this.map.size >= this.maxSize && !this.map.has(key)) {
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey);
      }
    }
    this.map.set(key, value);
    return this;
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  delete(key: K): boolean {
    return this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }
}

/**
 * In-memory cache with Time-To-Live (TTL) expiration per entry.
 */
export class TimedCache<K, V> {
  private map = new Map<K, { value: V; expiresAt: number }>();

  constructor(
    public readonly ttlMs: number,
    public readonly maxSize: number = 10_000
  ) {}

  get(key: K): V | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: K, value: V, customTtlMs?: number): this {
    if (this.map.size >= this.maxSize && !this.map.has(key)) {
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey);
      }
    }

    const ttl = customTtlMs ?? this.ttlMs;
    this.map.set(key, { value, expiresAt: Date.now() + ttl });
    return this;
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: K): boolean {
    return this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }
}
