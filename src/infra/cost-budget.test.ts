import { describe, expect, it, vi } from "vitest";
import type { BudgetStatus } from "./cost-budget.js";
import { CostBudget } from "./cost-budget.js";

describe("CostBudget", () => {
  // -----------------------------------------------------------------------
  // checkBudget — requests within budget
  // -----------------------------------------------------------------------

  describe("checkBudget", () => {
    it("allows requests within all budget limits", () => {
      const budget = new CostBudget({
        dailyLimitUsd: 50,
        monthlyLimitUsd: 500,
        sessionLimitUsd: 10,
      });

      const result = budget.checkBudget("sess-1", 1.0);
      expect(result.allowed).toBe(true);
      expect(result.percentUsed).toBeLessThan(100);
    });

    it("allows zero-cost requests", () => {
      const budget = new CostBudget();
      const result = budget.checkBudget("sess-1", 0);
      expect(result.allowed).toBe(true);
    });

    it("allows requests right at the limit boundary", () => {
      const budget = new CostBudget({ sessionLimitUsd: 5 });
      // Spend exactly 5.0 for the session
      budget.recordSpend("sess-1", 4.0);
      const result = budget.checkBudget("sess-1", 1.0);
      // 4.0 + 1.0 = 5.0 which equals the limit, not exceeding it
      expect(result.allowed).toBe(true);
    });

    // ---------------------------------------------------------------------
    // checkBudget — session limit exceeded
    // ---------------------------------------------------------------------

    it("rejects requests that exceed the session limit", () => {
      const budget = new CostBudget({ sessionLimitUsd: 5 });
      budget.recordSpend("sess-1", 4.0);

      const result = budget.checkBudget("sess-1", 2.0);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Session budget exceeded");
      expect(result.currentSpend).toBe(4.0);
      expect(result.limit).toBe(5);
      expect(result.percentUsed).toBeGreaterThan(100);
    });

    it("rejects when a single request exceeds the session limit", () => {
      const budget = new CostBudget({ sessionLimitUsd: 2 });
      const result = budget.checkBudget("sess-1", 3.0);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Session budget exceeded");
    });

    it("isolates session limits between different sessions", () => {
      const budget = new CostBudget({ sessionLimitUsd: 5 });
      budget.recordSpend("sess-1", 4.5);

      // sess-1 is nearly at its limit
      expect(budget.checkBudget("sess-1", 1.0).allowed).toBe(false);
      // sess-2 has a fresh budget
      expect(budget.checkBudget("sess-2", 1.0).allowed).toBe(true);
    });

    // ---------------------------------------------------------------------
    // checkBudget — daily limit exceeded
    // ---------------------------------------------------------------------

    it("rejects requests that exceed the daily limit", () => {
      const budget = new CostBudget({
        dailyLimitUsd: 10,
        sessionLimitUsd: 100, // high session limit so daily is the binding constraint
      });
      budget.recordSpend("sess-1", 9.0);

      const result = budget.checkBudget("sess-1", 2.0);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Daily budget exceeded");
      expect(result.currentSpend).toBe(9.0);
      expect(result.limit).toBe(10);
    });

    it("accumulates daily spend across sessions", () => {
      const budget = new CostBudget({
        dailyLimitUsd: 10,
        sessionLimitUsd: 100,
      });
      budget.recordSpend("sess-1", 5.0);
      budget.recordSpend("sess-2", 5.0);

      // Daily total is now 10.0, any further spend should be denied
      const result = budget.checkBudget("sess-3", 0.01);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Daily budget exceeded");
    });

    // ---------------------------------------------------------------------
    // checkBudget — monthly limit exceeded
    // ---------------------------------------------------------------------

    it("rejects requests that exceed the monthly limit", () => {
      const budget = new CostBudget({
        dailyLimitUsd: 1000, // high daily limit
        monthlyLimitUsd: 20,
        sessionLimitUsd: 1000,
      });
      budget.recordSpend("sess-1", 19.0);

      const result = budget.checkBudget("sess-1", 2.0);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Monthly budget exceeded");
      expect(result.currentSpend).toBe(19.0);
      expect(result.limit).toBe(20);
    });
  });

  // -----------------------------------------------------------------------
  // recordSpend
  // -----------------------------------------------------------------------

  describe("recordSpend", () => {
    it("accumulates spend in daily, monthly, and session buckets", () => {
      const budget = new CostBudget();
      budget.recordSpend("sess-1", 2.5);
      budget.recordSpend("sess-1", 1.5);

      const status = budget.getStatus();
      expect(status.dailySpendUsd).toBe(4.0);
      expect(status.monthlySpendUsd).toBe(4.0);
      expect(status.sessionSpends.get("sess-1")).toBe(4.0);
    });

    it("tracks multiple sessions independently", () => {
      const budget = new CostBudget();
      budget.recordSpend("sess-1", 3.0);
      budget.recordSpend("sess-2", 7.0);

      const status = budget.getStatus();
      expect(status.sessionSpends.get("sess-1")).toBe(3.0);
      expect(status.sessionSpends.get("sess-2")).toBe(7.0);
      expect(status.dailySpendUsd).toBe(10.0);
      expect(status.monthlySpendUsd).toBe(10.0);
    });
  });

  // -----------------------------------------------------------------------
  // getStatus
  // -----------------------------------------------------------------------

  describe("getStatus", () => {
    it("reports correct percentages", () => {
      const budget = new CostBudget({
        dailyLimitUsd: 100,
        monthlyLimitUsd: 1000,
        sessionLimitUsd: 50,
      });
      budget.recordSpend("sess-1", 25);

      const status = budget.getStatus();
      expect(status.dailyPctUsed).toBe(25);
      expect(status.monthlyPctUsed).toBe(2.5);
      expect(status.isWarning).toBe(false);
      expect(status.isExceeded).toBe(false);
    });

    it("sets isWarning when spend reaches warning threshold", () => {
      const budget = new CostBudget({
        dailyLimitUsd: 100,
        monthlyLimitUsd: 1000,
        sessionLimitUsd: 50,
        warningThresholdPct: 80,
      });
      budget.recordSpend("sess-1", 41); // session: 82% of 50

      const status = budget.getStatus();
      expect(status.isWarning).toBe(true);
      expect(status.isExceeded).toBe(false);
    });

    it("sets isExceeded when spend reaches 100%", () => {
      const budget = new CostBudget({
        dailyLimitUsd: 10,
        monthlyLimitUsd: 1000,
        sessionLimitUsd: 50,
      });
      budget.recordSpend("sess-1", 10); // daily: 100%

      const status = budget.getStatus();
      expect(status.isExceeded).toBe(true);
      expect(status.isWarning).toBe(false); // exceeded trumps warning
    });

    it("returns a defensive copy of session spends", () => {
      const budget = new CostBudget();
      budget.recordSpend("sess-1", 5);
      const status1 = budget.getStatus();
      status1.sessionSpends.set("sess-1", 999);

      const status2 = budget.getStatus();
      expect(status2.sessionSpends.get("sess-1")).toBe(5);
    });
  });

  // -----------------------------------------------------------------------
  // Warning callbacks
  // -----------------------------------------------------------------------

  describe("onBudgetWarning", () => {
    it("fires callback when spend crosses warning threshold", () => {
      const budget = new CostBudget({
        dailyLimitUsd: 100,
        monthlyLimitUsd: 1000,
        sessionLimitUsd: 50,
        warningThresholdPct: 80,
      });

      const warningFn = vi.fn<(status: BudgetStatus) => void>();
      budget.onBudgetWarning(warningFn);

      // Spend below threshold
      budget.recordSpend("sess-1", 30);
      expect(warningFn).not.toHaveBeenCalled();

      // Push session spend to 41/50 = 82% -> triggers warning
      budget.recordSpend("sess-1", 11);
      expect(warningFn).toHaveBeenCalledTimes(1);

      const status = warningFn.mock.calls[0][0];
      expect(status.isWarning).toBe(true);
      expect(status.isExceeded).toBe(false);
    });

    it("does not fire warning when spend is in exceeded territory", () => {
      const budget = new CostBudget({
        dailyLimitUsd: 10,
        monthlyLimitUsd: 1000,
        sessionLimitUsd: 50,
        warningThresholdPct: 80,
      });

      const warningFn = vi.fn<(status: BudgetStatus) => void>();
      const exceededFn = vi.fn<(status: BudgetStatus) => void>();
      budget.onBudgetWarning(warningFn);
      budget.onBudgetExceeded(exceededFn);

      // Jump straight past warning into exceeded
      budget.recordSpend("sess-1", 10);
      expect(warningFn).not.toHaveBeenCalled();
      expect(exceededFn).toHaveBeenCalledTimes(1);
    });

    it("supports multiple warning callbacks", () => {
      const budget = new CostBudget({
        dailyLimitUsd: 10,
        monthlyLimitUsd: 1000,
        sessionLimitUsd: 50,
        warningThresholdPct: 80,
      });

      const fn1 = vi.fn<(status: BudgetStatus) => void>();
      const fn2 = vi.fn<(status: BudgetStatus) => void>();
      budget.onBudgetWarning(fn1);
      budget.onBudgetWarning(fn2);

      budget.recordSpend("sess-1", 9); // daily: 90%
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
    });

    it("swallows errors thrown in warning callbacks", () => {
      const budget = new CostBudget({
        dailyLimitUsd: 10,
        monthlyLimitUsd: 1000,
        sessionLimitUsd: 50,
        warningThresholdPct: 80,
      });

      budget.onBudgetWarning(() => {
        throw new Error("callback boom");
      });

      // Should not throw
      expect(() => budget.recordSpend("sess-1", 9)).not.toThrow();
    });
  });

  // -----------------------------------------------------------------------
  // Exceeded callbacks
  // -----------------------------------------------------------------------

  describe("onBudgetExceeded", () => {
    it("fires callback when daily spend reaches 100%", () => {
      const budget = new CostBudget({
        dailyLimitUsd: 10,
        monthlyLimitUsd: 1000,
        sessionLimitUsd: 50,
      });

      const exceededFn = vi.fn<(status: BudgetStatus) => void>();
      budget.onBudgetExceeded(exceededFn);

      budget.recordSpend("sess-1", 10);
      expect(exceededFn).toHaveBeenCalledTimes(1);

      const status = exceededFn.mock.calls[0][0];
      expect(status.isExceeded).toBe(true);
      expect(status.dailyPctUsed).toBe(100);
    });

    it("fires callback when session spend exceeds limit", () => {
      const budget = new CostBudget({
        dailyLimitUsd: 1000,
        monthlyLimitUsd: 10000,
        sessionLimitUsd: 5,
      });

      const exceededFn = vi.fn<(status: BudgetStatus) => void>();
      budget.onBudgetExceeded(exceededFn);

      budget.recordSpend("sess-1", 5);
      expect(exceededFn).toHaveBeenCalledTimes(1);

      const status = exceededFn.mock.calls[0][0];
      expect(status.isExceeded).toBe(true);
      expect(status.sessionSpends.get("sess-1")).toBe(5);
    });

    it("fires callback when monthly spend exceeds limit", () => {
      const budget = new CostBudget({
        dailyLimitUsd: 1000,
        monthlyLimitUsd: 20,
        sessionLimitUsd: 1000,
      });

      const exceededFn = vi.fn<(status: BudgetStatus) => void>();
      budget.onBudgetExceeded(exceededFn);

      budget.recordSpend("sess-1", 20);
      expect(exceededFn).toHaveBeenCalledTimes(1);

      const status = exceededFn.mock.calls[0][0];
      expect(status.isExceeded).toBe(true);
      expect(status.monthlyPctUsed).toBe(100);
    });

    it("swallows errors thrown in exceeded callbacks", () => {
      const budget = new CostBudget({
        dailyLimitUsd: 5,
        monthlyLimitUsd: 1000,
        sessionLimitUsd: 50,
      });

      budget.onBudgetExceeded(() => {
        throw new Error("exceeded boom");
      });

      expect(() => budget.recordSpend("sess-1", 5)).not.toThrow();
    });
  });

  // -----------------------------------------------------------------------
  // resetDaily / resetMonthly
  // -----------------------------------------------------------------------

  describe("resetDaily", () => {
    it("resets daily spend to zero", () => {
      const budget = new CostBudget({
        dailyLimitUsd: 10,
        monthlyLimitUsd: 1000,
        sessionLimitUsd: 50,
      });
      budget.recordSpend("sess-1", 8);
      expect(budget.getStatus().dailySpendUsd).toBe(8);

      budget.resetDaily();
      expect(budget.getStatus().dailySpendUsd).toBe(0);
    });

    it("does not reset monthly spend", () => {
      const budget = new CostBudget({
        dailyLimitUsd: 10,
        monthlyLimitUsd: 1000,
        sessionLimitUsd: 50,
      });
      budget.recordSpend("sess-1", 8);
      budget.resetDaily();

      expect(budget.getStatus().monthlySpendUsd).toBe(8);
    });

    it("allows requests again after daily reset", () => {
      const budget = new CostBudget({
        dailyLimitUsd: 10,
        sessionLimitUsd: 100,
        monthlyLimitUsd: 1000,
      });
      budget.recordSpend("sess-1", 10);

      // Denied before reset
      expect(budget.checkBudget("sess-2", 1).allowed).toBe(false);

      budget.resetDaily();

      // Allowed after reset (different session to avoid session limit)
      expect(budget.checkBudget("sess-2", 1).allowed).toBe(true);
    });
  });

  describe("resetMonthly", () => {
    it("resets monthly spend to zero", () => {
      const budget = new CostBudget({
        dailyLimitUsd: 1000,
        monthlyLimitUsd: 50,
        sessionLimitUsd: 1000,
      });
      budget.recordSpend("sess-1", 40);
      expect(budget.getStatus().monthlySpendUsd).toBe(40);

      budget.resetMonthly();
      expect(budget.getStatus().monthlySpendUsd).toBe(0);
    });

    it("allows requests again after monthly reset", () => {
      const budget = new CostBudget({
        dailyLimitUsd: 1000,
        monthlyLimitUsd: 20,
        sessionLimitUsd: 1000,
      });
      budget.recordSpend("sess-1", 20);
      budget.resetDaily(); // also reset daily so it is not the constraint

      // Denied before reset
      expect(budget.checkBudget("sess-2", 1).allowed).toBe(false);

      budget.resetMonthly();

      // Allowed after reset
      expect(budget.checkBudget("sess-2", 1).allowed).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Default configuration
  // -----------------------------------------------------------------------

  describe("default config", () => {
    it("uses sensible defaults when no config is provided", () => {
      const budget = new CostBudget();
      const status = budget.getStatus();
      expect(status.dailyLimitUsd).toBe(50);
      expect(status.monthlyLimitUsd).toBe(500);
    });
  });

  // -----------------------------------------------------------------------
  // dispose
  // -----------------------------------------------------------------------

  describe("dispose", () => {
    it("can be called safely without snapshot dir", () => {
      const budget = new CostBudget();
      expect(() => budget.dispose()).not.toThrow();
    });
  });
});
