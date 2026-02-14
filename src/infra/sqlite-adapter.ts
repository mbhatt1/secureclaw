/**
 * Optimized SQLite adapter for Raspberry Pi deployments
 *
 * Features:
 * - WAL mode for better concurrency and reduced fsync
 * - Connection pooling (simple single-connection model suitable for SQLite)
 * - Optimized PRAGMA settings for write performance
 * - Transaction batching utilities
 * - Performance monitoring
 */

import type { DatabaseSync } from "node:sqlite";
import { createSubsystemLogger } from "../logging/subsystem.js";
import { requireNodeSqlite } from "../memory/sqlite.js";

const log = createSubsystemLogger("sqlite-adapter");

export type SQLiteOptimizationConfig = {
  /** Enable WAL mode (recommended for better concurrency) */
  walMode?: boolean;
  /** Synchronous level: OFF, NORMAL, FULL (NORMAL recommended) */
  synchronous?: "OFF" | "NORMAL" | "FULL";
  /** Cache size in KB (negative = KB, positive = pages), default -10000 (10MB) */
  cacheSizeKB?: number;
  /** Journal size limit in bytes, default 64MB */
  journalSizeLimitBytes?: number;
  /** Use memory for temp tables */
  tempStoreMemory?: boolean;
  /** Enable automatic checkpointing interval (ms), 0 = disabled */
  autoCheckpointIntervalMs?: number;
  /** Checkpoint mode: PASSIVE, FULL, RESTART, TRUNCATE */
  checkpointMode?: "PASSIVE" | "FULL" | "RESTART" | "TRUNCATE";
};

export type SQLiteMetrics = {
  walCheckpoints: number;
  walCheckpointDurationMs: number;
  queries: number;
  transactions: number;
  cacheHits: number;
  cacheMisses: number;
  lastCheckpointAt?: number;
};

const DEFAULT_CONFIG: Required<SQLiteOptimizationConfig> = {
  walMode: true,
  synchronous: "NORMAL",
  cacheSizeKB: 10000, // 10MB
  journalSizeLimitBytes: 67_108_864, // 64MB
  tempStoreMemory: true,
  autoCheckpointIntervalMs: 5 * 60 * 1000, // 5 minutes
  checkpointMode: "PASSIVE",
};

export class OptimizedSQLiteAdapter {
  private db: DatabaseSync;
  private config: Required<SQLiteOptimizationConfig>;
  private metrics: SQLiteMetrics;
  private checkpointTimer: NodeJS.Timeout | null = null;
  private closed = false;

  constructor(dbPath: string, config: SQLiteOptimizationConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.metrics = {
      walCheckpoints: 0,
      walCheckpointDurationMs: 0,
      queries: 0,
      transactions: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };

    this.db = this.openAndOptimize(dbPath);
    this.startAutoCheckpoint();
  }

  private openAndOptimize(dbPath: string): DatabaseSync {
    const { DatabaseSync } = requireNodeSqlite();
    const db = new DatabaseSync(dbPath, {
      allowExtension: true, // Allow loading sqlite-vec
    });

    log.info("optimizing sqlite database", {
      path: dbPath,
      walMode: this.config.walMode,
      synchronous: this.config.synchronous,
      cacheSizeKB: this.config.cacheSizeKB,
    });

    // Enable WAL mode for better concurrency
    if (this.config.walMode) {
      const result = db.prepare("PRAGMA journal_mode = WAL").get() as { journal_mode: string };
      log.debug("wal mode enabled", { mode: result.journal_mode });
    }

    // Optimize synchronous mode (NORMAL = fsync only at critical points)
    db.exec(`PRAGMA synchronous = ${this.config.synchronous}`);

    // Increase cache size for better performance
    // Negative value = KB, positive = pages
    db.exec(`PRAGMA cache_size = -${this.config.cacheSizeKB}`);

    // Use memory for temporary tables
    if (this.config.tempStoreMemory) {
      db.exec("PRAGMA temp_store = MEMORY");
    }

    // Set journal size limit (prevents unbounded WAL growth)
    if (this.config.walMode) {
      db.exec(`PRAGMA journal_size_limit = ${this.config.journalSizeLimitBytes}`);
    }

    // Additional optimizations
    db.exec("PRAGMA page_size = 4096"); // Match filesystem page size
    db.exec("PRAGMA mmap_size = 268435456"); // 256MB memory-mapped I/O

    // Log current settings
    this.logDatabaseConfig(db);

    return db;
  }

  private logDatabaseConfig(db: DatabaseSync): void {
    const settings = {
      journalMode: db.prepare("PRAGMA journal_mode").get() as { journal_mode: string },
      synchronous: db.prepare("PRAGMA synchronous").get() as { synchronous: number },
      cacheSize: db.prepare("PRAGMA cache_size").get() as { cache_size: number },
      pageSize: db.prepare("PRAGMA page_size").get() as { page_size: number },
      tempStore: db.prepare("PRAGMA temp_store").get() as { temp_store: number },
    };

    log.debug("sqlite configuration", settings);
  }

  private startAutoCheckpoint(): void {
    if (this.config.autoCheckpointIntervalMs <= 0 || !this.config.walMode) {
      return;
    }

    this.checkpointTimer = setInterval(() => {
      void this.checkpoint().catch((err) => {
        log.warn("auto checkpoint failed", { error: String(err) });
      });
    }, this.config.autoCheckpointIntervalMs);

    // Allow Node.js to exit even with timer running
    this.checkpointTimer.unref();
  }

  /**
   * Manually trigger a WAL checkpoint
   */
  async checkpoint(): Promise<{ pagesWalked: number; pagesCheckpointed: number }> {
    if (!this.config.walMode) {
      return { pagesWalked: 0, pagesCheckpointed: 0 };
    }

    const startMs = Date.now();

    try {
      const result = this.db
        .prepare(`PRAGMA wal_checkpoint(${this.config.checkpointMode})`)
        .get() as { busy: number; log: number; checkpointed: number };

      const durationMs = Date.now() - startMs;

      this.metrics.walCheckpoints++;
      this.metrics.walCheckpointDurationMs += durationMs;
      this.metrics.lastCheckpointAt = Date.now();

      log.debug("wal checkpoint completed", {
        mode: this.config.checkpointMode,
        pagesWalked: result.log,
        pagesCheckpointed: result.checkpointed,
        durationMs,
      });

      return {
        pagesWalked: result.log,
        pagesCheckpointed: result.checkpointed,
      };
    } catch (err) {
      log.error("checkpoint failed", { error: String(err) });
      throw err;
    }
  }

  /**
   * Execute a query with metrics tracking
   */
  prepare<T = unknown>(
    sql: string,
  ): {
    get: (...params: unknown[]) => T | undefined;
    all: (...params: unknown[]) => T[];
    run: (...params: unknown[]) => { changes: number | bigint; lastInsertRowid: number | bigint };
  } {
    const stmt = this.db.prepare(sql);

    return {
      get: (...params: unknown[]): T | undefined => {
        this.metrics.queries++;
        // The native sqlite prepare statement's get() expects any[] for params
        return stmt.get(
          ...(params as Array<string | number | bigint | boolean | null | Uint8Array>),
        ) as T | undefined;
      },
      all: (...params: unknown[]): T[] => {
        this.metrics.queries++;
        // The native sqlite prepare statement's all() expects any[] for params
        return stmt.all(
          ...(params as Array<string | number | bigint | boolean | null | Uint8Array>),
        ) as T[];
      },
      run: (
        ...params: unknown[]
      ): { changes: number | bigint; lastInsertRowid: number | bigint } => {
        this.metrics.queries++;
        // The native sqlite prepare statement's run() expects any[] for params
        return stmt.run(
          ...(params as Array<string | number | bigint | boolean | null | Uint8Array>),
        );
      },
    };
  }

  /**
   * Execute SQL directly (for DDL and PRAGMA statements)
   */
  exec(sql: string): void {
    this.db.exec(sql);
  }

  /**
   * Execute a function within a transaction
   */
  async transaction<T>(fn: () => Promise<T> | T): Promise<T> {
    this.metrics.transactions++;

    this.db.exec("BEGIN IMMEDIATE");

    try {
      const result = await fn();
      this.db.exec("COMMIT");
      return result;
    } catch (err) {
      this.db.exec("ROLLBACK");
      throw err;
    }
  }

  /**
   * Batch multiple operations in a single transaction
   */
  async batchInsert<T>(
    sql: string,
    items: T[],
    paramExtractor: (item: T) => unknown[],
  ): Promise<void> {
    if (items.length === 0) {
      return;
    }

    await this.transaction(() => {
      const stmt = this.db.prepare(sql);

      for (const item of items) {
        const params = paramExtractor(item);
        // The native sqlite prepare statement's run() expects any[] for params
        stmt.run(...(params as Array<string | number | bigint | boolean | null | Uint8Array>));
      }
    });
  }

  /**
   * Get current metrics
   */
  getMetrics(): Readonly<SQLiteMetrics> {
    return { ...this.metrics };
  }

  /**
   * Reset metrics counters
   */
  resetMetrics(): void {
    this.metrics = {
      walCheckpoints: 0,
      walCheckpointDurationMs: 0,
      queries: 0,
      transactions: 0,
      cacheHits: 0,
      cacheMisses: 0,
      lastCheckpointAt: this.metrics.lastCheckpointAt,
    };
  }

  /**
   * Get database cache statistics
   */
  getCacheStats(): {
    hits: number;
    misses: number;
    hitRate: number;
  } {
    const stats = this.db.prepare("PRAGMA cache_spill").get() as { cache_spill: number };
    void stats; // Future: parse cache statistics

    return {
      hits: this.metrics.cacheHits,
      misses: this.metrics.cacheMisses,
      hitRate:
        this.metrics.cacheHits + this.metrics.cacheMisses > 0
          ? this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)
          : 0,
    };
  }

  /**
   * Get WAL file size
   */
  getWalSize(): number | null {
    if (!this.config.walMode) {
      return null;
    }

    try {
      const result = this.db.prepare("PRAGMA wal_checkpoint(PASSIVE)").get() as {
        busy: number;
        log: number;
        checkpointed: number;
      };

      return result.log * 4096; // Approximate size in bytes
    } catch {
      return null;
    }
  }

  /**
   * Analyze database statistics (improves query planner)
   */
  analyze(): void {
    log.debug("running analyze on database");
    this.db.exec("ANALYZE");
  }

  /**
   * Vacuum database to reclaim space (blocking operation)
   */
  async vacuum(): Promise<void> {
    log.info("vacuuming database (this may take a while)");
    const startMs = Date.now();

    this.db.exec("VACUUM");

    const durationMs = Date.now() - startMs;
    log.info("vacuum completed", { durationMs });
  }

  /**
   * Check database integrity
   */
  integrityCheck(): { ok: boolean; errors: string[] } {
    const results = this.db.prepare("PRAGMA integrity_check").all() as Array<{
      integrity_check: string;
    }>;

    const ok = results.length === 1 && results[0]?.integrity_check === "ok";
    const errors = ok ? [] : results.map((r) => r.integrity_check);

    if (!ok) {
      log.error("database integrity check failed", { errors });
    }

    return { ok, errors };
  }

  /**
   * Get raw DatabaseSync instance for advanced operations
   */
  getRawDb(): DatabaseSync {
    return this.db;
  }

  /**
   * Enable load extension (for sqlite-vec, etc.)
   */
  enableLoadExtension(enable: boolean): void {
    this.db.enableLoadExtension(enable);
  }

  /**
   * Load a SQLite extension
   */
  loadExtension(path: string): void {
    this.db.loadExtension(path);
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.closed) {
      return;
    }

    this.closed = true;

    if (this.checkpointTimer) {
      clearInterval(this.checkpointTimer);
      this.checkpointTimer = null;
    }

    // Final checkpoint before closing
    if (this.config.walMode) {
      try {
        await this.checkpoint();
      } catch (err) {
        log.warn("final checkpoint failed", { error: String(err) });
      }
    }

    this.db.close();
    log.debug("database connection closed");
  }
}

/**
 * Helper function to create an optimized SQLite database
 */
export function createOptimizedSQLite(
  dbPath: string,
  config?: SQLiteOptimizationConfig,
): OptimizedSQLiteAdapter {
  return new OptimizedSQLiteAdapter(dbPath, config);
}

/**
 * Utility to benchmark database operations
 */
export class SQLiteBenchmark {
  private measurements: Array<{ operation: string; durationMs: number; timestamp: number }> = [];

  async measure<T>(operation: string, fn: () => Promise<T> | T): Promise<T> {
    const startMs = Date.now();

    try {
      return await fn();
    } finally {
      const durationMs = Date.now() - startMs;
      this.measurements.push({
        operation,
        durationMs,
        timestamp: Date.now(),
      });
    }
  }

  getResults(): {
    operation: string;
    count: number;
    totalMs: number;
    avgMs: number;
    minMs: number;
    maxMs: number;
    p95Ms: number;
  }[] {
    const grouped = new Map<string, { operation: string; durations: number[] }>();

    for (const m of this.measurements) {
      let group = grouped.get(m.operation);
      if (!group) {
        group = { operation: m.operation, durations: [] };
        grouped.set(m.operation, group);
      }
      group.durations.push(m.durationMs);
    }

    return Array.from(grouped.values()).map((g) => {
      const sorted = g.durations.toSorted((a, b) => a - b);
      const p95Index = Math.floor(sorted.length * 0.95);

      return {
        operation: g.operation,
        count: g.durations.length,
        totalMs: g.durations.reduce((sum, d) => sum + d, 0),
        avgMs: g.durations.reduce((sum, d) => sum + d, 0) / g.durations.length,
        minMs: sorted[0] ?? 0,
        maxMs: sorted[sorted.length - 1] ?? 0,
        p95Ms: sorted[p95Index] ?? 0,
      };
    });
  }

  reset(): void {
    this.measurements = [];
  }
}
