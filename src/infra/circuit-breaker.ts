// ---------------------------------------------------------------------------
// Circuit Breaker
//
// Implements the standard circuit breaker pattern to protect against cascading
// failures. Wraps async operations and tracks success/failure rates, opening
// the circuit when failures exceed a threshold and allowing probe requests
// after a cooldown period.
// ---------------------------------------------------------------------------

import { createSubsystemLogger } from "../logging/subsystem.js";
import { type CircuitBreakerState, getCircuitBreakerMetrics } from "./circuit-breaker-metrics.js";
import { AppError } from "./errors.js";

const log = createSubsystemLogger("circuit-breaker");

// ---------------------------------------------------------------------------
// Types & Configuration
// ---------------------------------------------------------------------------

export type CircuitBreakerOptions = {
  /** Identifier for this circuit breaker instance. */
  name: string;

  /** Number of consecutive failures before opening the circuit. Default: 5. */
  failureThreshold?: number;

  /** Milliseconds to stay in OPEN state before transitioning to HALF_OPEN. Default: 30000. */
  resetTimeoutMs?: number;

  /** Number of probe requests allowed in HALF_OPEN state. Default: 3. */
  halfOpenMaxAttempts?: number;
};

export type CircuitBreakerStats = {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number | null;
};

// ---------------------------------------------------------------------------
// CircuitBreakerError
// ---------------------------------------------------------------------------

/**
 * Thrown when a request is rejected because the circuit breaker is open.
 */
export class CircuitBreakerError extends AppError {
  constructor(circuitName: string, options?: { cause?: unknown }) {
    super(`Circuit breaker "${circuitName}" is open — request rejected`, {
      code: "CIRCUIT_BREAKER_OPEN",
      metadata: { circuit: circuitName },
      cause: options?.cause,
      isRecoverable: true,
    });
    this.name = "CircuitBreakerError";
  }
}

// ---------------------------------------------------------------------------
// CircuitBreaker
// ---------------------------------------------------------------------------

export class CircuitBreaker {
  private readonly _name: string;
  private readonly _failureThreshold: number;
  private readonly _resetTimeoutMs: number;
  private readonly _halfOpenMaxAttempts: number;

  private _state: CircuitBreakerState = "closed";
  private _failureCount: number = 0;
  private _successCount: number = 0;
  private _halfOpenAttempts: number = 0;
  private _lastFailureTime: number | null = null;
  private _openedAt: number | null = null;
  private _resetTimer: ReturnType<typeof setTimeout> | null = null;
  private _disposed: boolean = false;

  constructor(options: CircuitBreakerOptions) {
    this._name = options.name;
    this._failureThreshold = options.failureThreshold ?? 5;
    this._resetTimeoutMs = options.resetTimeoutMs ?? 30_000;
    this._halfOpenMaxAttempts = options.halfOpenMaxAttempts ?? 3;

    log.debug(`circuit breaker created`, {
      name: this._name,
      failureThreshold: this._failureThreshold,
      resetTimeoutMs: this._resetTimeoutMs,
      halfOpenMaxAttempts: this._halfOpenMaxAttempts,
    });
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Execute an async operation with circuit breaker protection.
   *
   * - CLOSED: the operation runs normally. Failures increment the counter;
   *   when the threshold is reached the circuit opens.
   * - OPEN: the operation is immediately rejected with a CircuitBreakerError.
   * - HALF_OPEN: a limited number of probe requests are allowed through.
   *   Success closes the circuit; failure re-opens it.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this._disposed) {
      throw new CircuitBreakerError(this._name);
    }

    // Check if we should transition from OPEN -> HALF_OPEN based on elapsed time.
    // This handles the case where no timer was set or the timer hasn't fired yet.
    if (this._state === "open" && this._openedAt !== null) {
      const elapsed = Date.now() - this._openedAt;
      if (elapsed >= this._resetTimeoutMs) {
        this.transitionTo("half-open");
      }
    }

    if (this._state === "open") {
      throw new CircuitBreakerError(this._name);
    }

    if (this._state === "half-open" && this._halfOpenAttempts >= this._halfOpenMaxAttempts) {
      throw new CircuitBreakerError(this._name);
    }

    if (this._state === "half-open") {
      this._halfOpenAttempts++;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Get the current circuit breaker state.
   */
  getState(): CircuitBreakerState {
    return this._state;
  }

  /**
   * Get a snapshot of the circuit breaker stats.
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this._state,
      failureCount: this._failureCount,
      successCount: this._successCount,
      lastFailureTime: this._lastFailureTime,
    };
  }

  /**
   * Manually reset the circuit breaker to the CLOSED state.
   */
  reset(): void {
    this.clearResetTimer();
    this._failureCount = 0;
    this._successCount = 0;
    this._halfOpenAttempts = 0;
    this._lastFailureTime = null;
    this._openedAt = null;

    if (this._state !== "closed") {
      this.transitionTo("closed");
    }
  }

  /**
   * Clean up timers. Call this when the circuit breaker is no longer needed.
   */
  dispose(): void {
    this._disposed = true;
    this.clearResetTimer();
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private onSuccess(): void {
    this._successCount++;
    getCircuitBreakerMetrics().recordSuccess(this._name);

    if (this._state === "half-open") {
      // All probe requests have succeeded — recover to closed.
      // We already incremented _halfOpenAttempts before calling fn, so
      // check if we've reached the limit.
      if (this._halfOpenAttempts >= this._halfOpenMaxAttempts) {
        this._failureCount = 0;
        this._halfOpenAttempts = 0;
        this.transitionTo("closed");
      }
    } else if (this._state === "closed") {
      // Reset consecutive failure count on success while closed.
      this._failureCount = 0;
    }
  }

  private onFailure(): void {
    this._failureCount++;
    this._lastFailureTime = Date.now();
    getCircuitBreakerMetrics().recordFailure(this._name);

    if (this._state === "half-open") {
      // A probe request failed — go back to open.
      this._halfOpenAttempts = 0;
      this.transitionTo("open");
    } else if (this._state === "closed") {
      if (this._failureCount >= this._failureThreshold) {
        this.transitionTo("open");
      }
    }
  }

  private transitionTo(newState: CircuitBreakerState): void {
    const oldState = this._state;
    if (oldState === newState) {
      return;
    }

    log.info(`state transition`, {
      circuit: this._name,
      from: oldState,
      to: newState,
    });

    // Report to metrics
    getCircuitBreakerMetrics().recordStateTransition(this._name, oldState, newState);

    this._state = newState;

    if (newState === "open") {
      this._openedAt = Date.now();
      this.scheduleReset();
    } else {
      this._openedAt = null;
      this.clearResetTimer();
    }
  }

  private scheduleReset(): void {
    this.clearResetTimer();
    this._resetTimer = setTimeout(() => {
      this._resetTimer = null;
      if (this._state === "open") {
        this.transitionTo("half-open");
      }
    }, this._resetTimeoutMs);

    // Allow the process to exit even if this timer is pending.
    if (this._resetTimer && typeof this._resetTimer === "object" && "unref" in this._resetTimer) {
      this._resetTimer.unref();
    }
  }

  private clearResetTimer(): void {
    if (this._resetTimer !== null) {
      clearTimeout(this._resetTimer);
      this._resetTimer = null;
    }
  }
}
