// ---------------------------------------------------------------------------
// Security Coach -- Alert Throttle & Deduplication
// ---------------------------------------------------------------------------
// Prevents alert fatigue by enforcing per-pattern cooldowns, global rate
// limits, deduplication of identical alerts, and a cap on pending alerts.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ThrottleConfig = {
  /** Cooldown per pattern ID (ms). Same pattern can't alert again within this window. Default: 60_000 (1 min) */
  patternCooldownMs: number;
  /** Max pending alerts at any time. Oldest non-blocking alerts are evicted. Default: 50 */
  maxPendingAlerts: number;
  /** Global cooldown: min ms between any two alerts. Default: 2_000 (2 sec) */
  globalCooldownMs: number;
  /** Dedup window: identical alerts (same patternId + same context) within this window are suppressed. Default: 300_000 (5 min) */
  dedupWindowMs: number;
};

export const DEFAULT_THROTTLE_CONFIG: ThrottleConfig = {
  patternCooldownMs: 60_000,
  maxPendingAlerts: 50,
  globalCooldownMs: 2_000,
  dedupWindowMs: 300_000,
};

export type ThrottleStats = {
  totalSuppressed: number;
  suppressedByPattern: number;
  suppressedByGlobal: number;
  suppressedByDedup: number;
  suppressedByOverflow: number;
  lastAlertAtMs: number;
  cooldownEntries: number;
  dedupEntries: number;
};

// ---------------------------------------------------------------------------
// Context key helper
// ---------------------------------------------------------------------------

/**
 * Build a deduplication key from alert context fields.
 *
 * The key is a deterministic string derived from the combination of
 * `toolName`, `command`, `channelId`, and the first 100 characters of
 * `content` (if present). Fields that are `undefined` are omitted so that
 * two inputs that differ only in missing-vs-empty fields produce the same
 * key.
 *
 * Uses a null byte (`\0`) as the separator between parts. This prevents
 * key forgery via `|` injection in values (e.g. a command containing `|`
 * could shift dedup boundaries when `|` was used as separator).
 */
export function buildContextKey(input: {
  toolName?: string;
  command?: string;
  channelId?: string;
  content?: string;
}): string {
  const parts: string[] = [];

  if (input.toolName !== undefined) {
    parts.push(`tool=${input.toolName}`);
  }
  if (input.command !== undefined) {
    parts.push(`cmd=${input.command}`);
  }
  if (input.channelId !== undefined) {
    parts.push(`ch=${input.channelId}`);
  }
  if (input.content !== undefined) {
    parts.push(`content=${input.content.slice(0, 100)}`);
  }

  return parts.join("\0");
}

// ---------------------------------------------------------------------------
// AlertThrottle
// ---------------------------------------------------------------------------

export class AlertThrottle {
  private config: ThrottleConfig;

  /** patternId -> timestamp of last alert for that pattern */
  private patternCooldowns: Map<string, number> = new Map();

  /** "patternId\0contextKey" -> timestamp of last alert for that combo */
  private dedupMap: Map<string, number> = new Map();

  /** Timestamp of the most recent alert (any pattern) */
  private lastAlertAt: number = 0;

  /** Current number of pending alerts as reported by the engine */
  private pendingCount: number = 0;

  // -- Stat counters -------------------------------------------------------
  private statTotalSuppressed: number = 0;
  private statSuppressedByPattern: number = 0;
  private statSuppressedByGlobal: number = 0;
  private statSuppressedByDedup: number = 0;
  private statSuppressedByOverflow: number = 0;

  constructor(config?: Partial<ThrottleConfig>) {
    this.config = { ...DEFAULT_THROTTLE_CONFIG, ...config };
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Returns `true` if the alert should be **suppressed** (throttled).
   *
   * Checks are evaluated in the following order:
   * 1. Dedup -- same patternId + same contextKey within `dedupWindowMs`.
   * 2. Pattern cooldown -- same patternId within `patternCooldownMs`.
   * 3. Global cooldown -- any alert within `globalCooldownMs`.
   * 4. Overflow -- pending count already at or above `maxPendingAlerts`.
   *
   * The first matching rule short-circuits and increments its counter.
   */
  shouldThrottle(patternId: string, contextKey?: string): boolean {
    const now = Date.now();

    // 1. Dedup check
    if (contextKey !== undefined) {
      const dedupKey = this.buildDedupKey(patternId, contextKey);
      const lastDedup = this.dedupMap.get(dedupKey);
      if (lastDedup !== undefined && now - lastDedup < this.config.dedupWindowMs) {
        this.statTotalSuppressed++;
        this.statSuppressedByDedup++;
        return true;
      }
    }

    // 2. Pattern cooldown check
    const lastPattern = this.patternCooldowns.get(patternId);
    if (lastPattern !== undefined && now - lastPattern < this.config.patternCooldownMs) {
      this.statTotalSuppressed++;
      this.statSuppressedByPattern++;
      return true;
    }

    // 3. Global cooldown check
    if (this.lastAlertAt > 0 && now - this.lastAlertAt < this.config.globalCooldownMs) {
      this.statTotalSuppressed++;
      this.statSuppressedByGlobal++;
      return true;
    }

    // 4. Overflow check
    if (this.pendingCount >= this.config.maxPendingAlerts) {
      this.statTotalSuppressed++;
      this.statSuppressedByOverflow++;
      return true;
    }

    return false;
  }

  /**
   * Record that an alert was actually emitted for `patternId` (and
   * optionally a specific `contextKey`).
   *
   * This updates the pattern cooldown, the global cooldown, and the dedup
   * map so that subsequent calls to `shouldThrottle` behave correctly.
   */
  recordAlert(patternId: string, contextKey?: string): void {
    const now = Date.now();

    this.patternCooldowns.set(patternId, now);
    this.lastAlertAt = now;

    if (contextKey !== undefined) {
      const dedupKey = this.buildDedupKey(patternId, contextKey);
      this.dedupMap.set(dedupKey, now);
    }
  }

  /** Return the current pending alert count. */
  getPendingCount(): number {
    return this.pendingCount;
  }

  /**
   * Update the pending alert count (typically called by the engine after
   * alerts are added or resolved).
   */
  setPendingCount(count: number): void {
    this.pendingCount = count;
  }

  /**
   * Returns `true` when the pending count has reached or exceeded the
   * configured `maxPendingAlerts` limit, signalling that the engine should
   * evict old non-blocking alerts.
   */
  shouldEvict(): boolean {
    return this.pendingCount >= this.config.maxPendingAlerts;
  }

  /**
   * Remove expired entries from the pattern-cooldown and dedup maps.
   *
   * Call this periodically (e.g. on a timer or after every N evaluations)
   * to prevent unbounded memory growth.
   */
  cleanup(): void {
    const now = Date.now();

    for (const [patternId, timestamp] of this.patternCooldowns) {
      if (now - timestamp >= this.config.patternCooldownMs) {
        this.patternCooldowns.delete(patternId);
      }
    }

    for (const [dedupKey, timestamp] of this.dedupMap) {
      if (now - timestamp >= this.config.dedupWindowMs) {
        this.dedupMap.delete(dedupKey);
      }
    }
  }

  /** Return a snapshot of throttle/suppression statistics. */
  getStats(): ThrottleStats {
    return {
      totalSuppressed: this.statTotalSuppressed,
      suppressedByPattern: this.statSuppressedByPattern,
      suppressedByGlobal: this.statSuppressedByGlobal,
      suppressedByDedup: this.statSuppressedByDedup,
      suppressedByOverflow: this.statSuppressedByOverflow,
      lastAlertAtMs: this.lastAlertAt,
      cooldownEntries: this.patternCooldowns.size,
      dedupEntries: this.dedupMap.size,
    };
  }

  /** Merge partial configuration updates into the active config. */
  updateConfig(partial: Partial<ThrottleConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /**
   * Combine patternId and contextKey into a single map key for the dedup
   * map. Uses a null byte separator to avoid collisions between pattern IDs
   * and context keys that happen to contain the same characters.
   */
  private buildDedupKey(patternId: string, contextKey: string): string {
    return `${patternId}\0${contextKey}`;
  }
}
