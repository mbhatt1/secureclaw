/**
 * Memory monitoring for Raspberry Pi deployment
 *
 * Tracks memory usage and triggers cleanup when limits are approached
 */
export class MemoryMonitor {
  private readonly maxHeapMB: number;
  private readonly warningThresholdPct: number;
  private readonly checkIntervalMs: number;
  private timer: NodeJS.Timeout | null = null;
  private listeners: Set<(usage: MemoryUsage) => void> = new Set();

  constructor(opts: {
    maxHeapMB?: number;
    warningThresholdPct?: number;
    checkIntervalMs?: number;
  }) {
    this.maxHeapMB = opts.maxHeapMB ?? 450; // 450MB on 4GB Pi
    this.warningThresholdPct = opts.warningThresholdPct ?? 80;
    this.checkIntervalMs = opts.checkIntervalMs ?? 30_000; // 30 seconds
  }

  start(): void {
    if (this.timer) {
      return;
    }
    this.timer = setInterval(() => {
      this.check();
    }, this.checkIntervalMs);
    this.timer.unref();
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  onWarning(listener: (usage: MemoryUsage) => void): void {
    this.listeners.add(listener);
  }

  offWarning(listener: (usage: MemoryUsage) => void): void {
    this.listeners.delete(listener);
  }

  private check(): void {
    const usage = this.getMemoryUsage();
    const heapUsedMB = usage.heapUsed / 1024 / 1024;
    const heapPct = (heapUsedMB / this.maxHeapMB) * 100;

    if (heapPct >= this.warningThresholdPct) {
      // Notify listeners to trigger cleanup
      for (const listener of this.listeners) {
        try {
          listener(usage);
        } catch (err) {
          // Ignore listener errors
        }
      }

      // Force garbage collection if available (requires --expose-gc)
      if (global.gc) {
        global.gc();
      }
    }
  }

  getMemoryUsage(): MemoryUsage {
    const mem = process.memoryUsage();
    return {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      rss: mem.rss,
      external: mem.external,
      heapUsedMB: mem.heapUsed / 1024 / 1024,
      heapTotalMB: mem.heapTotal / 1024 / 1024,
      rssMB: mem.rss / 1024 / 1024,
    };
  }

  getStats(): {
    maxHeapMB: number;
    warningThresholdPct: number;
    currentUsage: MemoryUsage;
    isWarning: boolean;
  } {
    const usage = this.getMemoryUsage();
    const heapPct = (usage.heapUsedMB / this.maxHeapMB) * 100;
    return {
      maxHeapMB: this.maxHeapMB,
      warningThresholdPct: this.warningThresholdPct,
      currentUsage: usage,
      isWarning: heapPct >= this.warningThresholdPct,
    };
  }
}

export interface MemoryUsage {
  heapUsed: number;
  heapTotal: number;
  rss: number;
  external: number;
  heapUsedMB: number;
  heapTotalMB: number;
  rssMB: number;
}
