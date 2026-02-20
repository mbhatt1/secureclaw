import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { CircuitBreaker, CircuitBreakerError } from "./circuit-breaker.js";

// Mock the logger so tests don't produce console output.
vi.mock("../logging/subsystem.js", () => ({
  createSubsystemLogger: () => ({
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function succeed<T>(value: T): () => Promise<T> {
  return () => Promise.resolve(value);
}

function fail(message = "boom"): () => Promise<never> {
  return () => Promise.reject(new Error(message));
}

/** Exhaust failures until the breaker opens. */
async function tripBreaker(breaker: CircuitBreaker, threshold: number): Promise<void> {
  for (let i = 0; i < threshold; i++) {
    await breaker.execute(fail()).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CircuitBreaker", () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    vi.useFakeTimers();
    breaker = new CircuitBreaker({
      name: "test",
      failureThreshold: 3,
      resetTimeoutMs: 1000,
      halfOpenMaxAttempts: 2,
    });
  });

  afterEach(() => {
    breaker.dispose();
    vi.useRealTimers();
  });

  // -----------------------------------------------------------------------
  // Closed state — normal operation
  // -----------------------------------------------------------------------

  describe("closed state (normal operation)", () => {
    test("passes through successful calls", async () => {
      const result = await breaker.execute(succeed(42));
      expect(result).toBe(42);
      expect(breaker.getState()).toBe("closed");
    });

    test("passes through and re-throws errors below threshold", async () => {
      await expect(breaker.execute(fail("oops"))).rejects.toThrow("oops");
      expect(breaker.getState()).toBe("closed");
    });

    test("tracks failure and success counts", async () => {
      await breaker.execute(succeed("ok"));
      await breaker.execute(fail()).catch(() => {});
      await breaker.execute(succeed("ok"));

      const stats = breaker.getStats();
      expect(stats.successCount).toBe(2);
      expect(stats.failureCount).toBe(0); // reset after success
      expect(stats.state).toBe("closed");
    });

    test("resets consecutive failure count on success", async () => {
      await breaker.execute(fail()).catch(() => {});
      await breaker.execute(fail()).catch(() => {});
      // Two failures, but a success resets the count.
      await breaker.execute(succeed("ok"));
      // One more failure should not trip the breaker (threshold is 3).
      await breaker.execute(fail()).catch(() => {});
      expect(breaker.getState()).toBe("closed");
    });
  });

  // -----------------------------------------------------------------------
  // Transition to open
  // -----------------------------------------------------------------------

  describe("transition to open after threshold failures", () => {
    test("opens after consecutive failures reach threshold", async () => {
      await tripBreaker(breaker, 3);
      expect(breaker.getState()).toBe("open");
    });

    test("records the last failure time", async () => {
      vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));
      await tripBreaker(breaker, 3);
      const stats = breaker.getStats();
      expect(stats.lastFailureTime).toBe(new Date("2025-01-01T00:00:00Z").getTime());
    });
  });

  // -----------------------------------------------------------------------
  // Open state — fail fast
  // -----------------------------------------------------------------------

  describe("open state (fail fast)", () => {
    beforeEach(async () => {
      await tripBreaker(breaker, 3);
    });

    test("rejects immediately with CircuitBreakerError", async () => {
      await expect(breaker.execute(succeed("nope"))).rejects.toThrow(CircuitBreakerError);
    });

    test("error has correct properties", async () => {
      try {
        await breaker.execute(succeed("nope"));
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(CircuitBreakerError);
        const cbe = err as CircuitBreakerError;
        expect(cbe.code).toBe("CIRCUIT_BREAKER_OPEN");
        expect(cbe.isRecoverable).toBe(true);
        expect(cbe.metadata?.circuit).toBe("test");
      }
    });

    test("does not call the wrapped function when open", async () => {
      const fn = vi.fn().mockResolvedValue("should not run");
      await breaker.execute(fn).catch(() => {});
      expect(fn).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Transition to half-open after timeout
  // -----------------------------------------------------------------------

  describe("transition to half-open after timeout", () => {
    beforeEach(async () => {
      await tripBreaker(breaker, 3);
    });

    test("transitions to half-open after resetTimeoutMs", () => {
      vi.advanceTimersByTime(1000);
      expect(breaker.getState()).toBe("half-open");
    });

    test("does not transition before resetTimeoutMs", () => {
      vi.advanceTimersByTime(999);
      expect(breaker.getState()).toBe("open");
    });

    test("transitions on next execute call if timeout has elapsed", async () => {
      // Advance time but don't let the timer fire (advance system time only).
      vi.setSystemTime(Date.now() + 1000);
      // The execute call should detect the elapsed time and transition.
      const result = await breaker.execute(succeed("probe"));
      expect(breaker.getState()).toBe("half-open"); // or closed if all probes pass
      expect(result).toBe("probe");
    });
  });

  // -----------------------------------------------------------------------
  // Half-open state — probe requests
  // -----------------------------------------------------------------------

  describe("half-open state (probe requests)", () => {
    beforeEach(async () => {
      await tripBreaker(breaker, 3);
      vi.advanceTimersByTime(1000); // -> half-open
    });

    test("allows limited probe requests", async () => {
      expect(breaker.getState()).toBe("half-open");
      const r1 = await breaker.execute(succeed("probe-1"));
      expect(r1).toBe("probe-1");
    });

    test("recovers to closed after all probe requests succeed", async () => {
      // halfOpenMaxAttempts is 2
      await breaker.execute(succeed("p1"));
      await breaker.execute(succeed("p2"));
      expect(breaker.getState()).toBe("closed");
    });

    test("falls back to open on a failed probe", async () => {
      await breaker.execute(succeed("p1"));
      await breaker.execute(fail()).catch(() => {});
      expect(breaker.getState()).toBe("open");
    });

    test("rejects when probe limit is exhausted without full success", async () => {
      // Use 2 probes successfully, circuit closes. Trip again then go half-open.
      await breaker.execute(succeed("p1"));
      await breaker.execute(succeed("p2"));
      expect(breaker.getState()).toBe("closed");

      // Trip again
      await tripBreaker(breaker, 3);
      vi.advanceTimersByTime(1000);
      expect(breaker.getState()).toBe("half-open");

      // Exhaust half-open attempts without all succeeding:
      // Create a breaker with 1 halfOpenMaxAttempts to test the limit more directly.
      const b2 = new CircuitBreaker({
        name: "test-limit",
        failureThreshold: 1,
        resetTimeoutMs: 500,
        halfOpenMaxAttempts: 1,
      });
      await b2.execute(fail()).catch(() => {}); // -> open
      vi.advanceTimersByTime(500); // -> half-open

      // First probe fails -> back to open
      await b2.execute(fail()).catch(() => {});
      expect(b2.getState()).toBe("open");

      b2.dispose();
    });
  });

  // -----------------------------------------------------------------------
  // Recovery
  // -----------------------------------------------------------------------

  describe("recovery", () => {
    test("full cycle: closed -> open -> half-open -> closed", async () => {
      expect(breaker.getState()).toBe("closed");

      await tripBreaker(breaker, 3);
      expect(breaker.getState()).toBe("open");

      vi.advanceTimersByTime(1000);
      expect(breaker.getState()).toBe("half-open");

      await breaker.execute(succeed("p1"));
      await breaker.execute(succeed("p2"));
      expect(breaker.getState()).toBe("closed");

      // Should work normally again
      const result = await breaker.execute(succeed("back to normal"));
      expect(result).toBe("back to normal");
    });

    test("half-open -> open -> half-open -> closed (retry cycle)", async () => {
      await tripBreaker(breaker, 3);
      vi.advanceTimersByTime(1000);
      expect(breaker.getState()).toBe("half-open");

      // Probe fails -> back to open
      await breaker.execute(fail()).catch(() => {});
      expect(breaker.getState()).toBe("open");

      // Wait again
      vi.advanceTimersByTime(1000);
      expect(breaker.getState()).toBe("half-open");

      // Probes succeed this time
      await breaker.execute(succeed("p1"));
      await breaker.execute(succeed("p2"));
      expect(breaker.getState()).toBe("closed");
    });
  });

  // -----------------------------------------------------------------------
  // Manual reset
  // -----------------------------------------------------------------------

  describe("manual reset", () => {
    test("resets open circuit to closed", async () => {
      await tripBreaker(breaker, 3);
      expect(breaker.getState()).toBe("open");

      breaker.reset();
      expect(breaker.getState()).toBe("closed");

      const stats = breaker.getStats();
      expect(stats.failureCount).toBe(0);
      expect(stats.successCount).toBe(0);
      expect(stats.lastFailureTime).toBeNull();
    });

    test("allows requests after reset", async () => {
      await tripBreaker(breaker, 3);
      breaker.reset();
      const result = await breaker.execute(succeed("after reset"));
      expect(result).toBe("after reset");
    });
  });

  // -----------------------------------------------------------------------
  // Dispose
  // -----------------------------------------------------------------------

  describe("dispose", () => {
    test("rejects requests after dispose", async () => {
      breaker.dispose();
      await expect(breaker.execute(succeed("nope"))).rejects.toThrow(CircuitBreakerError);
    });
  });

  // -----------------------------------------------------------------------
  // Default configuration
  // -----------------------------------------------------------------------

  describe("default configuration", () => {
    test("uses default values when not specified", () => {
      const b = new CircuitBreaker({ name: "defaults" });
      const stats = b.getStats();
      expect(stats.state).toBe("closed");
      expect(stats.failureCount).toBe(0);
      expect(stats.successCount).toBe(0);
      expect(stats.lastFailureTime).toBeNull();
      b.dispose();
    });

    test("default threshold is 5", async () => {
      const b = new CircuitBreaker({ name: "default-threshold" });
      // 4 failures should not open
      for (let i = 0; i < 4; i++) {
        await b.execute(fail()).catch(() => {});
      }
      expect(b.getState()).toBe("closed");
      // 5th failure opens
      await b.execute(fail()).catch(() => {});
      expect(b.getState()).toBe("open");
      b.dispose();
    });
  });

  // -----------------------------------------------------------------------
  // CircuitBreakerError
  // -----------------------------------------------------------------------

  describe("CircuitBreakerError", () => {
    test("is an instance of Error", () => {
      const err = new CircuitBreakerError("my-circuit");
      expect(err).toBeInstanceOf(Error);
    });

    test("has the correct name", () => {
      const err = new CircuitBreakerError("my-circuit");
      expect(err.name).toBe("CircuitBreakerError");
    });

    test("includes circuit name in message", () => {
      const err = new CircuitBreakerError("my-circuit");
      expect(err.message).toContain("my-circuit");
    });
  });
});
