/**
 * High-performance O(1) Least-Recently-Used (LRU) bounded cache.
 * Leverages JavaScript Map's native insertion-order preservation.
 */
export class BoundedMap<K, V> {
  private readonly map = new Map<K, V>();

  constructor(public readonly maxSize: number = 500) {}

  get(key: K): V | undefined {
    const value = this.map.get(key);
    if (value !== undefined) {
      // Re-insert to mark as most recently used (O(1))
      this.map.delete(key);
      this.map.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): this {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxSize) {
      // Evict least recently used item (first element in Map iterator, O(1))
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
 * High-performance O(1) Timed Cache with TTL expiration and LRU eviction.
 */
export class TimedCache<K, V> {
  private readonly map = new Map<K, { value: V; expiresAt: number }>();

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

    // Refresh LRU order on access
    this.map.delete(key);
    this.map.set(key, entry);

    return entry.value;
  }

  set(key: K, value: V, customTtlMs?: number): this {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxSize) {
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

  get size(): number {
    return this.map.size;
  }
}
