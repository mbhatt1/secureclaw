/**
 * Debounced session store writer for reduced disk I/O
 *
 * Coalesces multiple session store updates within a time window
 * to reduce the number of disk writes while maintaining data durability.
 */

import type { SessionEntry } from "./types.js";
import { createSubsystemLogger } from "../../logging/subsystem.js";
import { saveSessionStore } from "./store.js";

export type SaveSessionStoreOptions = {
  /** Skip pruning, capping, and rotation (e.g. during one-time migrations). */
  skipMaintenance?: boolean;
  /** Active session key for warn-only maintenance. */
  activeSessionKey?: string;
  /** Optional callback for warn-only maintenance. */
  onWarn?: (warning: unknown) => void | Promise<void>;
};

const log = createSubsystemLogger("sessions/debounced-store");

export type DebouncedStoreConfig = {
  /** Debounce window in milliseconds (default: 2000) */
  debounceMs?: number;
  /** Force flush after this many pending writes (default: 10) */
  maxPendingWrites?: number;
};

const DEFAULT_CONFIG = {
  debounceMs: 2000,
  maxPendingWrites: 10,
};

type PendingWrite = {
  storePath: string;
  store: Record<string, SessionEntry>;
  opts?: SaveSessionStoreOptions;
  resolve: () => void;
  reject: (err: unknown) => void;
  timestamp: number;
};

class DebouncedSessionStoreWriter {
  private pendingWrites = new Map<string, PendingWrite[]>();
  private timers = new Map<string, NodeJS.Timeout>();
  private readonly config: Required<DebouncedStoreConfig>;
  private totalCoalesced = 0;
  private totalWrites = 0;
  private closed = false;

  constructor(config: DebouncedStoreConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.setupShutdownHooks();
  }

  /**
   * Schedule a debounced write
   */
  async write(
    storePath: string,
    store: Record<string, SessionEntry>,
    opts?: SaveSessionStoreOptions,
  ): Promise<void> {
    if (this.closed) {
      throw new Error("DebouncedSessionStoreWriter is closed");
    }

    return new Promise<void>((resolve, reject) => {
      const pending: PendingWrite = {
        storePath,
        store: structuredClone(store), // Deep clone to prevent mutations
        opts,
        resolve,
        reject,
        timestamp: Date.now(),
      };

      // Add to pending writes
      const existing = this.pendingWrites.get(storePath) ?? [];
      existing.push(pending);
      this.pendingWrites.set(storePath, existing);

      // Clear existing timer
      const existingTimer = this.timers.get(storePath);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Check if we should flush immediately
      if (existing.length >= this.config.maxPendingWrites) {
        void this.flushPath(storePath);
      } else {
        // Schedule debounced flush
        const timer = setTimeout(() => {
          void this.flushPath(storePath);
        }, this.config.debounceMs);
        this.timers.set(storePath, timer);
      }
    });
  }

  /**
   * Flush all pending writes for a specific path
   */
  private async flushPath(storePath: string): Promise<void> {
    const pending = this.pendingWrites.get(storePath);
    if (!pending || pending.length === 0) {
      return;
    }

    // Clear pending and timer
    this.pendingWrites.delete(storePath);
    const timer = this.timers.get(storePath);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(storePath);
    }

    // Get the most recent write (it has the latest state)
    const lastWrite = pending[pending.length - 1];
    if (!lastWrite) {
      return;
    }

    const coalescedCount = pending.length - 1;
    this.totalCoalesced += coalescedCount;
    this.totalWrites++;

    try {
      // Perform the actual write
      await saveSessionStore(lastWrite.storePath, lastWrite.store, lastWrite.opts);

      // Resolve all pending promises
      for (const p of pending) {
        p.resolve();
      }

      if (coalescedCount > 0) {
        log.debug("coalesced session writes", {
          storePath,
          coalescedCount,
          totalCoalesced: this.totalCoalesced,
          totalWrites: this.totalWrites,
          reductionPercent: (
            (this.totalCoalesced / (this.totalCoalesced + this.totalWrites)) *
            100
          ).toFixed(1),
        });
      }
    } catch (err) {
      // Reject all pending promises
      for (const p of pending) {
        p.reject(err);
      }
      log.error("failed to flush session writes", { storePath, error: String(err) });
    }
  }

  /**
   * Flush all pending writes
   */
  async flushAll(): Promise<void> {
    const paths = Array.from(this.pendingWrites.keys());
    await Promise.all(paths.map((path) => this.flushPath(path)));
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalCoalesced: number;
    totalWrites: number;
    pendingPaths: number;
    reductionPercent: number;
  } {
    const total = this.totalCoalesced + this.totalWrites;
    return {
      totalCoalesced: this.totalCoalesced,
      totalWrites: this.totalWrites,
      pendingPaths: this.pendingWrites.size,
      reductionPercent: total > 0 ? (this.totalCoalesced / total) * 100 : 0,
    };
  }

  /**
   * Set up graceful shutdown to flush remaining writes
   */
  private setupShutdownHooks(): void {
    const shutdown = () => {
      void this.close();
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
    process.on("beforeExit", shutdown);
  }

  /**
   * Close the writer and flush remaining writes
   */
  async close(): Promise<void> {
    if (this.closed) {
      return;
    }

    this.closed = true;

    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();

    // Flush all pending writes
    await this.flushAll();

    const stats = this.getStats();
    log.info("debounced session store writer closed", {
      totalWrites: stats.totalWrites,
      totalCoalesced: stats.totalCoalesced,
      reductionPercent: stats.reductionPercent.toFixed(1) + "%",
    });
  }
}

// Global singleton instance
let globalWriter: DebouncedSessionStoreWriter | null = null;

/**
 * Get or create the global debounced writer instance
 */
export function getDebouncedSessionStoreWriter(
  config?: DebouncedStoreConfig,
): DebouncedSessionStoreWriter {
  if (!globalWriter) {
    globalWriter = new DebouncedSessionStoreWriter(config);
  }
  return globalWriter;
}

/**
 * Write to session store with debouncing
 */
export async function debouncedSaveSessionStore(
  storePath: string,
  store: Record<string, SessionEntry>,
  opts?: SaveSessionStoreOptions,
): Promise<void> {
  const writer = getDebouncedSessionStoreWriter();
  await writer.write(storePath, store, opts);
}

/**
 * Flush all pending session writes
 */
export async function flushDebouncedSessionWrites(): Promise<void> {
  if (globalWriter) {
    await globalWriter.flushAll();
  }
}

/**
 * Get debounced writer statistics
 */
export function getDebouncedSessionStoreStats(): {
  totalCoalesced: number;
  totalWrites: number;
  pendingPaths: number;
  reductionPercent: number;
} | null {
  return globalWriter?.getStats() ?? null;
}

/**
 * Check if debounced writing is enabled via environment variable
 */
export function isDebouncedWriteEnabled(): boolean {
  const envValue = process.env.SECURECLAW_DEBOUNCED_SESSION_WRITES;
  return envValue === "true" || envValue === "1";
}
