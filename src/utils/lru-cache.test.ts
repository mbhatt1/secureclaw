import { describe, it, expect, beforeEach, vi } from "vitest";
import { LRUCache } from "./lru-cache.js";

describe("LRUCache", () => {
  it("should set and get values", () => {
    const cache = new LRUCache<string, number>({ maxSize: 3 });

    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);

    expect(cache.get("a")).toBe(1);
    expect(cache.get("b")).toBe(2);
    expect(cache.get("c")).toBe(3);
    expect(cache.size()).toBe(3);
  });

  it("should evict LRU entry when max size exceeded", () => {
    const cache = new LRUCache<string, number>({ maxSize: 3 });

    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);

    // Adding 'd' should evict 'a' (least recently used)
    cache.set("d", 4);

    expect(cache.get("a")).toBeNull();
    expect(cache.get("b")).toBe(2);
    expect(cache.get("c")).toBe(3);
    expect(cache.get("d")).toBe(4);
    expect(cache.size()).toBe(3);
  });

  it("should update LRU order on get", () => {
    const cache = new LRUCache<string, number>({ maxSize: 3 });

    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);

    // Access 'a' to make it most recently used
    cache.get("a");

    // Adding 'd' should now evict 'b' (least recently used)
    cache.set("d", 4);

    expect(cache.get("a")).toBe(1);
    expect(cache.get("b")).toBeNull();
    expect(cache.get("c")).toBe(3);
    expect(cache.get("d")).toBe(4);
  });

  it("should support TTL expiration", () => {
    vi.useFakeTimers();

    const cache = new LRUCache<string, number>({ maxSize: 3, ttl: 1000 });

    cache.set("a", 1);
    expect(cache.get("a")).toBe(1);

    // Advance time past TTL
    vi.advanceTimersByTime(1001);

    expect(cache.get("a")).toBeNull();
    expect(cache.size()).toBe(0);

    vi.useRealTimers();
  });

  it("should update existing key without eviction", () => {
    const cache = new LRUCache<string, number>({ maxSize: 2 });

    cache.set("a", 1);
    cache.set("b", 2);

    // Update 'a' - should not evict 'b'
    cache.set("a", 10);

    expect(cache.get("a")).toBe(10);
    expect(cache.get("b")).toBe(2);
    expect(cache.size()).toBe(2);
  });

  it("should support delete operation", () => {
    const cache = new LRUCache<string, number>({ maxSize: 3 });

    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);

    const deleted = cache.delete("b");

    expect(deleted).toBe(true);
    expect(cache.get("b")).toBeNull();
    expect(cache.size()).toBe(2);
  });

  it("should support clear operation", () => {
    const cache = new LRUCache<string, number>({ maxSize: 3 });

    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);

    cache.clear();

    expect(cache.get("a")).toBeNull();
    expect(cache.size()).toBe(0);
  });

  it("should support has operation", () => {
    const cache = new LRUCache<string, number>({ maxSize: 3 });

    cache.set("a", 1);

    expect(cache.has("a")).toBe(true);
    expect(cache.has("b")).toBe(false);
  });

  it("should support keys, values, entries", () => {
    const cache = new LRUCache<string, number>({ maxSize: 3 });

    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);

    expect(cache.keys()).toEqual(["a", "b", "c"]);
    expect(cache.values()).toEqual([1, 2, 3]);
    expect(cache.entries()).toEqual([
      ["a", 1],
      ["b", 2],
      ["c", 3],
    ]);
  });

  it("should throw on invalid maxSize", () => {
    expect(() => new LRUCache({ maxSize: 0 })).toThrow();
    expect(() => new LRUCache({ maxSize: -1 })).toThrow();
  });
});
