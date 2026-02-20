// ---------------------------------------------------------------------------
// IOC Database -- Indicator of Compromise Lookup Engine
// ---------------------------------------------------------------------------
// Provides fast O(1) lookups against a database of known-malicious indicators
// including domains, IP addresses, file hashes, and URL patterns.
//
// Designed to complement the pattern-based threat detection in the Security
// Coach (src/security-coach/patterns.ts) by adding a concrete database of
// known-bad indicators rather than relying solely on heuristic patterns.
// ---------------------------------------------------------------------------

import { ALL_SEED_IOCS } from "./ioc-data.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type IOCSeverity = "critical" | "high" | "medium";

export type IOCType = "domain" | "ip" | "hash" | "url_pattern";

export type IOCCategory = "c2" | "phishing" | "malware" | "cryptominer" | "data_exfil";

export type IOCEntry = {
  id: string;
  type: IOCType;
  value: string;
  category: string;
  severity: IOCSeverity;
  description: string;
  addedAt: Date;
  source?: string;
};

export type IOCMatch = {
  /** The indicator value that matched. */
  indicator: string;
  /** What kind of indicator matched. */
  type: IOCType;
  /** Threat category (c2, phishing, malware, etc.). */
  category: string;
  /** Severity of the matched indicator. */
  severity: IOCSeverity;
  /** Human-readable description of why this indicator is flagged. */
  description: string;
  /** The original input string that triggered the match. */
  matchedInput: string;
};

export type IOCStats = {
  totalIndicators: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  lastUpdated: Date;
};

// ---------------------------------------------------------------------------
// Internal: CIDR range representation
// ---------------------------------------------------------------------------

type CIDRRange = {
  /** Network address as a 32-bit number. */
  network: number;
  /** Subnet mask as a 32-bit number. */
  mask: number;
  /** The original IOC entry for this range. */
  entry: IOCEntry;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse a dotted-quad IPv4 address into a 32-bit unsigned integer. */
function ipToNumber(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) {
    return null;
  }
  let num = 0;
  for (const part of parts) {
    const octet = Number(part);
    if (!Number.isInteger(octet) || octet < 0 || octet > 255) {
      return null;
    }
    num = (num << 8) | octet;
  }
  // Convert to unsigned 32-bit.
  return num >>> 0;
}

/** Check whether a string looks like an IPv4 address. */
function isIPv4(s: string): boolean {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(s);
}

/** Check whether a string looks like a CIDR range (e.g., 192.0.2.0/24). */
function isCIDR(s: string): boolean {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/.test(s);
}

/** Parse a CIDR notation string into a CIDRRange, or null on invalid input. */
function parseCIDR(cidr: string, entry: IOCEntry): CIDRRange | null {
  const slashIdx = cidr.indexOf("/");
  if (slashIdx === -1) {
    return null;
  }
  const ipPart = cidr.slice(0, slashIdx);
  const prefixLen = Number(cidr.slice(slashIdx + 1));
  if (!Number.isInteger(prefixLen) || prefixLen < 0 || prefixLen > 32) {
    return null;
  }
  const network = ipToNumber(ipPart);
  if (network === null) {
    return null;
  }
  // Build the mask: prefixLen leading 1-bits, rest 0.
  const mask = prefixLen === 0 ? 0 : (~0 << (32 - prefixLen)) >>> 0;
  return { network: (network & mask) >>> 0, mask, entry };
}

// ---------------------------------------------------------------------------
// IOCDatabase
// ---------------------------------------------------------------------------

export class IOCDatabase {
  // -- Fast-lookup structures -----------------------------------------------

  /** Exact domain lookup (O(1)). */
  private readonly domainSet = new Map<string, IOCEntry>();

  /** Exact IP lookup (O(1)). */
  private readonly ipSet = new Map<string, IOCEntry>();

  /** Hash lookup (O(1)). */
  private readonly hashSet = new Map<string, IOCEntry>();

  /** CIDR ranges for IP prefix matching (linear scan, small list). */
  private readonly cidrRanges: CIDRRange[] = [];

  /** Pre-compiled URL pattern regexes. */
  private readonly urlPatterns: { regex: RegExp; entry: IOCEntry }[] = [];

  /** Master list of all entries, keyed by ID. */
  private readonly entries = new Map<string, IOCEntry>();

  /** Timestamp of last modification (add/remove). */
  private lastModified = new Date();

  // -- Regex for extracting indicators from free text -----------------------

  private static readonly URL_RE = /https?:\/\/[^\s"'<>]+/gi;
  private static readonly IP_RE = /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/g;
  private static readonly DOMAIN_RE =
    /\b([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,})\b/g;
  private static readonly HASH_RE = /\b([a-fA-F0-9]{64})\b/g;

  // -----------------------------------------------------------------------
  // Constructor
  // -----------------------------------------------------------------------

  constructor(options?: { skipSeedData?: boolean }) {
    if (!options?.skipSeedData) {
      for (const entry of ALL_SEED_IOCS) {
        this.indexEntry(entry);
      }
    }
  }

  // -----------------------------------------------------------------------
  // Internal indexing
  // -----------------------------------------------------------------------

  private indexEntry(entry: IOCEntry): void {
    this.entries.set(entry.id, entry);
    const val = entry.value.toLowerCase();

    switch (entry.type) {
      case "domain":
        this.domainSet.set(val, entry);
        break;

      case "ip":
        if (isCIDR(val)) {
          const range = parseCIDR(val, entry);
          if (range) {
            this.cidrRanges.push(range);
          }
        } else {
          this.ipSet.set(val, entry);
        }
        break;

      case "hash":
        this.hashSet.set(val, entry);
        break;

      case "url_pattern": {
        try {
          const regex = new RegExp(entry.value, "i");
          this.urlPatterns.push({ regex, entry });
        } catch {
          // Skip invalid regex entries silently.
        }
        break;
      }
    }

    this.lastModified = new Date();
  }

  private unindexEntry(entry: IOCEntry): void {
    const val = entry.value.toLowerCase();

    switch (entry.type) {
      case "domain":
        this.domainSet.delete(val);
        break;

      case "ip":
        if (isCIDR(val)) {
          const idx = this.cidrRanges.findIndex((r) => r.entry.id === entry.id);
          if (idx !== -1) {
            this.cidrRanges.splice(idx, 1);
          }
        } else {
          this.ipSet.delete(val);
        }
        break;

      case "hash":
        this.hashSet.delete(val);
        break;

      case "url_pattern": {
        const idx = this.urlPatterns.findIndex((p) => p.entry.id === entry.id);
        if (idx !== -1) {
          this.urlPatterns.splice(idx, 1);
        }
        break;
      }
    }

    this.entries.delete(entry.id);
    this.lastModified = new Date();
  }

  // -----------------------------------------------------------------------
  // Public API – Single-indicator checks
  // -----------------------------------------------------------------------

  /**
   * Check a domain against the IOC database.
   * Supports exact match and subdomain matching (e.g., `foo.evil.example.com`
   * matches if `evil.example.com` is in the database).
   */
  checkDomain(domain: string): IOCMatch | null {
    const normalized = domain.toLowerCase().replace(/\.$/, "");

    // Walk up the domain hierarchy: a.b.c.d -> b.c.d -> c.d -> d
    let current = normalized;
    while (current) {
      const entry = this.domainSet.get(current);
      if (entry) {
        return this.toMatch(entry, domain);
      }
      const dotIdx = current.indexOf(".");
      if (dotIdx === -1) {
        break;
      }
      current = current.slice(dotIdx + 1);
    }

    return null;
  }

  /**
   * Check an IP address against the IOC database.
   * Supports exact match and CIDR range matching.
   */
  checkIP(ip: string): IOCMatch | null {
    const normalized = ip.trim();

    // Exact match first (O(1)).
    const exact = this.ipSet.get(normalized);
    if (exact) {
      return this.toMatch(exact, ip);
    }

    // CIDR range scan.
    const num = ipToNumber(normalized);
    if (num === null) {
      return null;
    }

    for (const range of this.cidrRanges) {
      if ((num & range.mask) >>> 0 === range.network) {
        return this.toMatch(range.entry, ip);
      }
    }

    return null;
  }

  /**
   * Check a URL against the IOC database.
   * Checks pre-compiled URL patterns first, then extracts the host component
   * and checks it as a domain or IP.
   */
  checkURL(url: string): IOCMatch | null {
    // Check URL patterns.
    for (const { regex, entry } of this.urlPatterns) {
      if (regex.test(url)) {
        // Reset lastIndex for global/sticky regexes.
        regex.lastIndex = 0;
        return this.toMatch(entry, url);
      }
    }

    // Extract host from URL and check as domain/IP.
    const host = this.extractHost(url);
    if (host) {
      if (isIPv4(host)) {
        const ipMatch = this.checkIP(host);
        if (ipMatch) {
          return { ...ipMatch, matchedInput: url };
        }
      } else {
        const domainMatch = this.checkDomain(host);
        if (domainMatch) {
          return { ...domainMatch, matchedInput: url };
        }
      }
    }

    return null;
  }

  /**
   * Check a file hash (SHA-256) against the IOC database.
   */
  checkHash(hash: string): IOCMatch | null {
    const normalized = hash.toLowerCase().trim();
    const entry = this.hashSet.get(normalized);
    return entry ? this.toMatch(entry, hash) : null;
  }

  // -----------------------------------------------------------------------
  // Public API – Free-text scanning
  // -----------------------------------------------------------------------

  /**
   * Auto-detect and check all URLs, IPs, domains, and hashes in a free-text
   * string. Returns all matches found.
   */
  check(input: string): IOCMatch[] {
    const matches: IOCMatch[] = [];
    const seen = new Set<string>();

    // Extract and check URLs.
    const urls = input.match(IOCDatabase.URL_RE) ?? [];
    for (const url of urls) {
      const m = this.checkURL(url);
      if (m && !seen.has(`${m.type}:${m.indicator}`)) {
        seen.add(`${m.type}:${m.indicator}`);
        matches.push(m);
      }
    }

    // Extract and check bare IPs (not already covered by URLs).
    const ips = input.match(IOCDatabase.IP_RE) ?? [];
    for (const ip of ips) {
      if (isIPv4(ip)) {
        const m = this.checkIP(ip);
        if (m && !seen.has(`${m.type}:${m.indicator}`)) {
          seen.add(`${m.type}:${m.indicator}`);
          matches.push(m);
        }
      }
    }

    // Extract and check domains (not already covered by URLs).
    const domains = input.match(IOCDatabase.DOMAIN_RE) ?? [];
    for (const domain of domains) {
      // Skip anything that looks like an IP.
      if (isIPv4(domain)) {
        continue;
      }
      const m = this.checkDomain(domain);
      if (m && !seen.has(`${m.type}:${m.indicator}`)) {
        seen.add(`${m.type}:${m.indicator}`);
        matches.push(m);
      }
    }

    // Extract and check hashes.
    const hashes = input.match(IOCDatabase.HASH_RE) ?? [];
    for (const hash of hashes) {
      const m = this.checkHash(hash);
      if (m && !seen.has(`${m.type}:${m.indicator}`)) {
        seen.add(`${m.type}:${m.indicator}`);
        matches.push(m);
      }
    }

    return matches;
  }

  // -----------------------------------------------------------------------
  // Public API – CRUD
  // -----------------------------------------------------------------------

  /** Add a custom indicator to the database. */
  addIndicator(ioc: IOCEntry): void {
    // Remove existing entry with the same ID if present.
    if (this.entries.has(ioc.id)) {
      this.unindexEntry(this.entries.get(ioc.id)!);
    }
    this.indexEntry(ioc);
  }

  /** Remove an indicator by its ID. */
  removeIndicator(id: string): void {
    const entry = this.entries.get(id);
    if (entry) {
      this.unindexEntry(entry);
    }
  }

  // -----------------------------------------------------------------------
  // Public API – Stats
  // -----------------------------------------------------------------------

  /** Return aggregate statistics about the IOC database. */
  getStats(): IOCStats {
    const byType: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    for (const entry of this.entries.values()) {
      byType[entry.type] = (byType[entry.type] ?? 0) + 1;
      byCategory[entry.category] = (byCategory[entry.category] ?? 0) + 1;
    }

    return {
      totalIndicators: this.entries.size,
      byType,
      byCategory,
      lastUpdated: this.lastModified,
    };
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private toMatch(entry: IOCEntry, matchedInput: string): IOCMatch {
    return {
      indicator: entry.value,
      type: entry.type,
      category: entry.category,
      severity: entry.severity,
      description: entry.description,
      matchedInput,
    };
  }

  /** Extract the host (domain or IP) from a URL string. */
  private extractHost(url: string): string | null {
    try {
      // Strip userinfo (user:pass@) for URL constructor compatibility.
      const cleaned = url.replace(/\/\/[^@/]*@/, "//");
      const parsed = new URL(cleaned);
      return parsed.hostname || null;
    } catch {
      // Fallback: manual extraction.
      const match = /^https?:\/\/(?:[^@/]*@)?([^/:?#]+)/.exec(url);
      return match ? match[1] : null;
    }
  }
}
