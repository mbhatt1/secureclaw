import type { ChannelDirectoryEntryKind, ChannelId } from "../../channels/plugins/types.js";
import type { SecureClawConfig } from "../../config/config.js";
import { LRUCache } from "../../utils/lru-cache.js";

type CacheEntry<T> = {
  value: T;
  fetchedAt: number;
};

export type DirectoryCacheKey = {
  channel: ChannelId;
  accountId?: string | null;
  kind: ChannelDirectoryEntryKind;
  source: "cache" | "live";
  signature?: string | null;
};

export function buildDirectoryCacheKey(key: DirectoryCacheKey): string {
  const signature = key.signature ?? "default";
  return `${key.channel}:${key.accountId ?? "default"}:${key.kind}:${key.source}:${signature}`;
}

export class DirectoryCache<T> {
  private readonly cache: LRUCache<string, CacheEntry<T>>;
  private lastConfigRef: SecureClawConfig | null = null;

  constructor(private readonly ttlMs: number) {
    // Limit cache to 1000 entries to prevent unbounded growth
    this.cache = new LRUCache({ maxSize: 1000, ttl: ttlMs });
  }

  get(key: string, cfg: SecureClawConfig): T | undefined {
    this.resetIfConfigChanged(cfg);
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }
    // LRUCache handles TTL automatically, but we check fetchedAt for custom TTL
    if (Date.now() - entry.fetchedAt > this.ttlMs) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, cfg: SecureClawConfig): void {
    this.resetIfConfigChanged(cfg);
    this.cache.set(key, { value, fetchedAt: Date.now() });
  }

  clearMatching(match: (key: string) => boolean): void {
    for (const key of this.cache.keys()) {
      if (match(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(cfg?: SecureClawConfig): void {
    this.cache.clear();
    if (cfg) {
      this.lastConfigRef = cfg;
    }
  }

  private resetIfConfigChanged(cfg: SecureClawConfig): void {
    if (this.lastConfigRef && this.lastConfigRef !== cfg) {
      this.cache.clear();
    }
    this.lastConfigRef = cfg;
  }
}
