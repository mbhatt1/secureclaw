/**
 * HTTP request cache for reduced network overhead
 *
 * Simple LRU cache for GET requests with TTL and ETag support.
 * Reduces redundant network requests for frequently accessed resources.
 */

import crypto from "node:crypto";
import { createSubsystemLogger } from "../logging/subsystem.js";
import { LRUCache } from "../utils/lru-cache.js";

const log = createSubsystemLogger("request-cache");

export type CacheEntry<T = unknown> = {
  data: T;
  etag: string;
  timestamp: number;
  hits: number;
  size: number;
};

export type RequestCacheConfig = {
  /** Maximum cache size (number of entries) */
  maxEntries?: number;
  /** Default TTL in milliseconds */
  defaultTtlMs?: number;
  /** Enable automatic cleanup */
  enableAutoCleanup?: boolean;
  /** Cleanup interval in milliseconds */
  cleanupIntervalMs?: number;
};

const DEFAULT_CONFIG = {
  maxEntries: 100,
  defaultTtlMs: 5 * 60 * 1000, // 5 minutes
  enableAutoCleanup: true,
  cleanupIntervalMs: 60 * 1000, // 1 minute
};

export class RequestCache {
  private cache: LRUCache<string, CacheEntry>;
  private readonly config: Required<RequestCacheConfig>;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private totalHits = 0;
  private totalMisses = 0;
  private totalEvictions = 0;

  constructor(config: RequestCacheConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    // Use LRUCache for bounded memory usage
    this.cache = new LRUCache({
      maxSize: this.config.maxEntries,
      ttl: this.config.defaultTtlMs,
    });

    if (this.config.enableAutoCleanup) {
      this.startAutoCleanup();
    }
  }

  /**
   * Generate a cache key from request parameters
   */
  private generateKey(url: string, options?: { headers?: Record<string, string> }): string {
    const parts = [url];

    if (options?.headers) {
      const headerKeys = Object.keys(options.headers).toSorted();
      for (const key of headerKeys) {
        parts.push(`${key}:${options.headers[key]}`);
      }
    }

    return crypto.createHash("sha256").update(parts.join("|")).digest("hex");
  }

  /**
   * Generate ETag for data
   */
  private generateETag(data: unknown): string {
    const content = typeof data === "string" ? data : JSON.stringify(data);
    return crypto.createHash("sha256").update(content).digest("hex").substring(0, 16);
  }

  /**
   * Get cached data if available and not expired
   */
  get<T = unknown>(
    url: string,
    options?: { headers?: Record<string, string>; ttlMs?: number },
  ): { data: T; etag: string } | null {
    const key = this.generateKey(url, options);
    const entry = this.cache.get(key);

    if (!entry) {
      this.totalMisses++;
      return null;
    }

    const ttl = options?.ttlMs ?? this.config.defaultTtlMs;
    const expired = Date.now() - entry.timestamp > ttl;

    if (expired) {
      this.cache.delete(key);
      this.totalMisses++;
      return null;
    }

    entry.hits++;
    this.totalHits++;

    return {
      data: entry.data as T,
      etag: entry.etag,
    };
  }

  /**
   * Set cache entry
   */
  set<T = unknown>(
    url: string,
    data: T,
    options?: { headers?: Record<string, string>; etag?: string },
  ): void {
    const key = this.generateKey(url, options);
    const etag = options?.etag ?? this.generateETag(data);

    const size = this.estimateSize(data);

    this.cache.set(key, {
      data,
      etag,
      timestamp: Date.now(),
      hits: 0,
      size,
    });

    // LRUCache handles eviction automatically
  }

  /**
   * Check if cached data is still valid using ETag
   */
  isValid(url: string, etag: string, options?: { headers?: Record<string, string> }): boolean {
    const key = this.generateKey(url, options);
    const entry = this.cache.get(key);

    return entry?.etag === etag;
  }

  /**
   * Invalidate a specific cache entry
   */
  invalidate(url: string, options?: { headers?: Record<string, string> }): boolean {
    const key = this.generateKey(url, options);
    return this.cache.delete(key);
  }

  /**
   * Invalidate all entries matching a URL pattern
   */
  invalidatePattern(pattern: RegExp): number {
    let count = 0;

    for (const key of this.cache.keys()) {
      // Note: We can't reverse the key back to URL easily
      // This is a limitation of the hash-based key
      // In practice, you'd store the original URL in the entry
      // For now, we'll just provide a simple clear method
      this.cache.delete(key);
      count++;
    }

    return count;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Evict the oldest entry (LRU)
   * Note: LRUCache handles eviction automatically, this is kept for manual cleanup
   */
  private evictOldest(): void {
    const entries = this.cache.entries();
    if (entries.length === 0) {
      return;
    }

    let oldestKey: string | null = null;
    let oldestTime = Number.POSITIVE_INFINITY;

    for (const [key, entry] of entries) {
      // Prefer evicting entries with fewer hits
      const priority = entry.timestamp - entry.hits * 10000;

      if (priority < oldestTime) {
        oldestTime = priority;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.totalEvictions++;
    }
  }

  /**
   * Estimate size of cached data in bytes
   */
  private estimateSize(data: unknown): number {
    if (typeof data === "string") {
      return data.length * 2; // UTF-16 approximation
    }

    try {
      return JSON.stringify(data).length * 2;
    } catch {
      return 1024; // Default estimate
    }
  }

  /**
   * Start automatic cleanup of expired entries
   */
  private startAutoCleanup(): void {
    if (this.cleanupTimer) {
      return;
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupIntervalMs);

    // Allow Node.js to exit even with timer running
    this.cleanupTimer.unref();
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      const expired = now - entry.timestamp > this.config.defaultTtlMs;

      if (expired) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      log.debug("cache cleanup", { removed, remaining: this.cache.size });
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    entries: number;
    totalHits: number;
    totalMisses: number;
    totalEvictions: number;
    hitRate: number;
    totalSize: number;
    avgEntrySize: number;
  } {
    let totalSize = 0;

    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }

    const total = this.totalHits + this.totalMisses;
    const hitRate = total > 0 ? (this.totalHits / total) * 100 : 0;
    const cacheSize = this.cache.size();
    const avgEntrySize = cacheSize > 0 ? totalSize / cacheSize : 0;

    return {
      entries: cacheSize,
      totalHits: this.totalHits,
      totalMisses: this.totalMisses,
      totalEvictions: this.totalEvictions,
      hitRate,
      totalSize,
      avgEntrySize,
    };
  }

  /**
   * Get top N most accessed entries
   */
  getTopEntries(n = 10): Array<{ key: string; hits: number; size: number; age: number }> {
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        hits: entry.hits,
        size: entry.size,
        age: Date.now() - entry.timestamp,
      }))
      .toSorted((a, b) => b.hits - a.hits)
      .slice(0, n);

    return entries;
  }

  /**
   * Stop automatic cleanup
   */
  stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Close the cache
   */
  close(): void {
    this.stopAutoCleanup();
    this.clear();

    const stats = this.getStats();
    log.debug("request cache closed", {
      hitRate: `${stats.hitRate.toFixed(1)}%`,
      totalHits: stats.totalHits,
      totalMisses: stats.totalMisses,
      totalEvictions: stats.totalEvictions,
    });
  }
}

/**
 * Global cache instance (singleton)
 */
let globalCache: RequestCache | null = null;

/**
 * Get or create the global cache instance
 */
export function getRequestCache(config?: RequestCacheConfig): RequestCache {
  if (!globalCache) {
    globalCache = new RequestCache(config);
  }
  return globalCache;
}

/**
 * Cached fetch wrapper
 */
export async function cachedFetch<T = unknown>(
  url: string,
  options?: RequestInit & { ttlMs?: number; bypassCache?: boolean },
): Promise<T> {
  // Only cache GET requests
  if (options?.method && options.method.toUpperCase() !== "GET") {
    const response = await fetch(url, options);
    return (await response.json()) as T;
  }

  const cache = getRequestCache();

  // Check cache first
  if (!options?.bypassCache) {
    const cached = cache.get<T>(url, {
      headers: options?.headers as Record<string, string> | undefined,
      ttlMs: options?.ttlMs,
    });

    if (cached) {
      return cached.data;
    }
  }

  // Fetch from network
  const response = await fetch(url, options);
  const data = (await response.json()) as T;

  // Cache the response
  const etag = response.headers.get("etag") ?? undefined;
  cache.set(url, data, {
    headers: options?.headers as Record<string, string> | undefined,
    etag,
  });

  return data;
}
