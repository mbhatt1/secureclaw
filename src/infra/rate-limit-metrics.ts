// ---------------------------------------------------------------------------
// Rate Limit Metrics
//
// Tracks rate limiting events across the system, including rejections,
// per-endpoint statistics, and backpressure indicators.
// ---------------------------------------------------------------------------

import { createSubsystemLogger } from "../logging/subsystem.js";

const log = createSubsystemLogger("rate-limit-metrics");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RateLimitMetricsSnapshot = {
  // Lifetime counters
  totalRejections: number;
  totalAccepted: number;
  rejectionRate: number;

  // Per-endpoint breakdown
  byEndpoint: Record<
    string,
    {
      rejections: number;
      accepted: number;
      rejectionRate: number;
      lastRejectionAt: number;
      rejectionsLastMinute: number;
    }
  >;

  // Rejection reasons
  byReason: Record<string, number>;

  // Rate limit tracking (last minute)
  rejectionsLastMinute: number;
  acceptedLastMinute: number;

  // Top offenders
  topRejectedEndpoints: Array<{ endpoint: string; rejections: number }>;

  // Timestamps
  startedAtMs: number;
  lastEventAtMs: number;
  lastRejectionAtMs: number;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ONE_MINUTE_MS = 60 * 1000;
const TOP_ENDPOINTS_COUNT = 10;

// ---------------------------------------------------------------------------
// RateLimitMetrics
// ---------------------------------------------------------------------------

export class RateLimitMetrics {
  // -- Lifetime counters ---------------------------------------------------
  private _totalRejections: number = 0;
  private _totalAccepted: number = 0;

  // -- Per-endpoint tracking -----------------------------------------------
  private _endpointStats: Map<
    string,
    {
      rejections: number;
      accepted: number;
      lastRejectionAt: number;
      rejectionTimestamps: number[];
    }
  > = new Map();

  // -- Rejection reasons ---------------------------------------------------
  private _rejectionReasons: Map<string, number> = new Map();

  // -- Rolling windows for last-minute rates -------------------------------
  private _rejectionTimestamps: number[] = [];
  private _acceptedTimestamps: number[] = [];

  // -- Timestamps ----------------------------------------------------------
  private _startedAtMs: number;
  private _lastEventAtMs: number = 0;
  private _lastRejectionAtMs: number = 0;

  constructor() {
    this._startedAtMs = Date.now();
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Record a rate limit rejection event.
   */
  recordRejection(endpoint: string, reason?: string): void {
    const now = Date.now();
    this._lastEventAtMs = now;
    this._lastRejectionAtMs = now;
    this._totalRejections++;

    // Track globally
    this._rejectionTimestamps.push(now);

    // Track by endpoint
    this.ensureEndpoint(endpoint);
    const stats = this._endpointStats.get(endpoint)!;
    stats.rejections++;
    stats.lastRejectionAt = now;
    stats.rejectionTimestamps.push(now);

    // Track by reason
    if (reason) {
      this._rejectionReasons.set(reason, (this._rejectionReasons.get(reason) ?? 0) + 1);
    }

    log.warn(`rate limit exceeded`, {
      endpoint,
      reason,
      totalRejections: this._totalRejections,
    });
  }

  /**
   * Record an accepted request (within rate limits).
   */
  recordAccepted(endpoint: string): void {
    const now = Date.now();
    this._lastEventAtMs = now;
    this._totalAccepted++;

    // Track globally
    this._acceptedTimestamps.push(now);

    // Track by endpoint
    this.ensureEndpoint(endpoint);
    const stats = this._endpointStats.get(endpoint)!;
    stats.accepted++;
  }

  /**
   * Get current snapshot of all metrics.
   */
  getSnapshot(): RateLimitMetricsSnapshot {
    const now = Date.now();
    const oneMinuteAgo = now - ONE_MINUTE_MS;

    // Prune and count last-minute rates
    this.pruneTimestamps(this._rejectionTimestamps, oneMinuteAgo);
    this.pruneTimestamps(this._acceptedTimestamps, oneMinuteAgo);

    // Calculate overall rejection rate
    const total = this._totalRejections + this._totalAccepted;
    const rejectionRate = total > 0 ? (this._totalRejections / total) * 100 : 0;

    // Build per-endpoint breakdown
    const byEndpoint: RateLimitMetricsSnapshot["byEndpoint"] = {};
    const endpointRejections: Array<{ endpoint: string; rejections: number }> = [];

    for (const [endpoint, stats] of this._endpointStats) {
      // Prune old rejections for accurate last-minute count
      this.pruneTimestamps(stats.rejectionTimestamps, oneMinuteAgo);

      const endpointTotal = stats.rejections + stats.accepted;
      const endpointRejectionRate =
        endpointTotal > 0 ? (stats.rejections / endpointTotal) * 100 : 0;

      byEndpoint[endpoint] = {
        rejections: stats.rejections,
        accepted: stats.accepted,
        rejectionRate: endpointRejectionRate,
        lastRejectionAt: stats.lastRejectionAt,
        rejectionsLastMinute: stats.rejectionTimestamps.length,
      };

      if (stats.rejections > 0) {
        endpointRejections.push({ endpoint, rejections: stats.rejections });
      }
    }

    // Build rejection reasons breakdown
    const byReason: Record<string, number> = {};
    for (const [reason, count] of this._rejectionReasons) {
      byReason[reason] = count;
    }

    // Sort top rejected endpoints
    const topRejectedEndpoints = endpointRejections
      .toSorted((a, b) => b.rejections - a.rejections)
      .slice(0, TOP_ENDPOINTS_COUNT);

    return {
      totalRejections: this._totalRejections,
      totalAccepted: this._totalAccepted,
      rejectionRate,
      byEndpoint,
      byReason,
      rejectionsLastMinute: this._rejectionTimestamps.length,
      acceptedLastMinute: this._acceptedTimestamps.length,
      topRejectedEndpoints,
      startedAtMs: this._startedAtMs,
      lastEventAtMs: this._lastEventAtMs,
      lastRejectionAtMs: this._lastRejectionAtMs,
    };
  }

  /**
   * Reset all metrics.
   */
  reset(): void {
    this._totalRejections = 0;
    this._totalAccepted = 0;
    this._endpointStats.clear();
    this._rejectionReasons.clear();
    this._rejectionTimestamps = [];
    this._acceptedTimestamps = [];
    this._startedAtMs = Date.now();
    this._lastEventAtMs = 0;
    this._lastRejectionAtMs = 0;
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /**
   * Ensure an endpoint entry exists in the stats map.
   */
  private ensureEndpoint(endpoint: string): void {
    if (!this._endpointStats.has(endpoint)) {
      this._endpointStats.set(endpoint, {
        rejections: 0,
        accepted: 0,
        lastRejectionAt: 0,
        rejectionTimestamps: [],
      });
    }
  }

  /**
   * Remove timestamps older than cutoff from a rolling-window array.
   */
  private pruneTimestamps(arr: number[], cutoff: number): void {
    let dropCount = 0;
    while (dropCount < arr.length && arr[dropCount] < cutoff) {
      dropCount++;
    }
    if (dropCount > 0) {
      arr.splice(0, dropCount);
    }
  }
}

// ---------------------------------------------------------------------------
// Global instance
// ---------------------------------------------------------------------------

let globalMetrics: RateLimitMetrics | null = null;

/**
 * Get or create the global rate limit metrics instance.
 */
export function getRateLimitMetrics(): RateLimitMetrics {
  if (!globalMetrics) {
    globalMetrics = new RateLimitMetrics();
  }
  return globalMetrics;
}

/**
 * Shorthand functions for recording metrics.
 */
export const recordRateLimitRejection = (endpoint: string, reason?: string): void =>
  getRateLimitMetrics().recordRejection(endpoint, reason);

export const recordRateLimitAccepted = (endpoint: string): void =>
  getRateLimitMetrics().recordAccepted(endpoint);
