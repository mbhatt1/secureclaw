// ---------------------------------------------------------------------------
// Cost Budget Enforcement
//
// Enforces spending limits (daily, monthly, per-session) with warning
// thresholds and auto-cutoff. Budget state is stored in-memory with
// periodic JSON snapshots for crash recovery.
// ---------------------------------------------------------------------------

import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BudgetConfig = {
  /** Maximum daily spend in USD. Default: 50.0 */
  dailyLimitUsd: number;
  /** Maximum monthly spend in USD. Default: 500.0 */
  monthlyLimitUsd: number;
  /** Maximum per-session spend in USD. Default: 10.0 */
  sessionLimitUsd: number;
  /** Percentage of limit at which to emit a warning. Default: 80 */
  warningThresholdPct: number;
};

export type BudgetCheckResult = {
  /** Whether the request is allowed to proceed. */
  allowed: boolean;
  /** Human-readable reason when the request is denied or at warning level. */
  reason?: string;
  /** Current spend for the scope that triggered the decision. */
  currentSpend: number;
  /** Limit for the scope that triggered the decision. */
  limit: number;
  /** Percentage of the limit already used (0-100+). */
  percentUsed: number;
};

export type BudgetStatus = {
  dailySpendUsd: number;
  dailyLimitUsd: number;
  dailyPctUsed: number;

  monthlySpendUsd: number;
  monthlyLimitUsd: number;
  monthlyPctUsed: number;

  sessionSpends: Map<string, number>;

  isWarning: boolean;
  isExceeded: boolean;
};

// ---------------------------------------------------------------------------
// Internal snapshot type (serialisable subset of in-memory state)
// ---------------------------------------------------------------------------

type BudgetSnapshot = {
  dailySpendUsd: number;
  monthlySpendUsd: number;
  sessionSpends: Record<string, number>;
  dayKey: string;
  monthKey: string;
  savedAtMs: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: BudgetConfig = {
  dailyLimitUsd: 50.0,
  monthlyLimitUsd: 500.0,
  sessionLimitUsd: 10.0,
  warningThresholdPct: 80,
};

const pct = (spend: number, limit: number): number => (limit > 0 ? (spend / limit) * 100 : 0);

const formatDayKey = (date: Date): string =>
  date.toLocaleDateString("en-CA", { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });

const formatMonthKey = (date: Date): string => formatDayKey(date).slice(0, 7); // YYYY-MM

// ---------------------------------------------------------------------------
// CostBudget
// ---------------------------------------------------------------------------

export class CostBudget {
  // -- Configuration -------------------------------------------------------
  private readonly _config: BudgetConfig;

  // -- In-memory spend accumulators ----------------------------------------
  private _dailySpendUsd: number = 0;
  private _monthlySpendUsd: number = 0;
  private _sessionSpends: Map<string, number> = new Map();

  // -- Day/month boundary tracking -----------------------------------------
  private _dayKey: string;
  private _monthKey: string;

  // -- Callbacks -----------------------------------------------------------
  private _warningCallbacks: Array<(status: BudgetStatus) => void> = [];
  private _exceededCallbacks: Array<(status: BudgetStatus) => void> = [];

  // -- Snapshot persistence ------------------------------------------------
  private _snapshotPath: string | null = null;
  private _snapshotIntervalMs: number = 30_000; // 30 s
  private _snapshotTimer: ReturnType<typeof setInterval> | null = null;
  private _dirty: boolean = false;

  constructor(config?: Partial<BudgetConfig>, snapshotDir?: string) {
    this._config = { ...DEFAULT_CONFIG, ...config };

    const now = new Date();
    this._dayKey = formatDayKey(now);
    this._monthKey = formatMonthKey(now);

    // Optionally load a persisted snapshot
    if (snapshotDir) {
      this._snapshotPath = path.join(snapshotDir, "cost-budget-snapshot.json");
      this.loadSnapshot();
      this.startSnapshotTimer();
    }
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Check whether a request with the given estimated cost is within budget.
   * Returns a {@link BudgetCheckResult} describing the verdict.
   */
  checkBudget(sessionId: string, estimatedCostUsd: number): BudgetCheckResult {
    this.rolloverIfNeeded();

    // --- Session limit ---------------------------------------------------
    const sessionSpend = this._sessionSpends.get(sessionId) ?? 0;
    const projectedSession = sessionSpend + estimatedCostUsd;
    if (projectedSession > this._config.sessionLimitUsd) {
      return {
        allowed: false,
        reason: `Session budget exceeded: $${sessionSpend.toFixed(4)} spent + $${estimatedCostUsd.toFixed(4)} estimated exceeds $${this._config.sessionLimitUsd.toFixed(2)} session limit`,
        currentSpend: sessionSpend,
        limit: this._config.sessionLimitUsd,
        percentUsed: pct(projectedSession, this._config.sessionLimitUsd),
      };
    }

    // --- Daily limit -----------------------------------------------------
    const projectedDaily = this._dailySpendUsd + estimatedCostUsd;
    if (projectedDaily > this._config.dailyLimitUsd) {
      return {
        allowed: false,
        reason: `Daily budget exceeded: $${this._dailySpendUsd.toFixed(4)} spent + $${estimatedCostUsd.toFixed(4)} estimated exceeds $${this._config.dailyLimitUsd.toFixed(2)} daily limit`,
        currentSpend: this._dailySpendUsd,
        limit: this._config.dailyLimitUsd,
        percentUsed: pct(projectedDaily, this._config.dailyLimitUsd),
      };
    }

    // --- Monthly limit ---------------------------------------------------
    const projectedMonthly = this._monthlySpendUsd + estimatedCostUsd;
    if (projectedMonthly > this._config.monthlyLimitUsd) {
      return {
        allowed: false,
        reason: `Monthly budget exceeded: $${this._monthlySpendUsd.toFixed(4)} spent + $${estimatedCostUsd.toFixed(4)} estimated exceeds $${this._config.monthlyLimitUsd.toFixed(2)} monthly limit`,
        currentSpend: this._monthlySpendUsd,
        limit: this._config.monthlyLimitUsd,
        percentUsed: pct(projectedMonthly, this._config.monthlyLimitUsd),
      };
    }

    // All limits OK — return the tightest margin for the caller's awareness
    const dailyPct = pct(projectedDaily, this._config.dailyLimitUsd);
    const monthlyPct = pct(projectedMonthly, this._config.monthlyLimitUsd);
    const sessionPct = pct(projectedSession, this._config.sessionLimitUsd);
    const maxPct = Math.max(dailyPct, monthlyPct, sessionPct);

    // Pick the scope with the highest utilisation for the response
    let currentSpend: number;
    let limit: number;
    if (sessionPct >= dailyPct && sessionPct >= monthlyPct) {
      currentSpend = sessionSpend;
      limit = this._config.sessionLimitUsd;
    } else if (dailyPct >= monthlyPct) {
      currentSpend = this._dailySpendUsd;
      limit = this._config.dailyLimitUsd;
    } else {
      currentSpend = this._monthlySpendUsd;
      limit = this._config.monthlyLimitUsd;
    }

    return {
      allowed: true,
      currentSpend,
      limit,
      percentUsed: maxPct,
    };
  }

  /**
   * Record actual spend after a request completes.
   * Fires warning/exceeded callbacks as appropriate.
   */
  recordSpend(sessionId: string, costUsd: number): void {
    this.rolloverIfNeeded();

    this._dailySpendUsd += costUsd;
    this._monthlySpendUsd += costUsd;
    this._sessionSpends.set(sessionId, (this._sessionSpends.get(sessionId) ?? 0) + costUsd);
    this._dirty = true;

    // Check and fire callbacks
    const status = this.getStatus();

    if (status.isExceeded) {
      for (const cb of this._exceededCallbacks) {
        try {
          cb(status);
        } catch {
          // Swallow callback errors to avoid disrupting the caller
        }
      }
    } else if (status.isWarning) {
      for (const cb of this._warningCallbacks) {
        try {
          cb(status);
        } catch {
          // Swallow callback errors
        }
      }
    }
  }

  /**
   * Return the current budget status across all scopes.
   */
  getStatus(): BudgetStatus {
    this.rolloverIfNeeded();

    const dailyPct = pct(this._dailySpendUsd, this._config.dailyLimitUsd);
    const monthlyPct = pct(this._monthlySpendUsd, this._config.monthlyLimitUsd);

    // Check per-session percentages as well
    let anySessionWarning = false;
    let anySessionExceeded = false;
    for (const [, spend] of this._sessionSpends) {
      const sp = pct(spend, this._config.sessionLimitUsd);
      if (sp >= 100) {
        anySessionExceeded = true;
      } else if (sp >= this._config.warningThresholdPct) {
        anySessionWarning = true;
      }
    }

    const isExceeded = dailyPct >= 100 || monthlyPct >= 100 || anySessionExceeded;
    const isWarning =
      !isExceeded &&
      (dailyPct >= this._config.warningThresholdPct ||
        monthlyPct >= this._config.warningThresholdPct ||
        anySessionWarning);

    return {
      dailySpendUsd: this._dailySpendUsd,
      dailyLimitUsd: this._config.dailyLimitUsd,
      dailyPctUsed: dailyPct,

      monthlySpendUsd: this._monthlySpendUsd,
      monthlyLimitUsd: this._config.monthlyLimitUsd,
      monthlyPctUsed: monthlyPct,

      sessionSpends: new Map(this._sessionSpends),

      isWarning,
      isExceeded,
    };
  }

  /**
   * Reset the daily spend accumulator.
   * Called externally at day boundary or for testing.
   */
  resetDaily(): void {
    this._dailySpendUsd = 0;
    this._dayKey = formatDayKey(new Date());
    this._dirty = true;
  }

  /**
   * Reset the monthly spend accumulator.
   * Called externally at month boundary or for testing.
   */
  resetMonthly(): void {
    this._monthlySpendUsd = 0;
    this._monthKey = formatMonthKey(new Date());
    this._dirty = true;
  }

  /**
   * Register a callback invoked when any scope reaches the warning threshold.
   */
  onBudgetWarning(callback: (status: BudgetStatus) => void): void {
    this._warningCallbacks.push(callback);
  }

  /**
   * Register a callback invoked when any scope exceeds its limit.
   */
  onBudgetExceeded(callback: (status: BudgetStatus) => void): void {
    this._exceededCallbacks.push(callback);
  }

  /**
   * Stop the periodic snapshot timer (useful for clean shutdown / tests).
   */
  dispose(): void {
    if (this._snapshotTimer !== null) {
      clearInterval(this._snapshotTimer);
      this._snapshotTimer = null;
    }
    // Flush any pending changes
    if (this._dirty) {
      this.saveSnapshot();
    }
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  /**
   * Automatically roll over accumulators when the calendar day or month
   * changes between calls.
   */
  private rolloverIfNeeded(): void {
    const now = new Date();
    const currentDay = formatDayKey(now);
    const currentMonth = formatMonthKey(now);

    if (currentMonth !== this._monthKey) {
      this._monthlySpendUsd = 0;
      this._monthKey = currentMonth;
      // Month change implies day change too
      this._dailySpendUsd = 0;
      this._dayKey = currentDay;
      this._dirty = true;
    } else if (currentDay !== this._dayKey) {
      this._dailySpendUsd = 0;
      this._dayKey = currentDay;
      this._dirty = true;
    }
  }

  // -- Snapshot persistence ------------------------------------------------

  private loadSnapshot(): void {
    if (!this._snapshotPath) {
      return;
    }
    try {
      const raw = fs.readFileSync(this._snapshotPath, "utf-8");
      const snap = JSON.parse(raw) as BudgetSnapshot;

      // Only restore if the snapshot is from the same day/month
      const now = new Date();
      if (snap.dayKey === formatDayKey(now)) {
        this._dailySpendUsd = snap.dailySpendUsd;
      }
      if (snap.monthKey === formatMonthKey(now)) {
        this._monthlySpendUsd = snap.monthlySpendUsd;
      }
      if (snap.sessionSpends) {
        for (const [id, cost] of Object.entries(snap.sessionSpends)) {
          this._sessionSpends.set(id, cost);
        }
      }
    } catch {
      // Snapshot missing or corrupt — start fresh
    }
  }

  private saveSnapshot(): void {
    if (!this._snapshotPath) {
      return;
    }
    const snap: BudgetSnapshot = {
      dailySpendUsd: this._dailySpendUsd,
      monthlySpendUsd: this._monthlySpendUsd,
      sessionSpends: Object.fromEntries(this._sessionSpends),
      dayKey: this._dayKey,
      monthKey: this._monthKey,
      savedAtMs: Date.now(),
    };
    try {
      const dir = path.dirname(this._snapshotPath);
      fs.mkdirSync(dir, { recursive: true });
      const tmpPath = this._snapshotPath + ".tmp";
      fs.writeFileSync(tmpPath, JSON.stringify(snap, null, 2), "utf-8");
      fs.renameSync(tmpPath, this._snapshotPath);
      this._dirty = false;
    } catch {
      // Best-effort — in-memory state is the source of truth
    }
  }

  private startSnapshotTimer(): void {
    this._snapshotTimer = setInterval(() => {
      if (this._dirty) {
        this.saveSnapshot();
      }
    }, this._snapshotIntervalMs);

    // Do not prevent process exit
    if (typeof this._snapshotTimer === "object" && "unref" in this._snapshotTimer) {
      this._snapshotTimer.unref();
    }
  }
}
