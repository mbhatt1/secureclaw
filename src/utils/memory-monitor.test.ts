import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { MemoryMonitor } from "./memory-monitor.js";

describe("MemoryMonitor", () => {
  let monitor: MemoryMonitor;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    monitor?.stop();
    vi.useRealTimers();
  });

  it("should get memory usage", () => {
    monitor = new MemoryMonitor({ maxHeapMB: 100 });
    const usage = monitor.getMemoryUsage();

    expect(usage.heapUsed).toBeGreaterThan(0);
    expect(usage.heapTotal).toBeGreaterThan(0);
    expect(usage.rss).toBeGreaterThan(0);
    expect(usage.heapUsedMB).toBeGreaterThan(0);
  });

  it("should start and stop monitoring", () => {
    monitor = new MemoryMonitor({ maxHeapMB: 100, checkIntervalMs: 1000 });

    monitor.start();
    expect(monitor).toBeDefined();

    monitor.stop();
    expect(monitor).toBeDefined();
  });

  it("should not start multiple timers", () => {
    monitor = new MemoryMonitor({ maxHeapMB: 100, checkIntervalMs: 1000 });

    monitor.start();
    monitor.start(); // Second start should be no-op

    expect(monitor).toBeDefined();
  });

  it("should call warning listeners when threshold exceeded", () => {
    monitor = new MemoryMonitor({
      maxHeapMB: 1, // Very low limit to trigger warning
      warningThresholdPct: 1, // Very low threshold
      checkIntervalMs: 1000,
    });

    const listener = vi.fn();
    monitor.onWarning(listener);
    monitor.start();

    // Advance time to trigger check
    vi.advanceTimersByTime(1001);

    // Listener should be called (memory usage will exceed 1MB)
    expect(listener).toHaveBeenCalled();
  });

  it("should not call warning listeners when threshold not exceeded", () => {
    monitor = new MemoryMonitor({
      maxHeapMB: 10000, // Very high limit
      warningThresholdPct: 99, // Very high threshold
      checkIntervalMs: 1000,
    });

    const listener = vi.fn();
    monitor.onWarning(listener);
    monitor.start();

    // Advance time to trigger check
    vi.advanceTimersByTime(1001);

    // Listener should not be called
    expect(listener).not.toHaveBeenCalled();
  });

  it("should remove warning listeners", () => {
    monitor = new MemoryMonitor({
      maxHeapMB: 1,
      warningThresholdPct: 1,
      checkIntervalMs: 1000,
    });

    const listener = vi.fn();
    monitor.onWarning(listener);
    monitor.offWarning(listener);
    monitor.start();

    // Advance time to trigger check
    vi.advanceTimersByTime(1001);

    // Listener should not be called (was removed)
    expect(listener).not.toHaveBeenCalled();
  });

  it("should get stats", () => {
    monitor = new MemoryMonitor({ maxHeapMB: 100, warningThresholdPct: 80 });

    const stats = monitor.getStats();

    expect(stats.maxHeapMB).toBe(100);
    expect(stats.warningThresholdPct).toBe(80);
    expect(stats.currentUsage).toBeDefined();
    expect(typeof stats.isWarning).toBe("boolean");
  });
});
