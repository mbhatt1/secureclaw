/**
 * Buffered file logger for reduced disk I/O
 *
 * Batches log entries and writes them in larger chunks to reduce
 * the number of disk operations. Suitable for Raspberry Pi deployments
 * where SD card write endurance is a concern.
 */

import fs from "node:fs";
import path from "node:path";
import { createSubsystemLogger } from "../logging/subsystem.js";

const log = createSubsystemLogger("buffered-logger");

export type BufferedLoggerConfig = {
  /** Path to log file */
  filePath: string;
  /** Maximum buffer size before forced flush */
  maxBufferSize?: number;
  /** Maximum time (ms) before forced flush */
  flushIntervalMs?: number;
  /** Enable compression for rotated logs */
  enableCompression?: boolean;
  /** Compress logs older than this (ms) */
  compressionAgeMs?: number;
};

const DEFAULT_CONFIG = {
  maxBufferSize: 100,
  flushIntervalMs: 5000,
  enableCompression: true,
  compressionAgeMs: 60 * 60 * 1000, // 1 hour
};

export class BufferedFileLogger {
  private buffer: string[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly config: Required<BufferedLoggerConfig>;
  private flushing = false;
  private closed = false;
  private totalWrites = 0;
  private totalBytesWritten = 0;
  private lastFlushAt = 0;

  constructor(config: BufferedLoggerConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Ensure directory exists
    const dir = path.dirname(this.config.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Set up graceful shutdown
    this.setupShutdownHooks();
  }

  /**
   * Append a log entry to the buffer
   */
  append(line: string): void {
    if (this.closed) {
      // Silently ignore writes after close
      return;
    }

    this.buffer.push(line);

    // Check if we need to flush
    if (this.buffer.length >= this.config.maxBufferSize) {
      void this.flush();
    } else {
      this.scheduleFlush();
    }
  }

  /**
   * Schedule a flush if not already scheduled
   */
  private scheduleFlush(): void {
    if (this.flushTimer) {
      return;
    }

    this.flushTimer = setTimeout(() => {
      void this.flush();
    }, this.config.flushIntervalMs);

    // Allow Node.js to exit even with timer running
    this.flushTimer.unref();
  }

  /**
   * Flush buffered entries to disk
   */
  async flush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.buffer.length === 0) {
      return;
    }
    if (this.flushing) {
      return;
    } // Prevent concurrent flushes

    this.flushing = true;

    const entries = this.buffer.slice();
    this.buffer = [];

    try {
      const content = entries.join("\n") + "\n";
      const bytes = Buffer.byteLength(content, "utf8");

      await fs.promises.appendFile(this.config.filePath, content, {
        encoding: "utf8",
      });

      this.totalWrites++;
      this.totalBytesWritten += bytes;
      this.lastFlushAt = Date.now();

      if (this.totalWrites % 100 === 0) {
        log.debug("buffered logger stats", {
          writes: this.totalWrites,
          bytesWritten: this.totalBytesWritten,
          bufferSize: entries.length,
          avgBytesPerWrite: Math.round(this.totalBytesWritten / this.totalWrites),
        });
      }
    } catch (err) {
      // Log to console as fallback (can't use file logger)
      console.error("buffered logger flush failed:", err);

      // Put entries back in buffer for retry
      this.buffer.unshift(...entries);
    } finally {
      this.flushing = false;
    }
  }

  /**
   * Get logger statistics
   */
  getStats(): {
    totalWrites: number;
    totalBytesWritten: number;
    bufferSize: number;
    lastFlushAt: number;
  } {
    return {
      totalWrites: this.totalWrites,
      totalBytesWritten: this.totalBytesWritten,
      bufferSize: this.buffer.length,
      lastFlushAt: this.lastFlushAt,
    };
  }

  /**
   * Set up graceful shutdown to flush remaining logs
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
   * Close the logger and flush remaining entries
   */
  async close(): Promise<void> {
    if (this.closed) {
      return;
    }

    this.closed = true;

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    // Flush any remaining entries
    await this.flush();

    log.debug("buffered logger closed", {
      totalWrites: this.totalWrites,
      totalBytesWritten: this.totalBytesWritten,
    });
  }
}

/**
 * Create a buffered logger instance
 */
export function createBufferedLogger(config: BufferedLoggerConfig): BufferedFileLogger {
  return new BufferedFileLogger(config);
}
