/**
 * Session store write buffer for reduced disk I/O
 *
 * Coalesces rapid session updates to reduce write frequency
 * while maintaining acceptable data freshness.
 */

import type { SessionEntry } from "../config/sessions/types.js";
import { saveSessionStore } from "../config/sessions/store.js";
import { createSubsystemLogger } from "../logging/subsystem.js";

const log = createSubsystemLogger("session-store-buffer");

export type SessionStoreBufferConfig = {
  /** Debounce time in milliseconds */
  debounceMs?: number;
  /** Force flush after this many pending stores */
  maxPendingStores?: number;
};

const DEFAULT_CONFIG = {
  debounceMs: 2000,
  maxPendingStores: 10,
};

export class SessionStoreBuffer {
  private pending = new Map<string, Record<string, SessionEntry>>();
  private timers = new Map<string, NodeJS.Timeout>();
  private readonly config: Required<SessionStoreBufferConfig>;
  private totalWrites = 0;
  private totalCoalesced = 0;
  private closed = false;

  constructor(config: SessionStoreBufferConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Schedule a session store write
   * Coalesces rapid writes to the same store path
   */
  scheduleWrite(
    storePath: string,
    store: Record<string, SessionEntry>,
    opts?: { activeSessionKey?: string; immediate?: boolean },
  ): void {
    if (this.closed) {
      log.warn("session store buffer is closed, ignoring write");
      return;
    }

    // Immediate writes bypass buffering
    if (opts?.immediate) {
      void this.performWrite(storePath, store, opts).catch((err) => {
        log.error("immediate session write failed", {
          storePath,
          error: String(err),
        });
      });
      return;
    }

    // Check if we already have a pending write for this store
    const hadPending = this.pending.has(storePath);

    // Update pending data (overwrites previous pending write)
    this.pending.set(storePath, store);

    if (hadPending) {
      this.totalCoalesced++;
    }

    // Clear existing timer
    const existingTimer = this.timers.get(storePath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Force flush if too many pending stores
    if (this.pending.size >= this.config.maxPendingStores) {
      void this.flushAll();
      return;
    }

    // Schedule new timer
    const timer = setTimeout(() => {
      void this.flushStore(storePath, opts).catch((err) => {
        log.error("buffered session write failed", {
          storePath,
          error: String(err),
        });
      });
    }, this.config.debounceMs);

    // Allow Node.js to exit even with timer running
    timer.unref();

    this.timers.set(storePath, timer);
  }

  /**
   * Flush a specific store immediately
   */
  private async flushStore(storePath: string, opts?: { activeSessionKey?: string }): Promise<void> {
    const timer = this.timers.get(storePath);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(storePath);
    }

    const data = this.pending.get(storePath);
    if (!data) {
      return;
    }

    this.pending.delete(storePath);

    await this.performWrite(storePath, data, opts);
  }

  /**
   * Flush all pending stores
   */
  private async flushAll(): Promise<void> {
    const stores = Array.from(this.pending.keys());

    for (const storePath of stores) {
      await this.flushStore(storePath).catch((err) => {
        log.error("flush failed", { storePath, error: String(err) });
      });
    }
  }

  /**
   * Perform the actual write
   */
  private async performWrite(
    storePath: string,
    store: Record<string, SessionEntry>,
    opts?: { activeSessionKey?: string },
  ): Promise<void> {
    this.totalWrites++;

    await saveSessionStore(storePath, store, {
      activeSessionKey: opts?.activeSessionKey,
    });

    if (this.totalWrites % 50 === 0) {
      log.debug("session store buffer stats", {
        totalWrites: this.totalWrites,
        totalCoalesced: this.totalCoalesced,
        coalescenceRate:
          this.totalWrites > 0
            ? ((this.totalCoalesced / (this.totalWrites + this.totalCoalesced)) * 100).toFixed(1)
            : 0,
      });
    }
  }

  /**
   * Get buffer statistics
   */
  getStats(): {
    totalWrites: number;
    totalCoalesced: number;
    pendingStores: number;
    coalescenceRate: number;
  } {
    const total = this.totalWrites + this.totalCoalesced;
    return {
      totalWrites: this.totalWrites,
      totalCoalesced: this.totalCoalesced,
      pendingStores: this.pending.size,
      coalescenceRate: total > 0 ? (this.totalCoalesced / total) * 100 : 0,
    };
  }

  /**
   * Close the buffer and flush all pending writes
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

    log.debug("session store buffer closed", this.getStats());
  }
}

/**
 * Create a session store buffer instance
 */
export function createSessionStoreBuffer(config?: SessionStoreBufferConfig): SessionStoreBuffer {
  return new SessionStoreBuffer(config);
}
