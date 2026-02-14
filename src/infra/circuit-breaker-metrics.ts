// ---------------------------------------------------------------------------
// Circuit Breaker Metrics
//
// Tracks circuit breaker state transitions, failure rates, and recovery times.
// Provides observability for retry/failover logic across the system.
// ---------------------------------------------------------------------------

import { createSubsystemLogger } from "../logging/subsystem.js";

const log = createSubsystemLogger("circuit-breaker-metrics");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CircuitBreakerState = "closed" | "open" | "half-open";

export type CircuitBreakerMetricsSnapshot = {
  // State counters
  stateTransitions: Record<string, number>;
  currentStates: Record<string, CircuitBreakerState>;

  // Failure tracking
  totalFailures: number;
  totalSuccesses: number;
  failureRate: number;

  // Per-circuit breakdown
  byCircuit: Record<
    string,
    {
      state: CircuitBreakerState;
      transitions: number;
      failures: number;
      successes: number;
      failureRate: number;
      lastTransitionAt: number;
      lastFailureAt: number;
      recoveryTimeMs: number | null;
    }
  >;

  // Timing
  avgRecoveryTimeMs: number;
  maxRecoveryTimeMs: number;

  // Timestamps
  startedAtMs: number;
  lastEventAtMs: number;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FAILURE_RATE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// ---------------------------------------------------------------------------
// CircuitBreakerMetrics
// ---------------------------------------------------------------------------

export class CircuitBreakerMetrics {
  // -- State tracking ------------------------------------------------------
  private _stateTransitions: Map<string, number> = new Map();
  private _currentStates: Map<string, CircuitBreakerState> = new Map();

  // -- Failure tracking ----------------------------------------------------
  private _totalFailures: number = 0;
  private _totalSuccesses: number = 0;

  // -- Per-circuit tracking ------------------------------------------------
  private _circuitStats: Map<
    string,
    {
      state: CircuitBreakerState;
      transitions: number;
      failures: number;
      successes: number;
      lastTransitionAt: number;
      lastFailureAt: number;
      openedAt: number | null;
      closedAt: number | null;
      failureTimestamps: number[];
    }
  > = new Map();

  // -- Timestamps ----------------------------------------------------------
  private _startedAtMs: number;
  private _lastEventAtMs: number = 0;

  constructor() {
    this._startedAtMs = Date.now();
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Record a circuit breaker state transition.
   */
  recordStateTransition(
    circuitName: string,
    fromState: CircuitBreakerState,
    toState: CircuitBreakerState,
  ): void {
    const now = Date.now();
    this._lastEventAtMs = now;

    // Track transition
    const transitionKey = `${fromState}->${toState}`;
    this._stateTransitions.set(transitionKey, (this._stateTransitions.get(transitionKey) ?? 0) + 1);

    // Update current state
    this._currentStates.set(circuitName, toState);

    // Ensure circuit stats exist
    this.ensureCircuit(circuitName);
    const stats = this._circuitStats.get(circuitName)!;

    // Update circuit-specific tracking
    stats.state = toState;
    stats.transitions++;
    stats.lastTransitionAt = now;

    // Track open/closed timing for recovery time calculation
    if (toState === "open") {
      stats.openedAt = now;
    } else if (toState === "closed" && stats.openedAt !== null) {
      stats.closedAt = now;
      stats.openedAt = null; // Reset for next cycle
    }

    log.info(`circuit breaker transition`, {
      circuit: circuitName,
      from: fromState,
      to: toState,
      transitions: stats.transitions,
    });
  }

  /**
   * Record a failure in a circuit.
   */
  recordFailure(circuitName: string): void {
    const now = Date.now();
    this._lastEventAtMs = now;
    this._totalFailures++;

    this.ensureCircuit(circuitName);
    const stats = this._circuitStats.get(circuitName)!;

    stats.failures++;
    stats.lastFailureAt = now;
    stats.failureTimestamps.push(now);

    // Prune old failures outside the window
    this.pruneFailureTimestamps(stats.failureTimestamps, now - FAILURE_RATE_WINDOW_MS);
  }

  /**
   * Record a success in a circuit.
   */
  recordSuccess(circuitName: string): void {
    const now = Date.now();
    this._lastEventAtMs = now;
    this._totalSuccesses++;

    this.ensureCircuit(circuitName);
    const stats = this._circuitStats.get(circuitName)!;

    stats.successes++;
  }

  /**
   * Get current snapshot of all metrics.
   */
  getSnapshot(): CircuitBreakerMetricsSnapshot {
    const now = Date.now();

    // Build state transitions record
    const stateTransitions: Record<string, number> = {};
    for (const [key, count] of this._stateTransitions) {
      stateTransitions[key] = count;
    }

    // Build current states record
    const currentStates: Record<string, CircuitBreakerState> = {};
    for (const [circuit, state] of this._currentStates) {
      currentStates[circuit] = state;
    }

    // Calculate overall failure rate
    const total = this._totalFailures + this._totalSuccesses;
    const overallFailureRate = total > 0 ? (this._totalFailures / total) * 100 : 0;

    // Build per-circuit breakdown
    const byCircuit: CircuitBreakerMetricsSnapshot["byCircuit"] = {};
    const recoveryTimes: number[] = [];

    for (const [circuit, stats] of this._circuitStats) {
      // Prune old failures for accurate current failure rate
      this.pruneFailureTimestamps(stats.failureTimestamps, now - FAILURE_RATE_WINDOW_MS);

      const circuitTotal = stats.failures + stats.successes;
      const circuitFailureRate = circuitTotal > 0 ? (stats.failures / circuitTotal) * 100 : 0;

      // Calculate recovery time if circuit closed after being open
      let recoveryTimeMs: number | null = null;
      if (stats.closedAt !== null && stats.openedAt !== null) {
        recoveryTimeMs = stats.closedAt - stats.openedAt;
        recoveryTimes.push(recoveryTimeMs);
      }

      byCircuit[circuit] = {
        state: stats.state,
        transitions: stats.transitions,
        failures: stats.failures,
        successes: stats.successes,
        failureRate: circuitFailureRate,
        lastTransitionAt: stats.lastTransitionAt,
        lastFailureAt: stats.lastFailureAt,
        recoveryTimeMs,
      };
    }

    // Calculate aggregate recovery time stats
    const avgRecoveryTimeMs =
      recoveryTimes.length > 0
        ? recoveryTimes.reduce((sum, t) => sum + t, 0) / recoveryTimes.length
        : 0;
    const maxRecoveryTimeMs = recoveryTimes.length > 0 ? Math.max(...recoveryTimes) : 0;

    return {
      stateTransitions,
      currentStates,
      totalFailures: this._totalFailures,
      totalSuccesses: this._totalSuccesses,
      failureRate: overallFailureRate,
      byCircuit,
      avgRecoveryTimeMs: Math.round(avgRecoveryTimeMs),
      maxRecoveryTimeMs: Math.round(maxRecoveryTimeMs),
      startedAtMs: this._startedAtMs,
      lastEventAtMs: this._lastEventAtMs,
    };
  }

  /**
   * Reset all metrics.
   */
  reset(): void {
    this._stateTransitions.clear();
    this._currentStates.clear();
    this._totalFailures = 0;
    this._totalSuccesses = 0;
    this._circuitStats.clear();
    this._startedAtMs = Date.now();
    this._lastEventAtMs = 0;
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /**
   * Ensure a circuit entry exists in the stats map.
   */
  private ensureCircuit(circuitName: string): void {
    if (!this._circuitStats.has(circuitName)) {
      this._circuitStats.set(circuitName, {
        state: "closed",
        transitions: 0,
        failures: 0,
        successes: 0,
        lastTransitionAt: 0,
        lastFailureAt: 0,
        openedAt: null,
        closedAt: null,
        failureTimestamps: [],
      });
      this._currentStates.set(circuitName, "closed");
    }
  }

  /**
   * Remove timestamps older than cutoff from failure tracking array.
   */
  private pruneFailureTimestamps(arr: number[], cutoff: number): void {
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

let globalMetrics: CircuitBreakerMetrics | null = null;

/**
 * Get or create the global circuit breaker metrics instance.
 */
export function getCircuitBreakerMetrics(): CircuitBreakerMetrics {
  if (!globalMetrics) {
    globalMetrics = new CircuitBreakerMetrics();
  }
  return globalMetrics;
}

/**
 * Shorthand functions for recording metrics.
 */
export const recordCircuitStateTransition = (
  circuitName: string,
  fromState: CircuitBreakerState,
  toState: CircuitBreakerState,
): void => getCircuitBreakerMetrics().recordStateTransition(circuitName, fromState, toState);

export const recordCircuitFailure = (circuitName: string): void =>
  getCircuitBreakerMetrics().recordFailure(circuitName);

export const recordCircuitSuccess = (circuitName: string): void =>
  getCircuitBreakerMetrics().recordSuccess(circuitName);
