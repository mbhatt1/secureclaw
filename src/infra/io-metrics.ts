/**
 * I/O metrics collection for monitoring disk and network usage
 *
 * Provides real-time metrics on:
 * - Disk writes and reads
 * - Network sent and received
 * - Database operations
 * - Cache hit rates
 */

import { createSubsystemLogger } from "../logging/subsystem.js";

const log = createSubsystemLogger("io-metrics");

export type IOMetricsConfig = {
  /** Reporting window in milliseconds */
  windowMs?: number;
  /** Enable automatic reporting */
  autoReport?: boolean;
  /** Enable detailed metrics (more overhead) */
  detailed?: boolean;
};

const DEFAULT_CONFIG = {
  windowMs: 60 * 1000, // 1 minute
  autoReport: true,
  detailed: false,
};

export type IOMetricsSnapshot = {
  window: {
    startTime: number;
    endTime: number;
    durationMs: number;
  };
  disk: {
    writes: number;
    reads: number;
    writeMB: number;
    readMB: number;
    writesPerMin: number;
    readsPerMin: number;
    writeMBPerMin: number;
  };
  network: {
    sent: number;
    received: number;
    sentMB: number;
    receivedMB: number;
    totalMB: number;
    mbps: number;
  };
  database: {
    queries: number;
    transactions: number;
    queriesPerSec: number;
    transactionsPerSec: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
  };
};

export class IOMetrics {
  private counters = {
    diskWrites: 0,
    diskReads: 0,
    diskWriteBytes: 0,
    diskReadBytes: 0,
    networkSent: 0,
    networkReceived: 0,
    networkSentBytes: 0,
    networkReceivedBytes: 0,
    dbQueries: 0,
    dbTransactions: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  private windowStart = Date.now();
  private readonly config: Required<IOMetricsConfig>;
  private reportTimer: NodeJS.Timeout | null = null;
  private history: IOMetricsSnapshot[] = [];
  private readonly maxHistorySize = 60; // Keep 1 hour of 1-minute snapshots

  constructor(config: IOMetricsConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (this.config.autoReport) {
      this.startAutoReport();
    }
  }

  /**
   * Record a disk write operation
   */
  recordDiskWrite(bytes: number, count = 1): void {
    this.counters.diskWrites += count;
    this.counters.diskWriteBytes += bytes;
    this.checkWindow();
  }

  /**
   * Record a disk read operation
   */
  recordDiskRead(bytes: number, count = 1): void {
    this.counters.diskReads += count;
    this.counters.diskReadBytes += bytes;
    this.checkWindow();
  }

  /**
   * Record network data sent
   */
  recordNetworkSent(bytes: number, count = 1): void {
    this.counters.networkSent += count;
    this.counters.networkSentBytes += bytes;
    this.checkWindow();
  }

  /**
   * Record network data received
   */
  recordNetworkReceived(bytes: number, count = 1): void {
    this.counters.networkReceived += count;
    this.counters.networkReceivedBytes += bytes;
    this.checkWindow();
  }

  /**
   * Record a database query
   */
  recordDatabaseQuery(): void {
    this.counters.dbQueries++;
    this.checkWindow();
  }

  /**
   * Record a database transaction
   */
  recordDatabaseTransaction(): void {
    this.counters.dbTransactions++;
    this.checkWindow();
  }

  /**
   * Record a cache hit
   */
  recordCacheHit(): void {
    this.counters.cacheHits++;
    this.checkWindow();
  }

  /**
   * Record a cache miss
   */
  recordCacheMiss(): void {
    this.counters.cacheMisses++;
    this.checkWindow();
  }

  /**
   * Check if the reporting window has elapsed
   */
  private checkWindow(): void {
    const now = Date.now();
    if (now - this.windowStart >= this.config.windowMs) {
      this.report();
      this.reset();
    }
  }

  /**
   * Get current metrics snapshot
   */
  getSnapshot(): IOMetricsSnapshot {
    const now = Date.now();
    const durationMs = now - this.windowStart;
    const durationSec = durationMs / 1000;
    const durationMin = durationMs / 60000;

    const diskWriteMB = this.counters.diskWriteBytes / 1024 / 1024;
    const diskReadMB = this.counters.diskReadBytes / 1024 / 1024;
    const networkSentMB = this.counters.networkSentBytes / 1024 / 1024;
    const networkReceivedMB = this.counters.networkReceivedBytes / 1024 / 1024;
    const networkTotalMB = networkSentMB + networkReceivedMB;

    const cacheTotal = this.counters.cacheHits + this.counters.cacheMisses;

    return {
      window: {
        startTime: this.windowStart,
        endTime: now,
        durationMs,
      },
      disk: {
        writes: this.counters.diskWrites,
        reads: this.counters.diskReads,
        writeMB: diskWriteMB,
        readMB: diskReadMB,
        writesPerMin: durationMin > 0 ? this.counters.diskWrites / durationMin : 0,
        readsPerMin: durationMin > 0 ? this.counters.diskReads / durationMin : 0,
        writeMBPerMin: durationMin > 0 ? diskWriteMB / durationMin : 0,
      },
      network: {
        sent: this.counters.networkSent,
        received: this.counters.networkReceived,
        sentMB: networkSentMB,
        receivedMB: networkReceivedMB,
        totalMB: networkTotalMB,
        mbps: durationSec > 0 ? (networkTotalMB * 8) / durationSec : 0,
      },
      database: {
        queries: this.counters.dbQueries,
        transactions: this.counters.dbTransactions,
        queriesPerSec: durationSec > 0 ? this.counters.dbQueries / durationSec : 0,
        transactionsPerSec: durationSec > 0 ? this.counters.dbTransactions / durationSec : 0,
      },
      cache: {
        hits: this.counters.cacheHits,
        misses: this.counters.cacheMisses,
        hitRate: cacheTotal > 0 ? (this.counters.cacheHits / cacheTotal) * 100 : 0,
      },
    };
  }

  /**
   * Get historical metrics
   */
  getHistory(): IOMetricsSnapshot[] {
    return [...this.history];
  }

  /**
   * Report current metrics
   */
  private report(): void {
    const snapshot = this.getSnapshot();

    // Add to history
    this.history.push(snapshot);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // Log if auto-reporting is enabled
    if (this.config.autoReport) {
      log.info("io metrics report", {
        diskWriteMBPerMin: snapshot.disk.writeMBPerMin.toFixed(2),
        diskWritesPerMin: snapshot.disk.writesPerMin.toFixed(0),
        networkMbps: snapshot.network.mbps.toFixed(2),
        dbQueriesPerSec: snapshot.database.queriesPerSec.toFixed(1),
        cacheHitRate: `${snapshot.cache.hitRate.toFixed(1)}%`,
      });
    }
  }

  /**
   * Reset counters for next window
   */
  private reset(): void {
    this.counters = {
      diskWrites: 0,
      diskReads: 0,
      diskWriteBytes: 0,
      diskReadBytes: 0,
      networkSent: 0,
      networkReceived: 0,
      networkSentBytes: 0,
      networkReceivedBytes: 0,
      dbQueries: 0,
      dbTransactions: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
    this.windowStart = Date.now();
  }

  /**
   * Start automatic reporting
   */
  private startAutoReport(): void {
    if (this.reportTimer) {
      return;
    }

    this.reportTimer = setInterval(() => {
      this.report();
      this.reset();
    }, this.config.windowMs);

    // Allow Node.js to exit even with timer running
    this.reportTimer.unref();
  }

  /**
   * Stop automatic reporting
   */
  stopAutoReport(): void {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = null;
    }
  }

  /**
   * Get aggregate statistics across all history
   */
  getAggregateStats(): {
    totalWindows: number;
    avgDiskWriteMBPerMin: number;
    maxDiskWriteMBPerMin: number;
    avgNetworkMbps: number;
    maxNetworkMbps: number;
    avgCacheHitRate: number;
  } {
    if (this.history.length === 0) {
      return {
        totalWindows: 0,
        avgDiskWriteMBPerMin: 0,
        maxDiskWriteMBPerMin: 0,
        avgNetworkMbps: 0,
        maxNetworkMbps: 0,
        avgCacheHitRate: 0,
      };
    }

    const diskWrites = this.history.map((s) => s.disk.writeMBPerMin);
    const networkMbps = this.history.map((s) => s.network.mbps);
    const cacheHitRates = this.history.map((s) => s.cache.hitRate);

    return {
      totalWindows: this.history.length,
      avgDiskWriteMBPerMin: diskWrites.reduce((a, b) => a + b, 0) / diskWrites.length,
      maxDiskWriteMBPerMin: Math.max(...diskWrites),
      avgNetworkMbps: networkMbps.reduce((a, b) => a + b, 0) / networkMbps.length,
      maxNetworkMbps: Math.max(...networkMbps),
      avgCacheHitRate: cacheHitRates.reduce((a, b) => a + b, 0) / cacheHitRates.length,
    };
  }

  /**
   * Close the metrics collector
   */
  close(): void {
    this.stopAutoReport();
    this.report(); // Final report
  }
}

/**
 * Global metrics instance (singleton)
 */
let globalMetrics: IOMetrics | null = null;

/**
 * Get or create the global metrics instance
 */
export function getIOMetrics(config?: IOMetricsConfig): IOMetrics {
  if (!globalMetrics) {
    globalMetrics = new IOMetrics(config);
  }
  return globalMetrics;
}

/**
 * Shorthand functions for recording metrics
 */
export const recordDiskWrite = (bytes: number, count?: number): void =>
  getIOMetrics().recordDiskWrite(bytes, count);

export const recordDiskRead = (bytes: number, count?: number): void =>
  getIOMetrics().recordDiskRead(bytes, count);

export const recordNetworkSent = (bytes: number, count?: number): void =>
  getIOMetrics().recordNetworkSent(bytes, count);

export const recordNetworkReceived = (bytes: number, count?: number): void =>
  getIOMetrics().recordNetworkReceived(bytes, count);

export const recordDatabaseQuery = (): void => getIOMetrics().recordDatabaseQuery();

export const recordDatabaseTransaction = (): void => getIOMetrics().recordDatabaseTransaction();

export const recordCacheHit = (): void => getIOMetrics().recordCacheHit();

export const recordCacheMiss = (): void => getIOMetrics().recordCacheMiss();
