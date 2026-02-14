/**
 * Simple LRU Cache for memory-constrained environments (Raspberry Pi)
 *
 * Features:
 * - Fixed max size to prevent unbounded growth
 * - O(1) get/set operations
 * - Automatic eviction of least recently used items
 * - Optional TTL support
 */
export class LRUCache<K, V> {
  private readonly maxSize: number;
  private readonly ttl: number | null;
  private cache: Map<K, { value: V; timestamp: number }>;
  private accessOrder: K[];

  constructor(opts: { maxSize: number; ttl?: number }) {
    if (opts.maxSize <= 0) {
      throw new Error("LRUCache maxSize must be positive");
    }
    this.maxSize = opts.maxSize;
    this.ttl = opts.ttl ?? null;
    this.cache = new Map();
    this.accessOrder = [];
  }

  get(key: K): V | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check TTL expiry
    if (this.ttl !== null && Date.now() - entry.timestamp > this.ttl) {
      this.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.updateAccessOrder(key);
    return entry.value;
  }

  set(key: K, value: V): void {
    // Evict if at capacity and key is new
    if (!this.cache.has(key) && this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, { value, timestamp: Date.now() });
    this.updateAccessOrder(key);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.accessOrder = this.accessOrder.filter((k) => k !== key);
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  size(): number {
    return this.cache.size;
  }

  keys(): K[] {
    return Array.from(this.cache.keys());
  }

  values(): V[] {
    return Array.from(this.cache.values()).map((entry) => entry.value);
  }

  entries(): Array<[K, V]> {
    return Array.from(this.cache.entries()).map(([k, entry]) => [k, entry.value]);
  }

  private evictLRU(): void {
    if (this.accessOrder.length === 0) {
      return;
    }
    const lruKey = this.accessOrder[0];
    this.delete(lruKey);
  }

  private updateAccessOrder(key: K): void {
    // Remove from current position
    this.accessOrder = this.accessOrder.filter((k) => k !== key);
    // Add to end (most recent)
    this.accessOrder.push(key);
  }
}
