// ---------------------------------------------------------------------------
// Security Coach -- Runtime Metrics Collection
//
// Tracks runtime metrics about the security coach's performance, including
// lifetime counters, hourly rates, response time percentiles, and per-category
// / per-severity breakdowns. All data is held in memory (no disk persistence)
// and is intended to be consumed by status dashboards and SIEM integrations.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CoachMetricsSnapshot = {
  // Lifetime counters
  totalAlerts: number;
  totalBlocked: number;
  totalAllowed: number;
  totalDenied: number;
  totalExpired: number;
  totalAutoAllowed: number; // by rule
  totalAutoDenied: number; // by rule
  totalTips: number;
  totalHygieneScans: number;
  totalHygieneFindings: number;

  // Rate metrics (last hour)
  alertsLastHour: number;
  blocksLastHour: number;

  // Response time
  avgDecisionTimeMs: number;
  medianDecisionTimeMs: number;

  // Per-category breakdown
  byCategory: Record<string, { alerts: number; blocked: number; allowed: number }>;
  // Per-severity breakdown
  bySeverity: Record<string, { alerts: number; blocked: number; allowed: number }>;

  // Top patterns
  topPatterns: Array<{ patternId: string; count: number }>;

  // Timestamps
  startedAtMs: number;
  lastAlertAtMs: number;
  lastDecisionAtMs: number;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ONE_HOUR_MS = 60 * 60 * 1000;

/** Maximum number of decision times retained for avg/median calculation. */
const MAX_DECISION_TIMES = 1000;

/** Number of top patterns to include in snapshots. */
const TOP_PATTERNS_COUNT = 20;

// ---------------------------------------------------------------------------
// CoachMetrics
// ---------------------------------------------------------------------------

export class CoachMetrics {
  // -- Lifetime counters ---------------------------------------------------
  private _totalAlerts: number = 0;
  private _totalBlocked: number = 0;
  private _totalAllowed: number = 0;
  private _totalDenied: number = 0;
  private _totalExpired: number = 0;
  private _totalAutoAllowed: number = 0;
  private _totalAutoDenied: number = 0;
  private _totalTips: number = 0;
  private _totalHygieneScans: number = 0;
  private _totalHygieneFindings: number = 0;

  // -- Rolling windows for last-hour rates ---------------------------------
  private _alertTimestamps: number[] = [];
  private _blockTimestamps: number[] = [];

  // -- Decision time tracking (circular buffer) ----------------------------
  private _decisionTimes: number[] = [];
  private _decisionTimesIndex: number = 0;
  private _decisionTimesCount: number = 0;

  // -- Per-category / per-severity breakdowns ------------------------------
  private _byCategory: Map<string, { alerts: number; blocked: number; allowed: number }> =
    new Map();
  private _bySeverity: Map<string, { alerts: number; blocked: number; allowed: number }> =
    new Map();

  // -- Pattern frequency ---------------------------------------------------
  private _patternFrequency: Map<string, number> = new Map();

  // -- Timestamps ----------------------------------------------------------
  private _startedAtMs: number;
  private _lastAlertAtMs: number = 0;
  private _lastDecisionAtMs: number = 0;

  constructor() {
    this._startedAtMs = Date.now();
    this._decisionTimes = new Array<number>(MAX_DECISION_TIMES).fill(0);
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Record that a new alert was created by the security coach engine.
   */
  recordAlert(opts: {
    level: string;
    severity: string;
    category: string;
    patternIds: string[];
  }): void {
    const now = Date.now();

    this._totalAlerts++;
    this._lastAlertAtMs = now;

    // Rolling window for last-hour rate.
    this._alertTimestamps.push(now);

    if (opts.level === "block") {
      this._totalBlocked++;
      this._blockTimestamps.push(now);
    }

    // Per-category.
    this.ensureCategory(opts.category);
    const catEntry = this._byCategory.get(opts.category)!;
    catEntry.alerts++;
    if (opts.level === "block") {
      catEntry.blocked++;
    }

    // Per-severity.
    this.ensureSeverity(opts.severity);
    const sevEntry = this._bySeverity.get(opts.severity)!;
    sevEntry.alerts++;
    if (opts.level === "block") {
      sevEntry.blocked++;
    }

    // Pattern frequency.
    for (const patternId of opts.patternIds) {
      this._patternFrequency.set(
        patternId,
        (this._patternFrequency.get(patternId) ?? 0) + 1,
      );
    }
  }

  /**
   * Record a user decision on an alert.
   */
  recordDecision(opts: {
    decision: string;
    durationMs: number;
    severity: string;
    category: string;
  }): void {
    const now = Date.now();
    this._lastDecisionAtMs = now;

    // Classify decision.
    const normalized = opts.decision.toLowerCase();
    if (normalized === "allow-once" || normalized === "allow-always") {
      this._totalAllowed++;

      // Per-category / per-severity allowed.
      this.ensureCategory(opts.category);
      this._byCategory.get(opts.category)!.allowed++;

      this.ensureSeverity(opts.severity);
      this._bySeverity.get(opts.severity)!.allowed++;
    } else if (normalized === "deny") {
      this._totalDenied++;

      // Per-category / per-severity blocked (deny = blocked by user).
      this.ensureCategory(opts.category);
      this._byCategory.get(opts.category)!.blocked++;

      this.ensureSeverity(opts.severity);
      this._bySeverity.get(opts.severity)!.blocked++;
    } else if (normalized === "expired") {
      this._totalExpired++;
    }

    // Record decision time in circular buffer.
    this._decisionTimes[this._decisionTimesIndex] = opts.durationMs;
    this._decisionTimesIndex =
      (this._decisionTimesIndex + 1) % MAX_DECISION_TIMES;
    if (this._decisionTimesCount < MAX_DECISION_TIMES) {
      this._decisionTimesCount++;
    }
  }

  /**
   * Record an automatic decision made by a saved rule.
   */
  recordAutoDecision(opts: {
    decision: "allow" | "deny";
    patternId: string;
  }): void {
    if (opts.decision === "allow") {
      this._totalAutoAllowed++;
    } else {
      this._totalAutoDenied++;
    }

    // Pattern frequency.
    this._patternFrequency.set(
      opts.patternId,
      (this._patternFrequency.get(opts.patternId) ?? 0) + 1,
    );
  }

  /**
   * Record that an educational tip was shown.
   */
  recordTip(): void {
    this._totalTips++;
  }

  /**
   * Record that a hygiene scan was executed.
   */
  recordHygieneScan(findingsCount: number): void {
    this._totalHygieneScans++;
    this._totalHygieneFindings += findingsCount;
  }

  /**
   * Return a point-in-time snapshot of all metrics.
   */
  getSnapshot(): CoachMetricsSnapshot {
    const now = Date.now();
    const oneHourAgo = now - ONE_HOUR_MS;

    // Prune and count last-hour rates.
    this.pruneTimestamps(this._alertTimestamps, oneHourAgo);
    this.pruneTimestamps(this._blockTimestamps, oneHourAgo);

    // Per-category map -> record.
    const byCategory: Record<
      string,
      { alerts: number; blocked: number; allowed: number }
    > = {};
    for (const [key, value] of this._byCategory) {
      byCategory[key] = { ...value };
    }

    // Per-severity map -> record.
    const bySeverity: Record<
      string,
      { alerts: number; blocked: number; allowed: number }
    > = {};
    for (const [key, value] of this._bySeverity) {
      bySeverity[key] = { ...value };
    }

    // Top patterns.
    const topPatterns = Array.from(this._patternFrequency.entries())
      .map(([patternId, count]) => ({ patternId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, TOP_PATTERNS_COUNT);

    return {
      totalAlerts: this._totalAlerts,
      totalBlocked: this._totalBlocked,
      totalAllowed: this._totalAllowed,
      totalDenied: this._totalDenied,
      totalExpired: this._totalExpired,
      totalAutoAllowed: this._totalAutoAllowed,
      totalAutoDenied: this._totalAutoDenied,
      totalTips: this._totalTips,
      totalHygieneScans: this._totalHygieneScans,
      totalHygieneFindings: this._totalHygieneFindings,

      alertsLastHour: this._alertTimestamps.length,
      blocksLastHour: this._blockTimestamps.length,

      avgDecisionTimeMs: this.computeAvgDecisionTime(),
      medianDecisionTimeMs: this.computeMedianDecisionTime(),

      byCategory,
      bySeverity,

      topPatterns,

      startedAtMs: this._startedAtMs,
      lastAlertAtMs: this._lastAlertAtMs,
      lastDecisionAtMs: this._lastDecisionAtMs,
    };
  }

  /**
   * Reset all metrics to their initial state.
   */
  reset(): void {
    this._totalAlerts = 0;
    this._totalBlocked = 0;
    this._totalAllowed = 0;
    this._totalDenied = 0;
    this._totalExpired = 0;
    this._totalAutoAllowed = 0;
    this._totalAutoDenied = 0;
    this._totalTips = 0;
    this._totalHygieneScans = 0;
    this._totalHygieneFindings = 0;

    this._alertTimestamps = [];
    this._blockTimestamps = [];

    this._decisionTimes = new Array<number>(MAX_DECISION_TIMES).fill(0);
    this._decisionTimesIndex = 0;
    this._decisionTimesCount = 0;

    this._byCategory.clear();
    this._bySeverity.clear();
    this._patternFrequency.clear();

    this._startedAtMs = Date.now();
    this._lastAlertAtMs = 0;
    this._lastDecisionAtMs = 0;
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /**
   * Ensure a category entry exists in the breakdown map.
   */
  private ensureCategory(category: string): void {
    if (!this._byCategory.has(category)) {
      this._byCategory.set(category, { alerts: 0, blocked: 0, allowed: 0 });
    }
  }

  /**
   * Ensure a severity entry exists in the breakdown map.
   */
  private ensureSeverity(severity: string): void {
    if (!this._bySeverity.has(severity)) {
      this._bySeverity.set(severity, { alerts: 0, blocked: 0, allowed: 0 });
    }
  }

  /**
   * Remove timestamps older than `cutoff` from a rolling-window array.
   *
   * Mutates the array in place. Since timestamps are appended in order,
   * we can efficiently drop leading entries.
   */
  private pruneTimestamps(arr: number[], cutoff: number): void {
    let dropCount = 0;
    while (dropCount < arr.length && arr[dropCount]! < cutoff) {
      dropCount++;
    }
    if (dropCount > 0) {
      arr.splice(0, dropCount);
    }
  }

  /**
   * Compute the average decision time from the circular buffer.
   */
  private computeAvgDecisionTime(): number {
    if (this._decisionTimesCount === 0) {
      return 0;
    }

    let sum = 0;
    for (let i = 0; i < this._decisionTimesCount; i++) {
      sum += this._decisionTimes[i]!;
    }
    return Math.round(sum / this._decisionTimesCount);
  }

  /**
   * Compute the median decision time from the circular buffer.
   */
  private computeMedianDecisionTime(): number {
    if (this._decisionTimesCount === 0) {
      return 0;
    }

    // Extract the active portion and sort for median calculation.
    const active = this._decisionTimes.slice(0, this._decisionTimesCount);
    active.sort((a, b) => a - b);

    const mid = Math.floor(active.length / 2);
    if (active.length % 2 === 0) {
      return Math.round((active[mid - 1]! + active[mid]!) / 2);
    }
    return active[mid]!;
  }
}
